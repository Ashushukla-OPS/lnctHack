import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Custom React hook to wrap Socket.io meeting room communication.
 * Assumes a socket instance is passed in or accessible globally.
 */
export const useMeetSocket = (socket, roomId, userId, userName) => {
  const [participants, setParticipants] = useState({});
  const participantsRef = useRef({});

  // Ensure refs stay in sync
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const emitJoin = useCallback(
    (peerId) => {
      if (socket && roomId && userId && peerId) {
        socket.emit("join-meet-room", {
          roomId,
          userId,
          peerId,
          name: userName,
        });
      }
    },
    [socket, roomId, userId, userName]
  );

  const emitLeave = useCallback(() => {
    if (socket && roomId && userId) {
      socket.emit("leave-meet-room", { roomId, userId });
    }
  }, [socket, roomId, userId]);

  const emitToggleAudio = useCallback(
    (isMuted) => {
      if (socket && roomId && userId) {
        socket.emit("toggle-audio", { roomId, userId, isMuted });
      }
    },
    [socket, roomId, userId]
  );

  const emitToggleVideo = useCallback(
    (isVideoOff) => {
      if (socket && roomId && userId) {
        socket.emit("toggle-video", { roomId, userId, isVideoOff });
      }
    },
    [socket, roomId, userId]
  );

  useEffect(() => {
    if (!socket || !roomId) return;

    // When another participant joins
    socket.on("user-joined-meet", ({ userId: joinedUserId, peerId, name }) => {
      setParticipants((prev) => ({
        ...prev,
        [joinedUserId]: {
          userId: joinedUserId,
          peerId,
          name,
          isMuted: false,
          isVideoOff: false,
        },
      }));
    });

    // When another participant leaves
    socket.on("user-left-meet", ({ userId: leftUserId }) => {
      setParticipants((prev) => {
        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
    });

    // When another participant toggles audio
    socket.on("toggle-audio", ({ userId: senderUserId, isMuted }) => {
      setParticipants((prev) => {
        if (!prev[senderUserId]) return prev;
        return {
          ...prev,
          [senderUserId]: {
            ...prev[senderUserId],
            isMuted,
          },
        };
      });
    });

    // When another participant toggles video
    socket.on("toggle-video", ({ userId: senderUserId, isVideoOff }) => {
      setParticipants((prev) => {
        if (!prev[senderUserId]) return prev;
        return {
          ...prev,
          [senderUserId]: {
            ...prev[senderUserId],
            isVideoOff,
          },
        };
      });
    });

    return () => {
      socket.off("user-joined-meet");
      socket.off("user-left-meet");
      socket.off("toggle-audio");
      socket.off("toggle-video");
    };
  }, [socket, roomId]);

  return {
    participants,
    emitJoin,
    emitLeave,
    emitToggleAudio,
    emitToggleVideo,
    setParticipants,
  };
};
export default useMeetSocket;
