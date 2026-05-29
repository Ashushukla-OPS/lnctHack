import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";

/**
 * Custom React hook to initialize and manage PeerJS connection.
 * Connects to public PeerJS server (0.peerjs.com).
 */
export const usePeer = () => {
  const [peerId, setPeerId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const peerRef = useRef(null);

  useEffect(() => {
    // Initialize PeerJS client with public PeerJS cloud settings
    const peer = new Peer(undefined, {
      host: "0.peerjs.com",
      port: 443,
      secure: true,
    });

    peerRef.current = peer;

    peer.on("open", (id) => {
      console.log("My PeerJS ID is: " + id);
      setPeerId(id);
      setIsReady(true);
    });

    peer.on("error", (error) => {
      console.error("PeerJS error:", error);
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        console.log("PeerJS connection destroyed");
      }
    };
  }, []);

  return {
    peerId,
    peer: peerRef.current,
    isReady,
  };
};
