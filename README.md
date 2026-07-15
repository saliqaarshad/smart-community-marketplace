# Smart Community Service & Local Marketplace Platform

A production-ready full-stack MERN marketplace where community members can list products, offer services, manage bookings, chat in real time, and build trust through reviews — built as **Task FSWD-3** for the **TEYZIX CORE Internship Program**.

🔗 **Live App:** https://smart-community-marketplace-nine.vercel.app
🔗 **API:** https://smart-community-marketplace-production.up.railway.app
🔗 **GitHub:** https://github.com/saliqaarshad/smart-community-marketplace

---

## Features

### Authentication & Users
- Secure registration/login with JWT + bcrypt password hashing
- Protected routes, role-based access control (user/admin)
- Forgot/reset password flow
- Editable user profiles (bio, location, skills, profile picture via Cloudinary)
- Public seller/provider profile pages with stats, listings, and reviews

### Marketplace
- Separate Product and Service listings with full CRUD
- Multi-image upload (Cloudinary), category-specific fields
- Keyword search, category/price/location filters, sorting, pagination
- Favorites system

### Bookings
- Full booking lifecycle: request → accept/reject → complete → cancel
- Buyer and seller dashboard views with status filtering
- Ownership and status-transition guards

### Reviews & Ratings
- One review per completed booking
- Automatic average rating recalculation on both users and listings
- Report review functionality for moderation

### Real-Time Communication
- Socket.io-powered live chat between buyers and sellers
- Typing indicators, read receipts, conversation history
- Real-time and in-app notifications for bookings, messages, and reviews

### Admin Panel
- Platform statistics dashboard
- User management (search, suspend/unsuspend)
- Listing moderation (approve/reject/remove)
- Reported content review

### UI/UX
- Fully responsive design (mobile, tablet, desktop)
- Custom purple-themed design system built with Tailwind CSS v4
- Smooth animations and micro-interactions throughout

---

## Tech Stack

**Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios, Socket.io-client, Lucide Icons, React Hot Toast

**Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, bcrypt, Multer, Cloudinary

**Deployment:** Vercel (frontend), Railway (backend), MongoDB Atlas (database)

---

## Project Structure
smart-marketplace/
├── backend/
│   ├── config/          # DB and Cloudinary configuration
│   ├── controllers/      # Route handler logic
│   ├── middleware/        # Auth and upload middleware
│   ├── models/            # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── socket/              # Socket.io event handlers
│   └── server.js
└── frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── context/         # Auth context
│   ├── pages/            # Route-level page components
│   └── utils/             # Axios instance
└── vite.config.js
---

## Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Cloudinary account

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Overview

| Resource | Base Route |
|---|---|
| Auth | `/api/auth` |
| Products | `/api/products` |
| Services | `/api/services` |
| Bookings | `/api/bookings` |
| Reviews | `/api/reviews` |
| Favorites | `/api/favorites` |
| Conversations/Messages | `/api/conversations` |
| Notifications | `/api/notifications` |
| Admin | `/api/admin` |

All protected routes require an `Authorization: Bearer <token>` header.

---

## Author

**Saliqa Arshad** — TEYZIX CORE Internship Program, Full Stack Web Development track