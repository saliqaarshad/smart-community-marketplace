import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ListingCard = ({ listing, type }) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const image =
    type === 'Product'
      ? listing.images?.[0]?.url
      : listing.portfolioImages?.[0]?.url;

  const location = listing.location?.city || 'Location not set';

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${type}/${listing._id}`);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await api.post('/favorites', { listingType: type, listingId: listing._id });
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const detailLink = type === 'Product' ? `/products/${listing._id}` : `/services/${listing._id}`;

  return (
    <Link to={detailLink} className="group block transition-transform duration-200 hover:-translate-y-1">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-bg mb-3 shadow-sm group-hover:shadow-lg transition-shadow duration-300">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            No image
          </div>
        )}

        <button
          onClick={toggleFavorite}
          disabled={loading}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform duration-150"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-primary text-primary' : 'text-muted'}`}
          />
        </button>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>

      <h3 className="font-semibold text-text text-[15px] leading-snug mb-1 line-clamp-1 group-hover:text-primary transition-colors">
        {listing.title}
      </h3>
      <p className="font-bold text-text mb-1">Rs {listing.price?.toLocaleString()}</p>
      <p className="flex items-center gap-1 text-sm text-muted">
        <MapPin className="w-3.5 h-3.5" />
        {location}
      </p>
    </Link>
  );
};

export default ListingCard;