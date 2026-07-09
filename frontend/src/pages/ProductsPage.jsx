import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';

const categories = ['Furniture', 'Electronics', 'Fashion', 'Home Services', 'Tutoring'];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const city = searchParams.get('city') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [priceInputs, setPriceInputs] = useState({ min: minPrice, max: maxPrice });
  const [cityInput, setCityInput] = useState(city);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (category) params.append('category', category);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (city) params.append('city', city);
        if (sort) params.append('sort', sort);
        params.append('page', page);
        params.append('limit', 12);

        const res = await api.get(`/products?${params.toString()}`);
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [keyword, category, minPrice, maxPrice, city, sort, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const clearAll = () => {
    setSearchParams(keyword ? { keyword } : {});
    setPriceInputs({ min: '', max: '' });
    setCityInput('');
  };

  const activeFilters = [
    category && { key: 'category', label: category },
    (minPrice || maxPrice) && { key: 'price', label: `Rs ${minPrice || '0'} - ${maxPrice || '∞'}` },
    city && { key: 'city', label: city },
  ].filter(Boolean);

  const removeFilter = (key) => {
    if (key === 'price') {
      const next = new URLSearchParams(searchParams);
      next.delete('minPrice');
      next.delete('maxPrice');
      next.set('page', '1');
      setSearchParams(next);
      setPriceInputs({ min: '', max: '' });
    } else {
      updateParam(key, '');
      if (key === 'city') setCityInput('');
    }
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
          {keyword ? `Results for '${keyword}'` : 'All Products'}
        </h1>
        <p className="text-sm text-muted mb-6">{pagination.total} results found</p>

        <div className="flex gap-8">
          <aside className="w-64 shrink-0 hidden md:block">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text">Filters</h3>
              <button onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
                Clear all
              </button>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-sm font-semibold text-text mb-3">Category</p>
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
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-sm font-semibold text-text mb-3">Price Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceInputs.min}
                  onChange={(e) => setPriceInputs({ ...priceInputs, min: e.target.value })}
                  onBlur={() => updateParam('minPrice', priceInputs.min)}
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceInputs.max}
                  onChange={(e) => setPriceInputs({ ...priceInputs, max: e.target.value })}
                  onBlur={() => updateParam('maxPrice', priceInputs.max)}
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text mb-3">Location</p>
              <input
                type="text"
                placeholder="City"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onBlur={() => updateParam('city', cityInput)}
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className="flex items-center gap-1.5 bg-primary-soft text-primary text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full"
                  >
                    {f.label}
                    <button onClick={() => removeFilter(f.key)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

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
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-border animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-muted">No listings match your filters.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {products.map((product, i) => (
                  <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ListingCard listing={product} type="Product" />
                  </div>
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-lg border border-border bg-white disabled:opacity-40 hover:bg-bg transition"
                >
                  ‹
                </button>
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
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="w-9 h-9 rounded-lg border border-border bg-white disabled:opacity-40 hover:bg-bg transition"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;