import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data.data);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async (e, listingType, listingId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/favorites/${listingType}/${listingId}`);
      setFavorites((prev) => prev.filter((f) => f.listing?._id !== listingId));
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove favorite');
    }
  };

  const products = favorites.filter((f) => f.listingType === 'Product');
  const services = favorites.filter((f) => f.listingType === 'Service');
  const activeList = tab === 'products' ? products : services;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <h1 className="text-4xl font-extrabold text-text mb-1">Favorites</h1>
        <p className="text-sm text-muted mb-6">Listings you've saved for later</p>

        <div className="flex gap-6 border-b border-border mb-8">
          <button
            onClick={() => setTab('products')}
            className={`pb-3 text-sm font-semibold tracking-wide uppercase border-b-2 -mb-px transition ${
              tab === 'products' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setTab('services')}
            className={`pb-3 text-sm font-semibold tracking-wide uppercase border-b-2 -mb-px transition ${
              tab === 'services' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Services
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-border animate-pulse" />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-muted text-sm">
              No {tab} saved yet. Browse {tab === 'products' ? 'products' : 'services'} and tap the heart to save them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeList.map((f) => {
              const listing = f.listing;
              if (!listing) return null;
              const image = f.listingType === 'Product' ? listing.images?.[0]?.url : listing.portfolioImages?.[0]?.url;
              const link = f.listingType === 'Product' ? `/products/${listing._id}` : `/services/${listing._id}`;

              return (
                <div key={f._id} className="bg-white border border-border rounded-xl overflow-hidden">
                  <Link to={link} className="block">
                    <div className="relative aspect-[4/3] bg-primary-soft">
                      {image && <img src={image} alt="" className="w-full h-full object-cover" />}
                      <button
                        onClick={(e) => removeFavorite(e, f.listingType, listing._id)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition"
                      >
                        <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-text leading-snug">{listing.title}</h3>
                        <span className="font-bold text-primary shrink-0">Rs {listing.price?.toLocaleString()}</span>
                      </div>
                      <p className="flex items-center gap-1 text-sm text-muted mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {listing.location?.city || 'Not specified'}
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <Link
                      to={link}
                      className="block text-center bg-primary hover:bg-primary-light text-white font-semibold text-xs tracking-wide uppercase py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-95"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default FavoritesPage;