import { useState } from 'react';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ReviewModal = ({ booking, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment,
      });
      toast.success('Review submitted!');
      onSubmitted();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text">Leave a review</h3>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted mb-4">{booking.listing?.title}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-border'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            placeholder="Share your experience..."
            className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-light text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;