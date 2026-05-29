import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Dynamically retrieve URL or fallback to current host port 3000 (backend server default)
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    socketRef.current = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};

export default useSocket;
