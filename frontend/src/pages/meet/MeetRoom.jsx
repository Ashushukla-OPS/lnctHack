import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import usePeer from '../../hooks/usePeer';
import useMeetSocket from '../../hooks/useMeetSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  MicrophoneIcon, 
  VideoCameraIcon, 
  PhoneXMarkIcon,
  ComputerDesktopIcon,
  UsersIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOffIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline';

const MeetRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meetInfo, setMeetInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Media states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Timer state
  const [timer, setTimer] = useState("00:00:00");

  const localVideoRef = useRef(null);
  const callsRef = useRef({}); // keep track of all ongoing calls

  const { peer, peerId, isReady } = usePeer();
  
  const handleMeetEnded = () => {
    toast('Meet ended by leader', { icon: '🛑' });
    stopAllMedia();
    setTimeout(() => {
      navigate(meetInfo ? `/teams/${meetInfo.team?._id || meetInfo.team}` : '/teams');
    }, 3000);
  };

  const { participants, emitJoin, emitLeave, emitToggleAudio, emitToggleVideo } = useMeetSocket(handleMeetEnded);

  useEffect(() => {
    const initMeet = async () => {
      try {
        const res = await axios.get(`/meet/room/${roomId}`);
        const info = res.data?.data || res.data;
        
        if (!info) {
          throw new Error("Invalid meeting room data received");
        }

        const tId = info.teamId?._id || info.teamId || info.team?._id || info.team;

        if (info.status === 'ended') {
          toast.error('This meet has ended');
          return navigate(tId ? `/teams/${tId}` : '/teams');
        }

        if (tId) {
          try {
            const teamRes = await axios.get(`/teams/${tId}`);
            info.team = teamRes.data?.team || teamRes.data?.data || teamRes.data;
          } catch (teamErr) {
            console.error("Failed to fetch team details for meet", teamErr);
          }
        }

        setMeetInfo(info);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        toast.error('Camera/mic access denied or failed to load meet');
        navigate('/teams');
      } finally {
        setLoading(false);
      }
    };

    initMeet();
    
    return () => {
      stopAllMedia();
      emitLeave(roomId);
      if (peer) peer.destroy();
    };
  }, [roomId]);

  // Peer & Socket Join logic
  useEffect(() => {
    if (isReady && peerId && localStream && meetInfo) {
      emitJoin(roomId, peerId, user.name);
    }
  }, [isReady, peerId, localStream, meetInfo, roomId, emitJoin, user.name]);

  // Handle outgoing calls to new participants
  useEffect(() => {
    if (!peer || !localStream) return;
    
    // Check for new participants that we haven't called yet
    participants.forEach(p => {
      if (p.userId !== user._id && p.peerId && !callsRef.current[p.peerId]) {
        const call = peer.call(p.peerId, localStream);
        callsRef.current[p.peerId] = call;
        
        call.on('stream', (userVideoStream) => {
          setRemoteStreams(prev => ({ ...prev, [p.userId]: userVideoStream }));
        });
        
        call.on('close', () => {
          setRemoteStreams(prev => {
            const copy = { ...prev };
            delete copy[p.userId];
            return copy;
          });
          delete callsRef.current[p.peerId];
        });
      }
    });
  }, [participants, peer, localStream, user._id]);

  // Handle incoming calls
  useEffect(() => {
    if (!peer || !localStream) return;
    
    const handleCall = (call) => {
      call.answer(localStream);
      
      // Find who is calling us based on peerId from participants list
      const caller = participants.find(p => p.peerId === call.peer);
      
      call.on('stream', (userVideoStream) => {
        if (caller) {
          setRemoteStreams(prev => ({ ...prev, [caller.userId]: userVideoStream }));
        }
      });

      callsRef.current[call.peer] = call;
    };

    peer.on('call', handleCall);
    return () => {
      peer.off('call', handleCall);
    };
  }, [peer, localStream, participants]);

  // Handle participant leave cleanup
  useEffect(() => {
    // If a remote stream exists but the user is no longer in participants, remove it
    setRemoteStreams(prev => {
      const copy = { ...prev };
      let changed = false;
      Object.keys(copy).forEach(userId => {
        if (!participants.find(p => p.userId === userId) && userId !== user._id) {
          delete copy[userId];
          changed = true;
        }
      });
      return changed ? copy : prev;
    });
  }, [participants, user._id]);

  // Timer logic
  useEffect(() => {
    if (!meetInfo?.startedAt) return;
    
    const interval = setInterval(() => {
      const diff = new Date() - new Date(meetInfo.startedAt);
      if (diff < 0) return;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimer(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [meetInfo]);

  const stopAllMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const handleEndMeet = async () => {
    if (!window.confirm("End this meet for everyone?")) return;
    try {
      await axios.patch(`/meet/end/${roomId}`);
      // Socket event will redirect everyone
    } catch (error) {
      toast.error('Failed to end meet');
    }
  };

  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      emitToggleAudio(roomId, !audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      emitToggleVideo(roomId, !videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Revert to camera
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        const oldVideoTrack = localStream.getVideoTracks()[0];
        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        
        localStream.addTrack(newVideoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        
        // Replace track in all peers
        Object.values(callsRef.current).forEach(call => {
          const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(newVideoTrack);
        });
        
        setIsScreenSharing(false);
      } else {
        // Start screen share
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          toggleScreenShare(); // revert when stopped via browser UI
        };

        const oldVideoTrack = localStream.getVideoTracks()[0];
        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        
        localStream.addTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        
        // Replace track in all peers
        Object.values(callsRef.current).forEach(call => {
          const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast.error('Screen sharing cancelled or failed');
    }
  };

  const handleLeave = () => {
    stopAllMedia();
    emitLeave(roomId);
    if (peer) peer.destroy();
    navigate(`/teams/${meetInfo?.team?._id || meetInfo?.team}`);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-main"><LoadingSpinner /></div>;
  if (!meetInfo) return null;

  const isLeader = meetInfo.team?.leader === user?._id || meetInfo.team?.leader?._id === user?._id;
  const activeParticipantsCount = participants.length > 0 ? participants.length : 1; // including self

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col font-sans">
      
      {/* Top Bar */}
      <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg text-primary tracking-tight">ProvenStack Meet</div>
          <div className="h-4 w-[1px] bg-border mx-2"></div>
          <div className="text-text-primary font-medium truncate max-w-[200px] sm:max-w-md">{meetInfo.title || 'Team Meeting'}</div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-text-muted text-sm font-mono bg-input px-3 py-1.5 rounded-lg border border-border">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
            {timer}
          </div>
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <UsersIcon className="w-5 h-5" />
            <span className="font-medium">{activeParticipantsCount}</span>
          </div>
          {isLeader && (
            <button onClick={handleEndMeet} className="border border-danger text-danger hover:bg-danger hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              End Meet
            </button>
          )}
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-4 overflow-hidden relative">
        
        {/* Main Video (Local or Active Speaker - Here just Local for simplicity unless clicked) */}
        <div className="flex-1 bg-main border border-border rounded-2xl overflow-hidden relative flex items-center justify-center group shadow-lg">
           {isVideoOff ? (
             <div className="w-32 h-32 rounded-full bg-primary/20 text-primary border-4 border-card flex items-center justify-center text-5xl font-black">
               {user.name?.charAt(0)}
             </div>
           ) : (
             <video
               ref={localVideoRef}
               autoPlay
               muted
               playsInline
               className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
             />
           )}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2">
             You (Local)
             {isMuted && <MicOffIcon className="w-4 h-4 text-danger" />}
           </div>
        </div>

        {/* Remote Grid */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-row lg:flex-col gap-4 overflow-auto scrollbar-hide py-2 lg:py-0">
          {Object.entries(remoteStreams).map(([uId, stream]) => {
            const p = participants.find(part => part.userId === uId);
            return (
              <div key={uId} className="w-48 lg:w-full h-32 lg:h-48 shrink-0 bg-card border border-border rounded-xl overflow-hidden relative shadow-sm flex items-center justify-center">
                 {p?.isVideoOff ? (
                   <div className="w-16 h-16 rounded-full bg-input text-text-muted border border-border flex items-center justify-center text-2xl font-bold">
                     {p.name?.charAt(0)}
                   </div>
                 ) : (
                   <RemoteVideo stream={stream} />
                 )}
                 <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium flex items-center gap-1.5 max-w-[90%]">
                   <span className="truncate">{p?.name || 'Participant'}</span>
                   {p?.isMuted && <MicOffIcon className="w-3 h-3 text-danger shrink-0" />}
                 </div>
              </div>
            );
          })}
          {Object.keys(remoteStreams).length === 0 && (
             <div className="w-full h-full min-h-[120px] bg-card border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted p-4 text-center">
               <UsersIcon className="w-8 h-8 mb-2 opacity-50" />
               <p className="text-sm">Waiting for others to join...</p>
             </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-20 bg-card border-t border-border flex items-center justify-center gap-4 shrink-0 px-4">
         <button 
           onClick={toggleMic}
           className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
             isMuted ? 'bg-danger text-white' : 'bg-input text-text-primary hover:bg-input/80 border border-border'
           }`}
           title={isMuted ? "Unmute" : "Mute"}
         >
           {isMuted ? <NoSymbolIcon className="w-6 h-6 absolute opacity-50" /> : null}
           {isMuted ? <MicOffIcon className="w-5 h-5 z-10" /> : <MicrophoneIcon className="w-5 h-5" />}
         </button>
         
         <button 
           onClick={toggleCamera}
           className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
             isVideoOff ? 'bg-danger text-white' : 'bg-input text-text-primary hover:bg-input/80 border border-border'
           }`}
           title={isVideoOff ? "Turn on camera" : "Turn off camera"}
         >
           {isVideoOff ? <NoSymbolIcon className="w-6 h-6 absolute opacity-50" /> : null}
           {isVideoOff ? <VideoCameraSlashIcon className="w-5 h-5 z-10" /> : <VideoCameraIcon className="w-5 h-5" />}
         </button>

         <button 
           onClick={toggleScreenShare}
           className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
             isScreenSharing ? 'bg-success text-white' : 'bg-input text-text-primary hover:bg-input/80 border border-border'
           }`}
           title="Share Screen"
         >
           <ComputerDesktopIcon className="w-5 h-5" />
         </button>

         <div className="w-px h-8 bg-border mx-2"></div>

         <button 
           onClick={handleLeave}
           className="h-10 px-6 rounded-full flex items-center justify-center transition-colors bg-danger text-white hover:bg-danger/90 font-medium text-sm shadow-lg shadow-danger/20"
           title="Leave Meet"
         >
           <PhoneXMarkIcon className="w-5 h-5 mr-2" />
           Leave
         </button>
      </div>

    </div>
  );
};

// Extracted remote video component to handle stream assignment reliably
const RemoteVideo = ({ stream }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
};

export default MeetRoom;
