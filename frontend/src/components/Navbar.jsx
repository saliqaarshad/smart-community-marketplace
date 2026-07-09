import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/products', label: 'Products' },
  { to: '/services', label: 'Services' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/messages', label: 'Messages' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(search)}`);
      setMobileSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4 lg:gap-8">
        <Link to="/" className="text-lg sm:text-xl font-bold text-text shrink-0">
          Marketplace
        </Link>

        <div className="hidden lg:flex items-center gap-7 text-[15px] font-medium shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-colors duration-150 ${
                isActive(link.to) ? 'text-primary font-semibold' : 'text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md ml-auto lg:ml-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-bg border border-border text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button type="submit">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto md:ml-0 shrink-0">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden text-muted hover:text-text transition"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link
            to="/notifications"
            className={`hidden sm:block transition-colors duration-150 ${
              isActive('/notifications') ? 'text-primary' : 'text-muted hover:text-text'
            }`}
          >
            <Bell className="w-5 h-5" />
          </Link>

          <Link
            to={user ? '/create-listing' : '/login'}
            className="hidden sm:flex items-center gap-1.5 bg-primary hover:bg-primary-light text-white font-semibold px-3 sm:px-4 py-2 rounded-lg text-sm transition-all duration-150 hover:scale-[1.03] active:scale-95"
          >
            <span className="hidden lg:inline">Post a listing</span>
            <Plus className="w-4 h-4 lg:hidden" />
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold overflow-hidden shrink-0 transition-transform duration-150 hover:scale-105"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName?.charAt(0).toUpperCase()
                )}
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-text truncate">{user.fullName}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text hover:bg-bg transition"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text hover:bg-bg transition"
                    >
                      Settings
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-text hover:bg-bg transition"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex w-9 h-9 rounded-full bg-primary-soft text-primary items-center justify-center font-semibold transition-transform duration-150 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-text"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-bg border border-border text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button type="submit">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </button>
          </div>
        </form>
      )}

      {mobileOpen && (
        <div className="lg:hidden border-t border-border px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`px-2 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(link.to) ? 'text-primary bg-primary-soft' : 'text-text hover:bg-bg'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/notifications"
            onClick={() => setMobileOpen(false)}
            className={`px-2 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive('/notifications') ? 'text-primary bg-primary-soft' : 'text-text hover:bg-bg'
            }`}
          >
            Notifications
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition"
              >
                Dashboard
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition"
              >
                Settings
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="px-2 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition text-left"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="px-2 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition">
              Log in
            </Link>
          )}

          <Link
            to={user ? '/create-listing' : '/login'}
            onClick={() => setMobileOpen(false)}
            className="mt-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg text-sm text-center hover:bg-primary-light transition"
          >
            Post a listing
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;