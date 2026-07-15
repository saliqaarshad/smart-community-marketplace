TEYZIX CORE Internship Program - Task FSWD-3
Smart Community Service & Local Marketplace Platform

Submitted by: Saliqa Arshad

DESCRIPTION
-----------
A production-ready full-stack MERN marketplace platform where community
members can list products, offer services, manage bookings, chat in real
time, and build trust through reviews and ratings.

Key features:
- Secure authentication with JWT and role-based access control (user/admin)
- Product and service listings with image upload, search, filters, and pagination
- Full booking lifecycle (request, accept/reject, complete, cancel)
- Reviews and ratings with automatic average recalculation
- Real-time chat with Socket.io (typing indicators, read receipts)
- In-app notifications for bookings, messages, and reviews
- Admin panel for user and listing moderation
- Fully responsive design

LIVE PROJECT LINK
------------------
Frontend: https://smart-community-marketplace-nine.vercel.app
Backend API: https://smart-community-marketplace-production.up.railway.app

GITHUB REPOSITORY
------------------
https://github.com/saliqaarshad/smart-community-marketplace

TECH STACK
----------
Frontend: React (Vite), Tailwind CSS v4, React Router, Axios, Socket.io-client
Backend: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, Cloudinary
Deployment: Vercel (frontend), Railway (backend), MongoDB Atlas (database)

HOW TO RUN LOCALLY
-------------------
1. Backend setup:
   cd backend
   npm install
   (create a .env file - see README.md in the repo for required variables)
   npm run dev

2. Frontend setup:
   cd frontend
   npm install
   (create a .env file - see README.md in the repo for required variables)
   npm run dev

3. The app will run at http://localhost:5173 (frontend)
   and http://localhost:5000 (backend API)

TEST ACCOUNT (for evaluation)
-------------------------------
Email: saliqatest@example.com
Password: 123456
Role: admin (has access to the Admin Panel)

NOTES
-----
Full setup instructions, API documentation, and project structure details
are available in README.md within the repository.