import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const usePeer = () => {
  const peerRef = useRef(null);
  const [peerId, setPeerId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const peer = new Peer(undefined, {
      host: "0.peerjs.com",
      port: 443,
      secure: true,
    });

    peer.on("open", (id) => {
      setPeerId(id);
      setIsReady(true);
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, []);

  return { peer: peerRef.current, peerId, isReady };
};

export default usePeer;
