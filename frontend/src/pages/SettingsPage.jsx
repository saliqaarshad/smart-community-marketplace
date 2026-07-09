import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(user?.profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    city: user?.location?.city || '',
    country: user?.location?.country || '',
    skills: user?.skills?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('bio', form.bio);
      formData.append('phone', form.phone);
      formData.append('city', form.city);
      formData.append('country', form.country);
      formData.append('skills', form.skills);
      if (selectedFile) formData.append('profilePicture', selectedFile);

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold text-text mb-1">Settings</h1>
        <p className="text-sm text-muted mb-8">Manage your profile information</p>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-5 mb-8">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl font-bold overflow-hidden">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  form.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Change photo
              </button>
              <p className="text-xs text-muted mt-1">JPG, PNG or WEBP. Max 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Full name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="03XX-XXXXXXX"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-1.5">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows="3"
              placeholder="Tell your community a bit about yourself"
              className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-1.5">Skills / Services (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="Graphic Design, Tutoring, Photography"
              className="w-full px-4 py-2.5 rounded-lg bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;