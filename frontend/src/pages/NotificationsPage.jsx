import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, Star, CheckCircle, XCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const iconConfig = {
  booking_request: { icon: Calendar, color: 'text-primary border-primary bg-primary-soft' },
  booking_accepted: { icon: CheckCircle, color: 'text-green-600 border-green-500 bg-green-50' },
  booking_rejected: { icon: XCircle, color: 'text-red-600 border-red-500 bg-red-50' },
  booking_completed: { icon: CheckCircle, color: 'text-green-600 border-green-500 bg-green-50' },
  booking_cancelled: { icon: XCircle, color: 'text-gray-500 border-gray-400 bg-gray-50' },
  new_message: { icon: MessageSquare, color: 'text-blue-600 border-blue-500 bg-blue-50' },
  new_review: { icon: Star, color: 'text-amber-600 border-amber-500 bg-amber-50' },
  listing_approved: { icon: CheckCircle, color: 'text-green-600 border-green-500 bg-green-50' },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const routeForNotification = (notification) => {
  switch (notification.type) {
    case 'booking_request':
    case 'booking_accepted':
    case 'booking_rejected':
    case 'booking_completed':
    case 'booking_cancelled':
      return '/bookings';
    case 'new_message':
      return `/messages?conversation=${notification.relatedId}`;
    case 'new_review':
      return '/dashboard';
    case 'listing_approved':
      return '/dashboard';
    default:
      return null;
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        // fail silently, navigation still proceeds
      }
    }
    const route = routeForNotification(notification);
    if (route) navigate(route);
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-text">Notifications</h1>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-muted hover:text-primary transition tracking-wide uppercase"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-muted text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {notifications.map((notification, i) => {
              const config = iconConfig[notification.type] || { icon: Bell, color: 'text-muted border-border bg-bg' };
              const Icon = config.icon;
              return (
                <button
                  key={notification._id}
                  onClick={() => handleClick(notification)}
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-bg transition ${
                    i !== notifications.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text leading-snug">
                      <span className="font-semibold">{notification.title}</span>
                      {' — '}
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted mt-1">{timeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted mt-6">
          Older notifications are archived after 30 days.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default NotificationsPage;