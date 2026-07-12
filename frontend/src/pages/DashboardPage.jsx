import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, Heart, Inbox, Calendar as CalendarIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import ReviewModal from '../components/ReviewModal';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusStyles = {
  pending: 'border-amber-400 text-amber-600 bg-amber-50',
  accepted: 'border-blue-400 text-blue-600 bg-blue-50',
  completed: 'border-green-400 text-green-600 bg-green-50',
  rejected: 'border-red-400 text-red-600 bg-red-50',
  cancelled: 'border-gray-300 text-gray-500 bg-gray-50',
};

const overviewStatusLabel = {
  pending: 'Pending',
  accepted: 'Confirmed',
  completed: 'Finished',
  rejected: 'Cancelled',
  cancelled: 'Cancelled',
};

const overviewStatusColor = {
  pending: 'text-amber-600',
  accepted: 'text-primary',
  completed: 'text-green-600',
  rejected: 'text-muted',
  cancelled: 'text-muted',
};

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const BookingCard = ({ booking, viewAs, onAction, onReview }) => {
  const image = booking.listing?.images?.[0]?.url || booking.listing?.portfolioImages?.[0]?.url;
  const otherParty = viewAs === 'buyer' ? booking.seller : booking.buyer;
  const roleLabel = viewAs === 'buyer' ? 'Provider' : 'From';

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-full sm:w-16 h-32 sm:h-16 rounded-lg overflow-hidden bg-primary-soft shrink-0">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">No image</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text">{booking.listing?.title}</p>
        <p className="text-sm text-muted">{roleLabel}: {otherParty?.fullName}</p>
        {booking.preferredDate && (
          <p className="flex items-center gap-1 text-xs text-muted mt-1">
            <CalendarIcon className="w-3 h-3" />
            {new Date(booking.preferredDate).toLocaleDateString()}
            {booking.preferredTime && ` · ${booking.preferredTime}`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusStyles[booking.status]}`}>
          {booking.status}
        </span>

        {viewAs === 'seller' && booking.status === 'pending' && (
          <>
            <button
              onClick={() => onAction(booking._id, 'reject')}
              className="text-xs font-semibold border border-border px-3 py-1.5 rounded-full hover:bg-bg transition"
            >
              Decline
            </button>
            <button
              onClick={() => onAction(booking._id, 'accept')}
              className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary-light transition"
            >
              Accept
            </button>
          </>
        )}

        {viewAs === 'seller' && booking.status === 'accepted' && (
          <button
            onClick={() => onAction(booking._id, 'complete')}
            className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition"
          >
            Mark completed
          </button>
        )}

        {viewAs === 'buyer' && ['pending', 'accepted'].includes(booking.status) && (
          <button
            onClick={() => onAction(booking._id, 'cancel')}
            className="text-xs font-semibold border border-border px-3 py-1.5 rounded-full hover:bg-bg transition"
          >
            Cancel
          </button>
        )}

        {viewAs === 'buyer' && booking.status === 'completed' && (
          <button
            onClick={() => onReview(booking)}
            className="text-xs font-semibold border border-primary text-primary px-3 py-1.5 rounded-full hover:bg-primary-soft transition"
          >
            Leave a review
          </button>
        )}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [bookingView, setBookingView] = useState('buyer');
  const [statusFilter, setStatusFilter] = useState('all');
  const [myBookings, setMyBookings] = useState([]);
  const [received, setReceived] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewingBooking, setReviewingBooking] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, receivedRes, productsRes, servicesRes, favoritesRes, notificationsRes, conversationsRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/bookings/received'),
        api.get('/products/my-listings'),
        api.get('/services/my-listings'),
        api.get('/favorites'),
        api.get('/notifications'),
        api.get('/conversations'),
      ]);
      setMyBookings(bookingsRes.data.data);
      setReceived(receivedRes.data.data);
      setMyProducts(productsRes.data.data);
      setMyServices(servicesRes.data.data);
      setFavorites(favoritesRes.data.data);
      setNotifications(notificationsRes.data.data);
      const totalUnread = conversationsRes.data.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadMessages(totalUnread);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookingAction = async (bookingId, action) => {
    try {
      await api.put(`/bookings/${bookingId}/${action}`);
      toast.success('Updated');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const activeListings = [
    ...myProducts.map((p) => ({ ...p, _type: 'product' })),
    ...myServices.map((s) => ({ ...s, _type: 'service' })),
  ];
  const activeListingsCount = activeListings.filter((l) => l.isActive && l.isApproved).length;
  const pendingBookingsCount = received.filter((b) => b.status === 'pending').length;
  const monthlyEarnings = received
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const activeBookings = bookingView === 'buyer' ? myBookings : received;
  const filteredBookings =
    statusFilter === 'all' ? activeBookings : activeBookings.filter((b) => b.status === statusFilter);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === 'overview' ? (
          <>
            <h1 className="text-3xl font-extrabold text-text mb-1">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
            <p className="text-sm text-muted mb-6">Here's what's happening with your account</p>

            {loading ? (
              <div className="text-center py-16 text-muted">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white border border-border rounded-xl p-5">
                    <p className="text-xs text-muted mb-1">Active Listings</p>
                    <p className="text-2xl font-extrabold text-text">{activeListingsCount}</p>
                  </div>
                  <div className="bg-white border border-border rounded-xl p-5">
                    <p className="text-xs text-muted mb-1">Pending Bookings</p>
                    <p className="text-2xl font-extrabold text-text">{pendingBookingsCount}</p>
                  </div>
                  <div className="bg-white border border-border rounded-xl p-5">
                    <p className="text-xs text-muted mb-1">Unread Messages</p>
                    <p className="text-2xl font-extrabold text-primary">{unreadMessages}</p>
                  </div>
                  <div className="bg-white border border-border rounded-xl p-5">
                    <p className="text-xs text-muted mb-1">Total Earnings</p>
                    <p className="text-2xl font-extrabold text-text">Rs {monthlyEarnings.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h3 className="font-bold text-text">Active listings</h3>
                        <button onClick={() => setTab('listings')} className="text-sm font-semibold text-primary hover:underline">
                          Manage all
                        </button>
                      </div>
                      {activeListings.length === 0 ? (
                        <p className="text-sm text-muted px-5 py-6 text-center">No listings yet.</p>
                      ) : (
                        activeListings.slice(0, 3).map((item, i) => {
                          const image = item._type === 'product' ? item.images?.[0]?.url : item.portfolioImages?.[0]?.url;
                          return (
                            <div
                              key={item._id}
                              className={`flex items-center gap-3 px-5 py-3 ${i !== Math.min(activeListings.length, 3) - 1 ? 'border-b border-border' : ''}`}
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-soft shrink-0">
                                {image && <img src={image} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-text truncate">{item.title}</p>
                                <p className="text-xs text-muted">{item.category} · Rs {item.price?.toLocaleString()}</p>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${item.isApproved ? 'bg-primary-soft text-primary' : 'bg-amber-50 text-amber-600'}`}>
                                {item.isApproved ? 'Live' : 'Pending approval'}
                              </span>
                              <Link to={`/edit-listing/${item._id}${item._type === 'service' ? '?type=service' : ''}`} className="text-xs font-semibold text-primary hover:underline shrink-0">
                                Edit
                              </Link>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h3 className="font-bold text-text">Recent bookings</h3>
                        <button onClick={() => setTab('bookings')} className="text-sm font-semibold text-primary hover:underline">
                          View all
                        </button>
                      </div>
                      {myBookings.length === 0 ? (
                        <p className="text-sm text-muted px-5 py-6 text-center">No bookings yet.</p>
                      ) : (
                        myBookings.slice(0, 3).map((b, i) => (
                          <div
                            key={b._id}
                            className={`flex items-center justify-between px-5 py-3 ${i !== Math.min(myBookings.length, 3) - 1 ? 'border-b border-border' : ''}`}
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-text truncate">{b.listing?.title}</p>
                              <p className="text-xs text-muted">
                                {b.preferredDate ? new Date(b.preferredDate).toLocaleDateString() : new Date(b.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-semibold ${overviewStatusColor[b.status]}`}>
                                {overviewStatusLabel[b.status]}
                              </p>
                              <p className="text-xs text-muted">Rs {b.totalPrice?.toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h3 className="font-bold text-text">Notifications</h3>
                        <Link to="/notifications" className="text-sm font-semibold text-primary hover:underline">
                          View all
                        </Link>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted px-5 py-6 text-center">Nothing yet.</p>
                      ) : (
                        notifications.slice(0, 4).map((n, i) => (
                          <div
                            key={n._id}
                            className={`px-5 py-3 ${i !== Math.min(notifications.length, 4) - 1 ? 'border-b border-border' : ''}`}
                          >
                            <p className="text-sm text-text leading-snug">{n.message}</p>
                            <p className="text-xs text-muted mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h3 className="font-bold text-text">Favorites</h3>
                        <button onClick={() => setTab('favorites')} className="text-sm font-semibold text-primary hover:underline">
                          View all
                        </button>
                      </div>
                      {favorites.length === 0 ? (
                        <p className="text-sm text-muted px-5 py-6 text-center">No favorites yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 p-4">
                          {favorites.slice(0, 4).map((f) => {
                            const image = f.listing?.images?.[0]?.url || f.listing?.portfolioImages?.[0]?.url;
                            const link = f.listingType === 'Product' ? `/products/${f.listing?._id}` : `/services/${f.listing?._id}`;
                            return (
                              <Link key={f._id} to={link} className="aspect-square rounded-lg overflow-hidden bg-primary-soft">
                                {image && <img src={image} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setTab('overview')}
              className="text-sm font-semibold text-muted hover:text-primary transition mb-4"
            >
              ‹ Back to overview
            </button>

            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
              {[
                { key: 'bookings', label: 'Bookings', icon: Calendar },
                { key: 'listings', label: 'My Listings', icon: Package },
                { key: 'favorites', label: 'Favorites', icon: Heart },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    tab === key ? 'bg-primary text-white' : 'bg-white border border-border text-text hover:bg-bg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16 text-muted">Loading...</div>
            ) : (
              <>
                {tab === 'bookings' && (
                  <div>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setBookingView('buyer')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          bookingView === 'buyer' ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-white'
                        }`}
                      >
                        My Bookings ({myBookings.length})
                      </button>
                      <button
                        onClick={() => setBookingView('seller')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                          bookingView === 'seller' ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-white'
                        }`}
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        Requests Received ({received.length})
                      </button>
                    </div>

                    <div className="flex gap-1 border-b border-border mb-4">
                      {statusFilters.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setStatusFilter(f.key)}
                          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                            statusFilter === f.key
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted hover:text-text'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3">
                      {filteredBookings.length === 0 ? (
                        <p className="text-muted text-sm py-8 text-center">No bookings here yet.</p>
                      ) : (
                        filteredBookings.map((b) => (
                          <BookingCard
                            key={b._id}
                            booking={b}
                            viewAs={bookingView}
                            onAction={handleBookingAction}
                            onReview={setReviewingBooking}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}

                {tab === 'listings' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-text">Products ({myProducts.length})</h3>
                      <Link to="/create-listing" className="text-sm font-semibold text-primary hover:underline">
                        + Post new listing
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                      {myProducts.map((p) => (
                        <Link key={p._id} to={`/products/${p._id}`} className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition">
                          <div className="aspect-[4/3] bg-primary-soft">
                            {p.images?.[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm text-text line-clamp-1">{p.title}</p>
                            <p className="text-sm font-bold text-primary">Rs {p.price?.toLocaleString()}</p>
                            <span className={`text-xs ${p.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                              {p.isApproved ? 'Approved' : 'Pending approval'}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <h3 className="font-bold text-text mb-4">Services ({myServices.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {myServices.map((s) => (
                        <Link key={s._id} to={`/services/${s._id}`} className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition">
                          <div className="aspect-[4/3] bg-primary-soft">
                            {s.portfolioImages?.[0] && <img src={s.portfolioImages[0].url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm text-text line-clamp-1">{s.title}</p>
                            <p className="text-sm font-bold text-primary">Rs {s.price?.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'favorites' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favorites.length === 0 ? (
                      <p className="text-muted text-sm col-span-full">No favorites saved yet.</p>
                    ) : (
                      favorites.map((f) => (
                        <Link
                          key={f._id}
                          to={f.listingType === 'Product' ? `/products/${f.listing?._id}` : `/services/${f.listing?._id}`}
                          className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition"
                        >
                          <div className="aspect-[4/3] bg-primary-soft">
                            {(f.listing?.images?.[0] || f.listing?.portfolioImages?.[0]) && (
                              <img
                                src={f.listing.images?.[0]?.url || f.listing.portfolioImages?.[0]?.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm text-text line-clamp-1">{f.listing?.title}</p>
                            <p className="text-sm font-bold text-primary">Rs {f.listing?.price?.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {reviewingBooking && (
        <ReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSubmitted={loadData}
        />
      )}
    </div>
  );
};

export default DashboardPage;