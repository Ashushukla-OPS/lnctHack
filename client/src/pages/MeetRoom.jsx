import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePeer } from "../hooks/usePeer";
import { useMeetSocket } from "../hooks/useMeetSocket";

/**
 * MeetRoom page component (Google Meet style layout).
 * Integrates WebRTC P2P (PeerJS) streams with Socket.io real-time mute/video controls.
 */
export const MeetRoom = ({ socket, currentUser }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetTitle, setMeetTitle] = useState("Team Sync");
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const screenTrackRef = useRef(null);

  const { peerId, peer, isReady: isPeerReady } = usePeer();

  // Socket wrapper
  const {
    participants,
    emitJoin,
    emitLeave,
    emitToggleAudio,
    emitToggleVideo,
  } = useMeetSocket(socket, roomId, currentUser._id, currentUser.name);

  // Initialize camera and microphone
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Camera permission error:", err);
        setCameraError(
          "Could not access your camera or microphone. Please check system permissions."
        );
      });

    return () => {
      // Cleanup tracks on unmount
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Join meeting when Peer & Stream are both ready
  useEffect(() => {
    if (isPeerReady && peer && localStream) {
      // 1. Emit socket join event
      emitJoin(peerId);

      // 2. Answer incoming calls from existing room members
      peer.on("call", (call) => {
        call.answer(localStream);
        call.on("stream", (remoteStream) => {
          // Store remote stream
          setRemoteStreams((prev) => ({
            ...prev,
            [call.peer]: remoteStream,
          }));
        });
        peersRef.current[call.peer] = call;
      });
    }
  }, [isPeerReady, peer, localStream, peerId]);

  // Call new participant when they join
  useEffect(() => {
    if (!peer || !localStream) return;

    // Detect if a participant is not called yet
    Object.values(participants).forEach((participant) => {
      const { peerId: remotePeerId, userId: remoteUserId } = participant;

      if (remotePeerId && !peersRef.current[remotePeerId] && remotePeerId !== peerId) {
        console.log("Calling peer: ", remotePeerId);
        const call = peer.call(remotePeerId, localStream);

        call.on("stream", (remoteStream) => {
          setRemoteStreams((prev) => ({
            ...prev,
            [remotePeerId]: remoteStream,
          }));
        });

        call.on("close", () => {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[remotePeerId];
            return next;
          });
        });

        peersRef.current[remotePeerId] = call;
      }
    });
  }, [participants, peer, localStream, peerId]);

  // Handle clean removal when other users leave
  useEffect(() => {
    // Check if any peer in peersRef has left participants
    const activePeerIds = Object.values(participants).map((p) => p.peerId);
    Object.keys(peersRef.current).forEach((peerIdKey) => {
      if (!activePeerIds.includes(peerIdKey) && peerIdKey !== peerId) {
        if (peersRef.current[peerIdKey]) {
          peersRef.current[peerIdKey].close();
        }
        delete peersRef.current[peerIdKey];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[peerIdKey];
          return next;
        });
      }
    });
  }, [participants, peerId]);

  // Listen for meet-ended globally
  useEffect(() => {
    if (!socket) return;

    socket.on("meet-ended", () => {
      alert("This meeting was ended by the team leader.");
      leaveRoom();
    });

    return () => {
      socket.off("meet-ended");
    };
  }, [socket]);

  // Leave room action
  const leaveRoom = () => {
    emitLeave();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    // Navigate back to dashboard or team page
    navigate("/dashboard");
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        emitToggleAudio(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video On/Off
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        emitToggleVideo(!videoTrack.enabled);
      }
    }
  };

  // Handle Screen Sharing
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = stream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace track in peer connections
        Object.values(peersRef.current).forEach((call) => {
          const sender = call.peerConnection
            .getSenders()
            .find((s) => s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Set local stream preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenSharing();
      }
    } catch (err) {
      console.error("Error screen sharing:", err);
    }
  };

  const stopScreenSharing = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStream) {
      const originalVideoTrack = localStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((call) => {
        const sender = call.peerConnection
          .getSenders()
          .find((s) => s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(originalVideoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    setIsScreenSharing(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-white overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-base md:text-lg font-bold tracking-wide">{meetTitle}</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Room: {roomId}
          </span>
        </div>
        <div className="text-sm font-semibold text-slate-400">
          Participants: {Object.keys(participants).length + 1}
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        {/* Main/Active Speaker Stream */}
        <div className="flex-1 bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
          {cameraError ? (
            <div className="text-center p-6 max-w-sm">
              <div className="h-12 w-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                ⚠️
              </div>
              <p className="text-sm text-slate-400">{cameraError}</p>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover transform -scale-x-100 ${isVideoOff ? "hidden" : ""}`}
            />
          )}

          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="h-24 w-24 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-400 uppercase tracking-widest shadow-lg shadow-indigo-600/10">
                {currentUser?.name?.substring(0, 2)}
              </div>
            </div>
          )}

          {/* Active Label */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-slate-800 text-xs font-semibold tracking-wide">
            {currentUser?.name} (You)
          </div>
        </div>

        {/* Remote Grid column */}
        <div className="w-full lg:w-80 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-slate-800 shrink-0">
          {Object.values(participants).map((participant) => {
            const remoteStream = remoteStreams[participant.peerId];

            return (
              <div
                key={participant.userId}
                className="h-32 lg:h-48 w-48 lg:w-full bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center shadow-lg"
              >
                {remoteStream && !participant.isVideoOff ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-300 uppercase">
                    {participant?.name?.substring(0, 2)}
                  </div>
                )}

                {/* Bottom label */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-semibold truncate max-w-[70%]">
                    {participant.name}
                  </span>
                  {participant.isMuted && (
                    <span className="h-5 w-5 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center text-[10px] text-rose-400">
                      🎤🚫
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="h-20 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-center px-6">
        <div className="flex items-center gap-4">
          {/* Mute Audio Button */}
          <button
            onClick={toggleMute}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
              isAudioMuted
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/10 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isAudioMuted ? "🔇" : "🎙️"}
          </button>

          {/* Hide Video Button */}
          <button
            onClick={toggleVideo}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
              isVideoOff
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/10 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? "🎥🚫" : "📹"}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
              isScreenSharing
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10 text-white animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={isScreenSharing ? "Stop Presenting" : "Present Screen"}
          >
            🖥️
          </button>

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="px-6 h-12 bg-rose-600 hover:bg-rose-500 rounded-full font-bold shadow-lg shadow-rose-600/15 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200"
            title="Leave Call"
          >
            <span>📞</span>
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetRoom;
