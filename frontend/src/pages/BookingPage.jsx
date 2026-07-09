import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const timeSlots = [
  { label: 'Morning', value: '9:00 AM - 12:00 PM' },
  { label: 'Afternoon', value: '12:00 PM - 5:00 PM' },
  { label: 'Evening', value: '5:00 PM - 9:00 PM' },
];

const BookingPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState(timeSlots[1].value);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const isProduct = type === 'product';

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await api.get(isProduct ? `/products/${id}` : `/services/${id}`);
        setListing(res.data.data);
      } catch (error) {
        toast.error('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, isProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        listingType: isProduct ? 'Product' : 'Service',
        listingId: id,
        preferredDate,
        preferredTime,
        notes,
      };
      if (isProduct) payload.quantity = quantity;

      await api.post('/bookings', payload);
      toast.success('Booking request sent!');
      navigate('/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
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

  if (!listing) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="text-center py-16 text-muted">Listing not found.</div>
      </div>
    );
  }

  const image = isProduct ? listing.images?.[0]?.url : listing.portfolioImages?.[0]?.url;
  const providerName = isProduct ? listing.seller?.fullName : listing.provider?.fullName;
  const unitLabel = isProduct ? '' : ' / session';
  const total = isProduct ? listing.price * quantity : listing.price;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={isProduct ? `/products/${id}` : `/services/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-text mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isProduct ? 'product' : 'service'} details
        </Link>

        <h1 className="text-3xl font-extrabold text-text mb-1">Request a booking</h1>
        <p className="text-sm text-muted mb-6">
          {listing.title} · with {providerName}
        </p>

        <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-primary-soft shrink-0">
              {image && <img src={image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="font-semibold text-text text-sm">{listing.title}</p>
              <p className="text-xs text-muted">{listing.category}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-extrabold text-primary">Rs {listing.price?.toLocaleString()}</p>
            {!isProduct && <p className="text-xs text-muted">per session</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {isProduct && (
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                max={listing.stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted mt-1">{listing.stock} available</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text mb-2">Preferred date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">Preferred time</label>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => setPreferredTime(slot.value)}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                    preferredTime === slot.value
                      ? 'border-primary text-primary bg-primary-soft'
                      : 'border-border text-text bg-white hover:bg-bg'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted">Location</span>
            <span className="font-medium text-text">{listing.location?.city || 'Not specified'}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              Notes to {isProduct ? 'seller' : 'provider'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              placeholder={
                isProduct
                  ? 'Any special requests for this order...'
                  : "Mention any specific requirements for the session..."
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex justify-between px-4 py-3 text-sm border-b border-border">
              <span className="text-muted">{isProduct ? 'Item price' : 'Service rate'}</span>
              <span className="font-medium text-text">Rs {listing.price?.toLocaleString()}{unitLabel}</span>
            </div>
            {isProduct && quantity > 1 && (
              <div className="flex justify-between px-4 py-3 text-sm border-b border-border">
                <span className="text-muted">Quantity</span>
                <span className="font-medium text-text">× {quantity}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3 bg-primary-soft">
              <span className="font-bold text-text">Total</span>
              <span className="font-extrabold text-primary">Rs {total?.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send booking request'}
          </button>

          <p className="text-center text-xs text-muted -mt-2">
            The {isProduct ? 'seller' : 'provider'} will confirm within 24 hours
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;