import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
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
    city: '',
    country: '',
  });
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
          city: data.location?.city || '',
          country: data.location?.country || '',
        });
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

  const totalImages = existingImages.length + newImages.length;

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - totalImages);
    setNewImages([...newImages, ...files]);
    setNewImagePreviews([...newImagePreviews, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(existingImages.filter((img) => img._id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (totalImages === 0) {
      toast.error('Please keep or upload at least one image');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('city', form.city);
      formData.append('country', form.country);

      if (isEdit) {
        formData.append('keepImageIds', JSON.stringify(existingImages.map((img) => img._id)));
      }

      if (listingType === 'product') {
        formData.append('stock', form.stock);
        newImages.forEach((img) => formData.append('images', img));
      } else {
        formData.append('deliveryTime', form.deliveryTime);
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
        toast.success('Listing created!');
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
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold text-text mb-1">
          {isEdit ? 'Edit listing' : 'Post a listing'}
        </h1>
        <p className="text-sm text-muted mb-8">
          {isEdit ? 'Update your listing details' : 'Share a product or service with your community'}
        </p>

        {!isEdit && (
          <div className="flex gap-2 mb-6">
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

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder={listingType === 'product' ? 'e.g. Handmade Wooden Chair' : 'e.g. Professional Logo Design'}
              className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe your listing in detail..."
              className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Price (Rs)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {listingType === 'product' ? (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Stock</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Delivery time</label>
              <input
                type="text"
                name="deliveryTime"
                value={form.deliveryTime}
                onChange={handleChange}
                required
                placeholder="e.g. 3 days"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Rawalpindi"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Country</label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Pakistan"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Images ({totalImages}/5)
            </label>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img._id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img._id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newImagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition">
                  <Upload className="w-5 h-5 text-muted" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted mt-2">Up to 5 images. Click the × to remove one. JPG, PNG or WEBP.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Post listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListingPage;