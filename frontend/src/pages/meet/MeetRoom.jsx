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
    <div className="h-screen w-full bg-[#0c0c0e] flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Ambient glowing backdrops */}
      <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="h-16 bg-[#141417]/85 border-b border-[#232329] backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="font-display font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 tracking-tight flex items-center gap-1.5">
            <span className="text-lg">⚡</span> lnctHack Meet
          </div>
          <div className="h-4 w-[1px] bg-[#232329]"></div>
          <div className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-md">{meetInfo.title || 'Team Meeting'}</div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Live countdown timer badge */}
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 shadow-sm shadow-rose-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            {timer}
          </div>
          <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold bg-[#1c1c21] border border-[#232329] px-3 py-1.5 rounded-full">
            <UsersIcon className="w-4 h-4 text-violet-400" />
            <span className="text-white font-extrabold">{activeParticipantsCount}</span>
          </div>
          {isLeader && (
            <button 
              onClick={handleEndMeet} 
              className="bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border border-rose-500/20 shadow-md shadow-rose-500/5"
            >
              End Meet
            </button>
          )}
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-5 overflow-hidden relative z-10">
        
        {/* Main Video (Local or Active Speaker) */}
        <div className="flex-1 bg-[#121215]/80 border border-[#232329] rounded-2xl overflow-hidden relative flex items-center justify-center group shadow-xl">
           {isVideoOff ? (
             <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center text-4xl font-black shadow-inner select-none">
               {user.name?.charAt(0).toUpperCase()}
             </div>
           ) : (
             <video
               ref={localVideoRef}
               autoPlay
               muted
               playsInline
               className={`w-full h-full object-cover rounded-2xl ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
             />
           )}
           <div className="absolute bottom-4 left-4 bg-[#101012]/80 backdrop-blur-md border border-[#232329] px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg">
             <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
             <span>You (Local)</span>
             {isMuted && <MicOffIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
           </div>
        </div>

        {/* Remote Grid Column */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-row lg:flex-col gap-4 overflow-auto scrollbar-hide py-2 lg:py-0">
          {Object.entries(remoteStreams).map(([uId, stream]) => {
            const p = participants.find(part => part.userId === uId);
            return (
              <div key={uId} className="w-52 lg:w-full h-36 lg:h-52 shrink-0 bg-[#141417]/85 border border-[#232329] rounded-2xl overflow-hidden relative shadow-lg flex items-center justify-center hover:border-violet-500/20 transition-all group">
                 {p?.isVideoOff ? (
                   <div className="w-16 h-16 rounded-full bg-[#1e1e24] border border-[#2c2c35] text-text-muted flex items-center justify-center text-2xl font-bold">
                     {p.name?.charAt(0).toUpperCase()}
                   </div>
                 ) : (
                   <RemoteVideo stream={stream} />
                 )}
                 <div className="absolute bottom-3 left-3 bg-[#101012]/80 backdrop-blur-md border border-[#232329] px-2.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 max-w-[90%] shadow-md">
                   <span className="truncate">{p?.name || 'Participant'}</span>
                   {p?.isMuted && <MicOffIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                 </div>
              </div>
            );
          })}
          {Object.keys(remoteStreams).length === 0 && (
             <div className="w-full lg:h-full min-h-[140px] bg-[#141417]/40 border border-dashed border-[#232329] rounded-2xl flex flex-col items-center justify-center text-text-muted p-6 text-center shadow-inner">
               <span className="text-3xl block mb-2 animate-bounce">👥</span>
               <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Squad Lounge</h4>
               <p className="text-[11px] text-text-muted font-medium max-w-[80%]">Waiting for team builders to connect streams...</p>
             </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Floating Dock */}
      <div className="h-20 bg-[#141417]/90 border-t border-[#232329] backdrop-blur-md flex items-center justify-center gap-4 shrink-0 px-6 z-10 relative">
         <button 
           onClick={toggleMic}
           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
             isMuted 
               ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-md shadow-rose-500/5' 
               : 'bg-[#1e1e24] hover:bg-[#25252d] text-white border border-[#2c2c35] hover:border-violet-500/30'
           }`}
           title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
         >
           {isMuted ? <MicOffIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5 text-violet-400" />}
         </button>
         
         <button 
           onClick={toggleCamera}
           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
             isVideoOff 
               ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-md shadow-rose-500/5' 
               : 'bg-[#1e1e24] hover:bg-[#25252d] text-white border border-[#2c2c35] hover:border-violet-500/30'
           }`}
           title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
         >
           {isVideoOff ? <VideoCameraSlashIcon className="w-5 h-5" /> : <VideoCameraIcon className="w-5 h-5 text-violet-400" />}
         </button>

         <button 
           onClick={toggleScreenShare}
           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
             isScreenSharing 
               ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5' 
               : 'bg-[#1e1e24] hover:bg-[#25252d] text-white border border-[#2c2c35] hover:border-violet-500/30'
           }`}
           title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
         >
           <ComputerDesktopIcon className={`w-5 h-5 ${isScreenSharing ? 'text-emerald-400 animate-pulse' : 'text-violet-400'}`} />
         </button>

         <div className="w-px h-6 bg-[#232329] mx-2"></div>

         <button 
           onClick={handleLeave}
           className="h-10 px-6 rounded-xl flex items-center justify-center transition-all duration-300 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-[0.98]"
           title="Leave Meeting"
         >
           <PhoneXMarkIcon className="w-4 h-4 mr-2" />
           Leave Meet
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
