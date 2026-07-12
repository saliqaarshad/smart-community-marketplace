import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import CreateListingPage from './pages/CreateListingPage';
import MessagesPage from './pages/MessagesPage';
import BookingPage from './pages/BookingPage';
import SellerProfilePage from './pages/SellerProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import HelpPage from './pages/HelpPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:id" element={<ServiceDetailPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/bookings" element={<DashboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/create-listing" element={<CreateListingPage />} />
      <Route path="/edit-listing/:id" element={<CreateListingPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/book/:type/:id" element={<BookingPage />} />
      <Route path="/seller/:id" element={<SellerProfilePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/help" element={<HelpPage />} />
    </Routes>
  );
}

export default App;