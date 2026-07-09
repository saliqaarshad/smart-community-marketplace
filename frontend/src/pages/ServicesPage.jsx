import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';

const categories = [
  'Graphic Designing',
  'Web Development',
  'Photography',
  'Home Services',
  'Tutoring',
  'Content Writing',
  'Digital Marketing',
  'Video Editing',
];

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        params.append('page', page);
        params.append('limit', 12);

        const res = await api.get(`/services?${params.toString()}`);
        setServices(res.data.data);
        setPagination(res.data.pagination);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [keyword, category, sort, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <h1 className="text-3xl font-extrabold text-text mb-1">
          {keyword ? `Results for '${keyword}'` : 'All Services'}
        </h1>
        <p className="text-sm text-muted mb-6">{pagination.total} results found</p>

        <div className="flex gap-8">
          <aside className="w-64 shrink-0 hidden md:block">
            <h3 className="font-bold text-text mb-4">Category</h3>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category === cat}
                    onChange={() => updateParam('category', category === cat ? '' : cat)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              {category ? (
                <span className="flex items-center gap-1.5 bg-primary-soft text-primary text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full">
                  {category}
                  <button onClick={() => updateParam('category', '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : <div />}

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest rated</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-border animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-20 text-muted">No services match your filters.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {services.map((service, i) => (
                  <div key={service._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ListingCard listing={service} type="Service" />
                  </div>
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === i + 1 ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-bg'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServicesPage;