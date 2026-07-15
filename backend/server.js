require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/socketHandler');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initializeSocket(io);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Smart Community Marketplace API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));