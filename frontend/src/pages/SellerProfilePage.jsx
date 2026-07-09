import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Flag, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const sortOptions = [
  { key: 'recent', label: 'Most recent' },
  { key: 'highest', label: 'Highest rated' },
  { key: 'lowest', label: 'Lowest rated' },
];

const SellerProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text">{profile.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(profile.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-border'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-text">{profile.averageRating || 0}</span>
                <span className="text-muted text-sm">({profile.totalReviews || 0} reviews)</span>
              </div>
              {profile.location?.city && (
                <p className="flex items-center gap-1 text-sm text-muted mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location.city}
                </p>
              )}
            </div>
          </div>

          <div className="w-full sm:w-64 shrink-0">
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
        </div>

        {profile.bio && (
          <p className="text-text/80 mb-6 leading-relaxed">{profile.bio}</p>
        )}

        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {profile.skills.map((skill) => (
              <span key={skill} className="text-xs font-medium bg-primary-soft text-primary px-3 py-1.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}

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

      <Footer />
    </div>
  );
};

export default SellerProfilePage;