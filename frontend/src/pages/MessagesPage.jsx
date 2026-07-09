import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeConvoId = searchParams.get('conversation');

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.data);
      if (activeConvoId) {
        const found = res.data.data.find((c) => c._id === activeConvoId);
        if (found) setActiveConvo(found);
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
    });

    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => {
        if (message.conversation !== (activeConvo?._id || activeConvoId)) return prev;
        return [...prev, message];
      });
      loadConversations();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeConvo) return;

    socketRef.current?.emit('joinConversation', activeConvo._id);

    const loadMessages = async () => {
      try {
        const res = await api.get(`/conversations/${activeConvo._id}/messages`);
        setMessages(res.data.data);
        loadConversations();
      } catch (error) {
        console.error('Failed to load messages', error);
      }
    };
    loadMessages();

    return () => {
      socketRef.current?.emit('leaveConversation', activeConvo._id);
    };
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (convo) => {
    setActiveConvo(convo);
    setSearchParams({ conversation: convo._id });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvo) return;

    socketRef.current?.emit('sendMessage', {
      conversationId: activeConvo._id,
      text: text.trim(),
    });
    setText('');
  };

  const getOtherParticipant = (convo) =>
    convo.participants.find((p) => p._id !== user._id) || convo.participants[0];

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="h-screen flex flex-col bg-bg">
      <Navbar />

      <div className="flex-1 flex overflow-hidden max-w-[1400px] w-full mx-auto border-x border-border">
        <div className={`w-full sm:w-80 shrink-0 border-r border-border bg-white overflow-y-auto ${activeConvo ? 'hidden sm:block' : 'block'}`}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-text">Messages</h2>
            {totalUnread > 0 && (
              <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-4 text-sm text-muted">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted">No conversations yet.</div>
          ) : (
            conversations.map((convo) => {
              const other = getOtherParticipant(convo);
              const hasUnread = convo.unreadCount > 0;
              return (
                <button
                  key={convo._id}
                  onClick={() => selectConversation(convo)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bg transition ${
                    activeConvo?._id === convo._id ? 'bg-primary-soft' : ''
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold overflow-hidden shrink-0">
                    {other?.profilePicture ? (
                      <img src={other.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      other?.fullName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${hasUnread ? 'font-bold text-text' : 'font-semibold text-text'}`}>
                        {other?.fullName}
                      </p>
                      <span className="text-xs text-muted shrink-0">{timeAgo(convo.lastMessageAt)}</span>
                    </div>
                    {convo.listing?.title && (
                      <span className="inline-block text-[11px] font-medium text-primary bg-primary-soft px-1.5 py-0.5 rounded mt-0.5 mb-0.5">
                        Re: {convo.listing.title}
                      </span>
                    )}
                    <p className={`text-xs truncate ${hasUnread ? 'text-text font-medium' : 'text-muted'}`}>
                      {convo.lastMessage || 'Start the conversation'}
                    </p>
                  </div>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <div className={`flex-1 flex flex-col ${activeConvo ? 'flex' : 'hidden sm:flex'}`}>
          {!activeConvo ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
                <button onClick={() => setActiveConvo(null)} className="sm:hidden text-muted">‹</button>
                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold overflow-hidden">
                  {getOtherParticipant(activeConvo)?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-text">{getOtherParticipant(activeConvo)?.fullName}</p>
                  {activeConvo.listing?.title && (
                    <p className="text-xs text-muted">Re: {activeConvo.listing.title}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-bg">
                {messages.map((msg) => {
                  const isMine = msg.sender._id === user._id;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-text border border-border rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-border bg-white">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-light transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;