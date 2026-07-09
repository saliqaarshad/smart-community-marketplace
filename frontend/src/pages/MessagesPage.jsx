import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, Check, CheckCheck, Image as ImageIcon } from 'lucide-react';
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

const formatTime = (date) =>
  new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const formatDateLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  if (isSameDay(d, today)) return `Today, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  if (isSameDay(d, yesterday)) return `Yesterday, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const groupMessagesByDay = (messages) => {
  const groups = [];
  let currentDay = null;
  let currentGroup = null;

  messages.forEach((msg) => {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== currentDay) {
      currentDay = day;
      currentGroup = { date: msg.createdAt, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return groups;
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
      setIsOtherTyping(false);
      loadConversations();
    });

    socketRef.current.on('userTyping', () => setIsOtherTyping(true));
    socketRef.current.on('userStoppedTyping', () => setIsOtherTyping(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    setIsOtherTyping(false);

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
  }, [messages, isOtherTyping]);

  const selectConversation = (convo) => {
    setActiveConvo(convo);
    setSearchParams({ conversation: convo._id });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!activeConvo) return;

    socketRef.current?.emit('typing', { conversationId: activeConvo._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', { conversationId: activeConvo._id });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvo) return;

    socketRef.current?.emit('sendMessage', {
      conversationId: activeConvo._id,
      text: text.trim(),
    });
    socketRef.current?.emit('stopTyping', { conversationId: activeConvo._id });
    setText('');
  };

  const getOtherParticipant = (convo) =>
    convo.participants.find((p) => p._id !== user._id) || convo.participants[0];

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const messageGroups = groupMessagesByDay(messages);
  const otherParticipant = activeConvo ? getOtherParticipant(activeConvo) : null;
  const listingLink = activeConvo?.listingType && activeConvo?.listing
    ? activeConvo.listingType === 'Product'
      ? `/products/${activeConvo.listing._id}`
      : `/services/${activeConvo.listing._id}`
    : null;

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
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold overflow-hidden">
                      {other?.profilePicture ? (
                        <img src={other.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        other?.fullName?.charAt(0).toUpperCase()
                      )}
                    </div>
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
                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold overflow-hidden shrink-0">
                  {otherParticipant?.profilePicture ? (
                    <img src={otherParticipant.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    otherParticipant?.fullName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-text truncate">{otherParticipant?.fullName}</p>
                  {activeConvo.listing?.title && listingLink ? (
                    <Link to={listingLink} className="text-xs text-primary hover:underline">
                      Re: {activeConvo.listing.title}
                    </Link>
                  ) : (
                    <p className="text-xs text-muted">Community chat</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-bg">
                {messageGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-muted bg-white border border-border px-3 py-1 rounded-full">
                        {formatDateLabel(group.date)}
                      </span>
                    </div>
                    {group.messages.map((msg) => {
                      const isMine = msg.sender._id === user._id;
                      return (
                        <div key={msg._id} className={`flex items-end gap-2 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {!isMine && (
                            <div className="w-7 h-7 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                              {msg.sender.profilePicture ? (
                                <img src={msg.sender.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                msg.sender.fullName?.charAt(0).toUpperCase()
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl text-sm ${
                                isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-text border border-border rounded-bl-sm'
                              }`}
                            >
                              {msg.text}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-[11px] text-muted ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMine && (
                                msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )
                              )}
                            </div>
                          </div>

                          {isMine && (
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                              {user.profilePicture ? (
                                <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.fullName?.charAt(0).toUpperCase()
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {isOtherTyping && (
                  <div className="flex items-end gap-2 mb-3 justify-start">
                    <div className="w-7 h-7 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                      {otherParticipant?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-border bg-white">
                <button type="button" className="text-muted hover:text-text transition shrink-0" title="Image sharing coming soon">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={text}
                  onChange={handleTextChange}
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