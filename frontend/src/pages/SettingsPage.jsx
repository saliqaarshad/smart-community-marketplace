import { useState, useRef } from 'react';
import { Camera, X, Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BIO_MAX = 300;

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(user?.profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    city: user?.location?.city || '',
    country: user?.location?.country || '',
  });
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bio' && value.length > BIO_MAX) return;
    setForm({ ...form, [name]: value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) {
      setSkills([...skills, value]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
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
      formData.append('skills', skills.join(','));
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
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-extrabold text-text mb-1 text-center">Edit profile</h1>
            <p className="text-sm text-muted mb-8 text-center">This information is visible on your public profile</p>

            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-primary-soft text-primary flex items-center justify-center text-3xl font-bold overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    form.fullName?.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:scale-105 transition"
                >
                  <Camera className="w-4 h-4 text-text" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted mt-3">Recommended: JPG or PNG, max 5MB.</p>
            </div>

            <div className="border-t border-border" />

            <div className="py-6 border-b border-border">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Full name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="py-6 border-b border-border">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows="3"
                placeholder="Tell your community a bit about yourself"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-right text-xs text-muted mt-1">{form.bio.length}/{BIO_MAX}</p>
            </div>

            <div className="py-6 border-b border-border grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Rawalpindi"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Pakistan"
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="py-6 border-b border-border">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Phone number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="03XX-XXXXXXX"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="py-6">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Skills / Services</label>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 border border-primary text-primary text-sm px-3 py-1.5 rounded-full"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill (e.g. Graphic Design)..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary-soft text-primary flex items-center justify-center hover:bg-primary hover:text-white transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-xl mx-auto flex items-center justify-between">
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
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;