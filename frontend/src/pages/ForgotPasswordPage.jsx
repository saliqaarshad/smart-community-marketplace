import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const token = res.data.resetToken;
      setResetLink(`/reset-password/${token}`);
      toast.success('Reset link generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not find an account with that email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5">
        <Link to="/" className="text-lg sm:text-xl font-bold text-text">
          Marketplace
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-1">Forgot password?</h1>
          <p className="text-muted mb-8">Enter your email and we'll help you reset it</p>

          {!resetLink ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg text-sm transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-sm text-text mb-4">
                Since email sending isn't set up yet in this dev environment, here's your reset link directly:
              </p>
              <Link
                to={resetLink}
                className="block text-center bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg text-sm transition"
              >
                Continue to reset password
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-muted py-6">
        © 2026 Marketplace. All rights reserved.
      </div>
    </div>
  );
};

export default ForgotPasswordPage;