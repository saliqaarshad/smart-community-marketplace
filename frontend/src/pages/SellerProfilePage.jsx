import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Flag, MapPin, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const sortOptions = [
  { key: 'recent', label: 'Most recent' },
  { key: 'highest', label: 'Highest rated' },
  { key: 'lowest', label: 'Lowest rated' },
];

const SellerProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/auth/users/${id}`),
          api.get(`/reviews/user/${id}`),
        ]);
        setProfile(profileRes.data.data);
        setReviews(reviewsRes.data.data);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => counts[r.rating]++);
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      percent: Math.round((counts[star] / total) * 100),
    }));
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sort === 'recent') return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'highest') return copy.sort((a, b) => b.rating - a.rating);
    if (sort === 'lowest') return copy.sort((a, b) => a.rating - b.rating);
    return copy;
  }, [reviews, sort]);

  const paginatedReviews = sortedReviews.slice(0, page * perPage);

  const handleReport = async (reviewId) => {
    try {
      await api.put(`/reviews/${reviewId}/report`);
      toast.success('Review reported for moderation');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report review');
    }
  };

  const handleMessage = async () => {
    if (!user) {
      toast.error('Please log in to send a message');
      return;
    }
    try {
      const res = await api.post('/conversations', { recipientId: id });
      navigate(`/messages?conversation=${res.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="text-center py-16 text-muted">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="text-center py-16 text-muted">User not found.</div>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  const allListings = [
    ...(profile.products || []).map((p) => ({ ...p, _type: 'Product' })),
    ...(profile.services || []).map((s) => ({ ...s, _type: 'Service' })),
  ];
  const isOwnProfile = user && user._id === id;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xl font-bold overflow-hidden shrink-0 border-2 border-white shadow-sm">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-text">{profile.fullName}</h1>
              {profile.bio && <p className="text-muted mt-1">{profile.bio}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {profile.location?.city && (
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location.city}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-text">{profile.averageRating || 0}</span>
                  <span className="text-muted">({profile.totalReviews || 0} reviews)</span>
                </span>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleMessage}
              className="border-2 border-primary text-primary font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-primary-soft transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0"
            >
              Message
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden mb-8 border border-border">
          <div className="bg-white text-center py-5">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Active Listings</p>
            <p className="text-2xl font-extrabold text-text">{profile.activeListingsCount || 0}</p>
          </div>
          <div className="bg-white text-center py-5">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Completed Orders</p>
            <p className="text-2xl font-extrabold text-text">{profile.completedOrders || 0}</p>
          </div>
          <div className="bg-white text-center py-5">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Member Since</p>
            <p className="text-2xl font-extrabold text-text">{memberSince}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-56 shrink-0">
            {profile.bio && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-text mb-2">About</h3>
                <p className="text-sm text-muted leading-relaxed">{profile.bio}</p>
              </div>
            )}
            {profile.skills?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-text mb-2">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium border border-primary text-primary px-2.5 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex gap-1 border-b border-border mb-6">
              <button
                onClick={() => setTab('listings')}
                className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                  tab === 'listings' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
                }`}
              >
                Listings ({allListings.length})
              </button>
              <button
                onClick={() => setTab('reviews')}
                className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                  tab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>

            {tab === 'listings' && (
              allListings.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">No active listings yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allListings.map((item) => {
                    const image = item._type === 'Product' ? item.images?.[0]?.url : item.portfolioImages?.[0]?.url;
                    const link = item._type === 'Product' ? `/products/${item._id}` : `/services/${item._id}`;
                    return (
                      <Link
                        key={item._id}
                        to={link}
                        className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition"
                      >
                        <div className="aspect-[4/3] bg-primary-soft overflow-hidden">
                          {image && (
                            <img
                              src={image}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-sm text-text mb-1 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-muted mb-2">{item.location?.city}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">Rs {item.price?.toLocaleString()}</span>
                            <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}

            {tab === 'reviews' && (
              <div>
                <div className="mb-6">
                  {ratingBreakdown.map(({ star, percent }) => (
                    <div key={star} className="flex items-center gap-2 text-xs mb-1.5">
                      <span className="w-10 text-muted">{star} stars</span>
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted">{percent}%</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1 border-b border-border mb-4">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSort(opt.key)}
                      className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                        sort === opt.key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {reviews.length === 0 ? (
                  <p className="text-muted text-sm py-8 text-center">No reviews yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {paginatedReviews.map((review) => (
                      <div key={review._id} className="bg-white border border-border rounded-xl p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm overflow-hidden shrink-0">
                              {review.reviewer.profilePicture ? (
                                <img src={review.reviewer.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                review.reviewer.fullName?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-text">{review.reviewer.fullName}</p>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted shrink-0">
                            {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {review.comment && <p className="text-sm text-text/80 mt-3">{review.comment}</p>}
                        <button
                          onClick={() => handleReport(review._id)}
                          className="flex items-center gap-1 text-xs text-muted hover:text-red-600 transition mt-3"
                        >
                          <Flag className="w-3 h-3" /> Report
                        </button>
                      </div>
                    ))}

                    {paginatedReviews.length < sortedReviews.length && (
                      <button
                        onClick={() => setPage(page + 1)}
                        className="self-center text-sm font-semibold text-primary hover:underline mt-2"
                      >
                        Load more reviews
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SellerProfilePage;