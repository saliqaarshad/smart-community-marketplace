import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';

const categoryPills = ['All', 'Furniture', 'Electronics', 'Fashion', 'Graphic Designing', 'Tutoring', 'Home Services'];

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePill, setActivePill] = useState('All');

  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (activePill !== 'All') params.append('category', activePill);
        params.append('limit', 8);

        const res = await api.get(`/products?${params.toString()}`);
        setProducts(res.data.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [keyword, activePill]);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex">
        <Sidebar />

        <main className="flex-1 py-6 sm:py-8 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-muted mb-1">Rawalpindi</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-text">Discover</h1>
            </div>
            <button className="flex items-center justify-center gap-2 bg-white border border-border px-4 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition-all duration-200 hover:scale-105 active:scale-95 self-start sm:self-auto">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categoryPills.map((pill) => (
              <button
                key={pill}
                onClick={() => setActivePill(pill)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 active:scale-95 shrink-0 ${
                  activePill === pill
                    ? 'border-primary text-primary bg-primary-soft scale-105'
                    : 'border-border text-text bg-white hover:bg-bg hover:border-primary/40 hover:scale-105'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-text">Latest listings</h2>
            <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
              See all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-border animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted">
              No listings found. Be the first to post one!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
              {products.map((product, i) => (
                <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <ListingCard listing={product} type="Product" />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;