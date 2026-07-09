import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary-soft mt-16 border-t border-border">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-lg font-bold text-text mb-2">Marketplace</h3>
          <p className="text-sm text-muted">
            Connecting your local community through trusted trade and services.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-text mb-3">Browse</h4>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <Link to="/products?category=Electronics" className="hover:text-primary transition">Electronics</Link>
            <Link to="/products?category=Fashion" className="hover:text-primary transition">Fashion</Link>
            <Link to="/products?category=Tutoring" className="hover:text-primary transition">Tutoring</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-text mb-3">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <Link to="/about" className="hover:text-primary transition">About Us</Link>
            <Link to="/privacy" className="hover:text-primary transition">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-primary transition">Contact</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-text mb-3">Support</h4>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <Link to="/help" className="hover:text-primary transition">Help Center</Link>
            <Link to="/safety" className="hover:text-primary transition">Safety Center</Link>
            <Link to="/guidelines" className="hover:text-primary transition">Guidelines</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © 2026 Marketplace. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;