import { Link } from 'react-router-dom';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const faqs = [
  {
    q: 'How do I book a product or service?',
    a: 'Open any listing and click "Book Now" (products) or "Request booking" (services). Fill in your preferred date and time, add any notes, and submit. The seller will accept or decline your request.',
  },
  {
    q: 'How do I message a seller?',
    a: 'On any listing page, click "Message seller" or "Message provider". This starts a real-time chat you can continue from the Messages page in the navbar.',
  },
  {
    q: 'How do I leave a review?',
    a: 'Once a booking you made is marked "Completed" by the seller, go to your Dashboard - Bookings tab and click "Leave a review" on that booking.',
  },
  {
    q: 'How do I edit or remove a listing?',
    a: 'Go to your Dashboard - My Listings, or open the listing itself while logged in as the owner and click "Edit listing".',
  },
  {
    q: 'Why is my listing marked "Pending approval"?',
    a: 'New listings may require admin approval before appearing in public search results. This is part of keeping the marketplace safe and trustworthy for the whole community.',
  },
];

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-extrabold text-text">Help Center</h1>
        </div>
        <p className="text-sm text-muted mb-8">Answers to common questions about using the marketplace</p>

        <div className="flex flex-col gap-4 mb-10">
          {faqs.map((item, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-5">
              <p className="font-semibold text-text mb-1.5">{item.q}</p>
              <p className="text-sm text-muted leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary-soft border border-primary/20 rounded-xl p-6 text-center">
          <p className="font-semibold text-text mb-1">Still need help?</p>
          <p className="text-sm text-muted mb-4">Reach out and we'll get back to you as soon as we can.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            
              <a href="mailto:support@marketplace.example"
              className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
            >
              <Mail className="w-4 h-4" />
              Email support
            </a>
            <Link
              to="/messages"
              className="flex items-center gap-2 border border-border bg-white hover:bg-bg text-text font-semibold px-5 py-2.5 rounded-lg text-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              Open messages
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpPage;