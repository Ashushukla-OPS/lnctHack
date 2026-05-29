import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const useMeetSocket = (onMeetEnded) => {
  const socketRef = useRef(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace("/api", "");

    socketRef.current = io(socketUrl, {
      withCredentials: true,
      auth: { token }
    });

    const socket = socketRef.current;

    socket.on("user-joined-meet", (user) => {
      setParticipants(prev => {
        if (prev.find(p => p.userId === user.userId)) return prev;
        return [...prev, user];
      });
    });

    socket.on("user-left-meet", ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    });

    socket.on("toggle-audio", ({ userId, isMuted }) => {
      setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, isMuted } : p));
    });

    socket.on("toggle-video", ({ userId, isVideoOff }) => {
      setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, isVideoOff } : p));
    });

    socket.on("meet-ended", () => {
      if (onMeetEnded) onMeetEnded();
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [onMeetEnded]);

  const emitJoin = useCallback((roomId, peerId, name) => {
    if (socketRef.current) {
      socketRef.current.emit("join-meet-room", { roomId, peerId, name });
    }
  }, []);

  const emitLeave = useCallback((roomId) => {
    if (socketRef.current) {
      socketRef.current.emit("leave-meet-room", { roomId });
    }
  }, []);

  const emitToggleAudio = useCallback((roomId, isMuted) => {
    if (socketRef.current) {
      socketRef.current.emit("toggle-audio", { roomId, isMuted });
    }
  }, []);

  const emitToggleVideo = useCallback((roomId, isVideoOff) => {
    if (socketRef.current) {
      socketRef.current.emit("toggle-video", { roomId, isVideoOff });
    }
  }, []);

  return {
    participants,
    emitJoin,
    emitLeave,
    emitToggleAudio,
    emitToggleVideo
  };
};

export default useMeetSocket;
