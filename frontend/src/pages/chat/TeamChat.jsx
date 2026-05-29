import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useSocket from "../../hooks/useSocket";
import axios from "../../utils/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";

const TeamChat = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const messagesEndRef = useRef(null);

  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamAndMessages = async () => {
      try {
        setLoading(true);
        const [teamRes, msgRes] = await Promise.all([
          axios.get(`/teams/${teamId}`),
          axios.get(`/message/${teamId}`),
        ]);
        setTeam(teamRes.data?.team || teamRes.data?.data || teamRes.data);
        setMessages(msgRes.data?.data || msgRes.data?.messages || msgRes.data || []);
      } catch (err) {
        toast.error("Failed to load lounge data");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    if (teamId) {
      fetchTeamAndMessages();
    }
  }, [teamId, navigate]);

  useEffect(() => {
    if (!socket || !teamId) return;

    socket.emit("join_room", teamId);

    const handleNewMessage = (message) => {
      if (message.teamId === teamId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.emit("leave_room", teamId);
      socket.off("receive_message", handleNewMessage);
    };
  }, [socket, teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(`/message/send/${teamId}`, {
        content: newMessage,
      });
      // Emitted message is handled via socket listener as well
      const sentMsg = res.data?.data || res.data;
      socket.emit("send_message", { ...sentMsg, teamId });
      setNewMessage("");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 py-6">
      <div className="flex-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-[#141414] flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-text-primary">💬 {team?.name} Lounge</h2>
            <p className="text-xs text-text-muted">Chat with your hackathon squad members in real-time</p>
          </div>
          <button
            onClick={() => navigate(`/meet/${teamId}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-primary/20"
          >
            <span>📹</span>
            <span>Start Video Meet</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#121212]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-2">
              <span className="text-4xl">👋</span>
              <p className="text-sm">Say hello to your teammates! Chat is fully secure.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
              return (
                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 ${isMe ? "bg-primary text-white rounded-tr-none" : "bg-input text-text-primary rounded-tl-none border border-border"}`}>
                    {!isMe && (
                      <p className="text-[10px] text-accent font-bold mb-1 uppercase tracking-wider">
                        {msg.senderName || msg.sender?.name || "Teammate"}
                      </p>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className="text-[9px] text-right mt-1 opacity-70">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-[#141414] flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a secure message to your team lounge..."
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary hover:bg-opacity-90 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary/20"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;
