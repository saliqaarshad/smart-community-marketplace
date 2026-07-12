import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const productCategories = ['Furniture', 'Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Other'];
const serviceCategories = [
  'Graphic Designing',
  'Web Development',
  'Photography',
  'Home Services',
  'Tutoring',
  'Content Writing',
  'Digital Marketing',
  'Video Editing',
  'Other',
];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const locationTypes = ['At my location', "At client's location", 'Remote'];
const priceUnits = ['project', 'hour', 'session', 'day'];

const MAX_IMAGES = 5;

const CreateListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const initialType = searchParams.get('type') === 'service' ? 'service' : 'product';

  const [listingType, setListingType] = useState(initialType);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: 1,
    deliveryTime: '',
    location: '',
    locationType: 'Remote',
    priceUnit: 'project',
  });
  const [availableDays, setAvailableDays] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const fetchListing = async () => {
      try {
        const endpoint = listingType === 'product' ? `/products/${id}` : `/services/${id}`;
        const res = await api.get(endpoint);
        const data = res.data.data;
        setForm({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          stock: data.stock || 1,
          deliveryTime: data.deliveryTime || '',
          location: [data.location?.city, data.location?.country].filter(Boolean).join(', '),
          locationType: data.locationType || 'Remote',
          priceUnit: data.priceUnit || 'project',
        });
        setAvailableDays(data.availableDays || []);
        setExistingImages(data.images || data.portfolioImages || []);
      } catch (error) {
        toast.error('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, isEdit, listingType]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleDay = (day) => {
    setAvailableDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const totalImages = existingImages.length + newImages.length;
  const imageSlots = [...existingImages, ...newImagePreviews.map((src, i) => ({ _preview: src, _newIndex: i }))];

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, MAX_IMAGES - totalImages);
    setNewImages([...newImages, ...files]);
    setNewImagePreviews([...newImagePreviews, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(existingImages.filter((img) => img._id !== imageId));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (totalImages === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setSaving(true);
    try {
      const [city, ...rest] = form.location.split(',').map((s) => s.trim());
      const country = rest.join(', ');

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('city', city || '');
      formData.append('country', country || '');

      if (isEdit) {
        formData.append('keepImageIds', JSON.stringify(existingImages.map((img) => img._id)));
      }

      if (listingType === 'product') {
        formData.append('stock', form.stock);
        newImages.forEach((img) => formData.append('images', img));
      } else {
        formData.append('deliveryTime', form.deliveryTime);
        formData.append('locationType', form.locationType);
        formData.append('priceUnit', form.priceUnit);
        formData.append('availableDays', JSON.stringify(availableDays));
        newImages.forEach((img) => formData.append('portfolioImages', img));
      }

      const basePath = listingType === 'product' ? '/products' : '/services';

      if (isEdit) {
        await api.put(`${basePath}/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Listing updated!');
        navigate(listingType === 'product' ? `/products/${id}` : `/services/${id}`);
      } else {
        const res = await api.post(basePath, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Listing published!');
        navigate(listingType === 'product' ? `/products/${res.data.data._id}` : `/services/${res.data.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save listing');
    } finally {
      setSaving(false);
    }
  };

  const categories = listingType === 'product' ? productCategories : serviceCategories;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="text-center py-16 text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 pb-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-extrabold text-text mb-1">
              {isEdit ? 'Edit listing' : `Create a ${listingType} listing`}
            </h1>
            <p className="text-sm text-muted mb-8">
              {isEdit
                ? 'Update your listing details'
                : listingType === 'service'
                ? 'Describe what you offer and how clients can book you'
                : 'Fill in the details below to list your item'}
            </p>

            {!isEdit && (
              <div className="flex gap-2 mb-8">
                <button
                  type="button"
                  onClick={() => { setListingType('product'); setForm({ ...form, category: '' }); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    listingType === 'product' ? 'bg-primary text-white border-primary' : 'bg-white border-border text-text hover:bg-bg'
                  }`}
                >
                  Product
                </button>
                <button
                  type="button"
                  onClick={() => { setListingType('service'); setForm({ ...form, category: '' }); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    listingType === 'service' ? 'bg-primary text-white border-primary' : 'bg-white border-border text-text hover:bg-bg'
                  }`}
                >
                  Service
                </button>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {listingType === 'service' ? 'Portfolio Photos' : 'Photos'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {imageSlots.map((img, i) => (
                  <div key={img._id || `new-${img._newIndex}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={img.url || img._preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => (img._id ? removeExistingImage(img._id) : removeNewImage(img._newIndex))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && listingType === 'product' && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] font-semibold tracking-wide uppercase text-center py-0.5">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {totalImages < MAX_IMAGES &&
                  [...Array(MAX_IMAGES - totalImages)].map((_, i) => (
                    <label
                      key={`empty-${i}`}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 transition bg-white"
                    >
                      <Plus className="w-5 h-5 text-muted" />
                      <span className="text-[10px] font-semibold text-muted tracking-wide uppercase">Add photo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  ))}
              </div>
            </div>

            <div className="border-t border-border my-6" />

            <div className="mb-6">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {listingType === 'service' ? 'Service Title' : 'Title'}
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder={listingType === 'product' ? 'What are you selling?' : 'e.g. Minimalist Branding Package'}
                className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder={
                  listingType === 'service'
                    ? 'Tell your clients about the value you provide...'
                    : "Describe the item's key features, condition, and any details buyers should know..."
                }
                className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="border-t border-border my-6" />

            {listingType === 'product' ? (
              <>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Price</label>
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-3 rounded-lg bg-bg border border-border text-sm font-semibold text-muted">Rs</span>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      required
                      min="0"
                      placeholder="0.00"
                      className="flex-1 px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Price</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-3 rounded-lg bg-bg border border-border text-sm font-semibold text-muted">Rs</span>
                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <select
                      name="priceUnit"
                      value={form.priceUnit}
                      onChange={handleChange}
                      className="px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {priceUnits.map((unit) => (
                        <option key={unit} value={unit}>/ {unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Estimated delivery time</label>
                  <input
                    type="text"
                    name="deliveryTime"
                    value={form.deliveryTime}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 5-7 business days"
                    className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="border-t border-border my-6" />

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Weekly availability</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                          availableDays.includes(day)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-text border-border hover:bg-bg'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border my-6" />

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Service location</label>
                  <div className="flex flex-wrap gap-2">
                    {locationTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, locationType: type })}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition ${
                          form.locationType === type
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-text border-border hover:bg-bg'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-border my-6" />

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, Country"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted max-w-xs">
              Listing will be visible to your community immediately after publishing.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm font-semibold text-muted hover:text-text transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Publish listing'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateListingPage;