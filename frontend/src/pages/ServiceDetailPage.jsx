import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Heart, Eye, Clock, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [serviceRes, reviewsRes] = await Promise.all([
          api.get(`/services/${id}`),
          api.get(`/reviews/listing/Service/${id}`),
        ]);
        setService(serviceRes.data.data);
        setReviews(reviewsRes.data.data);
      } catch (error) {
        toast.error('Failed to load service');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }
    try {
      if (isFavorited) {
        await api.delete(`/favorites/Service/${id}`);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await api.post('/favorites', { listingType: 'Service', listingId: id });
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const handleMessageProvider = async () => {
    if (!user) {
      toast.error('Please log in to message the provider');
      return;
    }
    try {
      const res = await api.post('/conversations', {
        recipientId: service.provider._id,
        listingType: 'Service',
        listingId: service._id,
      });
      navigate(`/messages?conversation=${res.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-16 text-center text-muted">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-16 text-center text-muted">Service not found.</div>
      </div>
    );
  }

  const images = service.portfolioImages || [];
  const isOwner = user && service.provider._id === user._id;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="text-sm text-muted flex items-center gap-2">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to={`/services?category=${service.category}`} className="hover:text-primary">{service.category}</Link>
            <span>/</span>
            <span className="text-text">{service.title}</span>
          </div>

          {isOwner && (
            <Link
              to={`/edit-listing/${service._id}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary-soft transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit listing
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-primary-soft mb-3">
              {images[activeImage] ? (
                <img src={images[activeImage].url} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={img._id}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      activeImage === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text mb-3">{service.title}</h1>

            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">
                Rs {service.price?.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted">
                <Eye className="w-4 h-4" /> {service.views} views
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-4">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-text">{service.averageRating || 0}</span>
              <span className="text-sm text-muted">({service.totalReviews || 0} reviews)</span>
            </div>

            <p className="text-text/80 leading-relaxed mb-6">{service.description}</p>

            <div className="bg-white border border-border rounded-xl divide-y divide-border mb-6">
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted">Category</span>
                <span className="font-medium text-text">{service.category}</span>
              </div>
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted">Delivery time</span>
                <span className="font-medium text-text flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {service.deliveryTime}
                </span>
              </div>
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted">Availability</span>
                <span className="font-medium text-text">{service.availability}</span>
              </div>
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted">Location</span>
                <span className="font-medium text-text flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {service.location?.city || 'Not specified'}
                </span>
              </div>
            </div>

            <Link
              to={`/seller/${service.provider._id}`}
              className="flex items-center justify-between bg-white border border-border rounded-xl px-5 py-4 mb-4 hover:border-primary/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold overflow-hidden">
                  {service.provider.profilePicture ? (
                    <img src={service.provider.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    service.provider.fullName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-text text-sm">{service.provider.fullName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {service.provider.averageRating || 0} ({service.provider.totalReviews || 0} reviews)
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary">View profile</span>
            </Link>

            {isOwner && (
              <Link
                to={`/edit-listing/${service._id}`}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-95 mb-2.5"
              >
                <Pencil className="w-4 h-4" />
                Edit listing
              </Link>
            )}

            {!isOwner && (
              <div className="flex flex-col gap-2.5">
                <Link
                  to={`/book/service/${service._id}`}
                  className="bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl text-center transition-all duration-200 hover:scale-[1.01] active:scale-95"
                >
                  Request booking
                </Link>

                <button
                  onClick={handleMessageProvider}
                  className="border border-border bg-white hover:bg-bg text-text font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-95"
                >
                  Message provider
                </button>

                <button
                  onClick={toggleFavorite}
                  className="flex items-center justify-center gap-2 border border-border bg-white hover:bg-bg text-text font-medium py-2.5 rounded-xl transition"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : ''}`} />
                  {isFavorited ? 'Saved to favorites' : 'Add to favorites'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-bold text-text mb-4">Reviews ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet for this service.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm overflow-hidden">
                        {review.reviewer.profilePicture ? (
                          <img src={review.reviewer.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          review.reviewer.fullName?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-semibold text-sm text-text">{review.reviewer.fullName}</span>
                    </div>
                    <span className="text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
                    ))}
                  </div>
                  {review.comment && <p className="text-sm text-text/80">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceDetailPage;