import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Store,
  Flag,
  Activity,
  Settings,
  Plus,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'listings', label: 'Listings', icon: Store },
  { key: 'reports', label: 'Reported Reviews', icon: Flag },
];

const AdminPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [pendingListings, setPendingListings] = useState({ products: [], services: [] });
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [allListings, setAllListings] = useState({ products: [], services: [] });
  const [reportedReviews, setReportedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [statsRes, listingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/listings'),
      ]);
      setStats(statsRes.data.data);
      const products = listingsRes.data.data.products || [];
      const services = listingsRes.data.data.services || [];
      setAllListings({ products, services });
      setPendingListings({
        products: products.filter((p) => !p.isApproved),
        services: services.filter((s) => !s.isApproved),
      });
    } catch (error) {
      toast.error('Failed to load admin dashboard');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch } });
      setUsers(res.data.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadReportedReviews = async () => {
    try {
      const res = await api.get('/admin/reported-reviews');
      setReportedReviews(res.data.data);
    } catch (error) {
      toast.error('Failed to load reported reviews');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadDashboardData(), loadUsers(), loadReportedReviews()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [userSearch]);

  const handleApprove = async (type, id) => {
    try {
      await api.put(`/admin/listings/${type}/${id}/approve`);
      toast.success('Listing approved');
      loadDashboardData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleRemove = async (type, id) => {
    try {
      await api.delete(`/admin/listings/${type}/${id}`);
      toast.success('Listing removed');
      loadDashboardData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleToggleSuspend = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/suspend`);
      toast.success(res.data.message);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const pendingCount = pendingListings.products.length + pendingListings.services.length;
  const allPending = [
    ...pendingListings.products.map((p) => ({ ...p, _type: 'product' })),
    ...pendingListings.services.map((s) => ({ ...s, _type: 'service' })),
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="text-center py-16 text-muted">You don't have access to this page.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="flex max-w-[1600px] mx-auto">
        <aside className="w-60 shrink-0 hidden md:block border-r border-border min-h-[calc(100vh-4rem)] py-6 px-4">
          <p className="text-lg font-extrabold text-primary mb-0.5">Admin Console</p>
          <p className="text-xs text-muted mb-6">Platform Overview</p>
          <nav className="flex flex-col gap-1">
            {sidebarItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                  tab === key ? 'bg-primary-soft text-primary' : 'text-text hover:bg-bg'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {loading ? (
            <div className="text-center py-16 text-muted">Loading admin dashboard...</div>
          ) : (
            <>
              {tab === 'dashboard' && stats && (
                <>
                  <h1 className="text-2xl font-extrabold text-text mb-1">Platform overview</h1>
                  <p className="text-sm text-muted mb-6">Key metrics and recent activity across the marketplace</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white border border-border rounded-xl p-4">
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Total Users</p>
                      <p className="text-2xl font-extrabold text-text">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl p-4">
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Active Listings</p>
                      <p className="text-2xl font-extrabold text-text">{stats.totalListings}</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl p-4">
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Pending Approvals</p>
                      <p className="text-2xl font-extrabold text-primary">{pendingCount}</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl p-4">
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Reported Reviews</p>
                      <p className="text-2xl font-extrabold text-red-600">{stats.reportedReviews}</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl p-4">
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Platform Revenue</p>
                      <p className="text-2xl font-extrabold text-text">Rs {stats.totalRevenue?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <h3 className="font-bold text-text">Pending listing approvals</h3>
                      <span className="text-xs font-semibold bg-primary-soft text-primary px-2.5 py-1 rounded-full">
                        {pendingCount} queued
                      </span>
                    </div>

                    {allPending.length === 0 ? (
                      <p className="text-sm text-muted px-5 py-8 text-center">No listings pending approval.</p>
                    ) : (
                      allPending.slice(0, 5).map((item, i) => {
                        const image = item._type === 'product' ? item.images?.[0]?.url : item.portfolioImages?.[0]?.url;
                        const ownerName = item._type === 'product' ? item.seller?.fullName : item.provider?.fullName;
                        return (
                          <div
                            key={item._id}
                            className={`flex items-center gap-3 px-5 py-3 flex-wrap ${
                              i !== Math.min(allPending.length, 5) - 1 ? 'border-b border-border' : ''
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-soft shrink-0">
                              {image && <img src={image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-[140px]">
                              <p className="font-semibold text-sm text-text">{item.title}</p>
                              <p className="text-xs text-muted">by {ownerName}</p>
                            </div>
                            <span className="text-xs font-medium bg-bg text-muted px-2.5 py-1 rounded">
                              {item.category}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleApprove(item._type, item._id)}
                                className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRemove(item._type, item._id)}
                                className="text-xs font-semibold border border-border px-4 py-2 rounded-lg hover:bg-bg transition"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {allPending.length > 5 && (
                      <button
                        onClick={() => setTab('listings')}
                        className="w-full text-center py-3 text-sm font-semibold text-primary hover:underline border-t border-border"
                      >
                        View all pending listings ({pendingCount})
                      </button>
                    )}
                  </div>
                </>
              )}

              {tab === 'users' && (
                <>
                  <h1 className="text-2xl font-extrabold text-text mb-1">Users</h1>
                  <p className="text-sm text-muted mb-6">Manage community members</p>

                  <div className="relative mb-4 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="bg-white border border-border rounded-xl overflow-hidden">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted px-5 py-8 text-center">No users found.</p>
                    ) : (
                      users.map((u, i) => (
                        <div
                          key={u._id}
                          className={`flex items-center gap-3 px-5 py-3 flex-wrap ${
                            i !== users.length - 1 ? 'border-b border-border' : ''
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm overflow-hidden shrink-0">
                            {u.profilePicture ? (
                              <img src={u.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.fullName?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-[160px]">
                            <p className="font-semibold text-sm text-text">{u.fullName}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                          <span className="text-xs font-medium bg-bg text-muted px-2.5 py-1 rounded capitalize">
                            {u.role}
                          </span>
                          {u.isSuspended && (
                            <span className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded">
                              Suspended
                            </span>
                          )}
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleSuspend(u._id)}
                              className={`text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 ${
                                u.isSuspended
                                  ? 'bg-primary text-white hover:bg-primary-light'
                                  : 'border border-border hover:bg-bg'
                              }`}
                            >
                              {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {tab === 'listings' && (
                <>
                  <h1 className="text-2xl font-extrabold text-text mb-1">Listings</h1>
                  <p className="text-sm text-muted mb-6">Approve, reject, or remove marketplace listings</p>

                  <div className="bg-white border border-border rounded-xl overflow-hidden">
                    {[...allListings.products.map((p) => ({ ...p, _type: 'product' })), ...allListings.services.map((s) => ({ ...s, _type: 'service' }))].length === 0 ? (
                      <p className="text-sm text-muted px-5 py-8 text-center">No listings yet.</p>
                    ) : (
                      [...allListings.products.map((p) => ({ ...p, _type: 'product' })), ...allListings.services.map((s) => ({ ...s, _type: 'service' }))].map((item, i, arr) => {
                        const image = item._type === 'product' ? item.images?.[0]?.url : item.portfolioImages?.[0]?.url;
                        const ownerName = item._type === 'product' ? item.seller?.fullName : item.provider?.fullName;
                        return (
                          <div
                            key={item._id}
                            className={`flex items-center gap-3 px-5 py-3 flex-wrap ${i !== arr.length - 1 ? 'border-b border-border' : ''}`}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-soft shrink-0">
                              {image && <img src={image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-[140px]">
                              <p className="font-semibold text-sm text-text">{item.title}</p>
                              <p className="text-xs text-muted">by {ownerName}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded ${item.isApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                              {item.isApproved ? 'Live' : 'Pending'}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {!item.isApproved && (
                                <button
                                  onClick={() => handleApprove(item._type, item._id)}
                                  className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleRemove(item._type, item._id)}
                                className="text-xs font-semibold border border-border px-4 py-2 rounded-lg hover:bg-bg transition"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {tab === 'reports' && (
                <>
                  <h1 className="text-2xl font-extrabold text-text mb-1">Reported Reviews</h1>
                  <p className="text-sm text-muted mb-6">Content flagged by the community for moderation</p>

                  <div className="bg-white border border-border rounded-xl overflow-hidden">
                    {reportedReviews.length === 0 ? (
                      <p className="text-sm text-muted px-5 py-8 text-center">No reported reviews.</p>
                    ) : (
                      reportedReviews.map((r, i) => (
                        <div
                          key={r._id}
                          className={`px-5 py-4 ${i !== reportedReviews.length - 1 ? 'border-b border-border' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm text-text">
                              {r.reviewer?.fullName} → {r.reviewedUser?.fullName}
                            </p>
                            <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-text/80 italic">"{r.comment}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;