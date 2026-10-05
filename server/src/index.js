const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

// Fail fast if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const applicationRoutes = require('./routes/applications');
const resumeRoutes = require('./routes/resume');
const rankingRoutes = require('./routes/ranking');
const usersRoutes = require('./routes/users');
const experiencesRoutes = require('./routes/experiences');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS configuration supporting single origin or comma-separated list
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost', 'http://localhost:80'];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback to allow proxied same-origin requests
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('join-admin-room', (companyId) => {
    socket.join(`admin-company-${companyId}`);
    console.log(`Socket ${socket.id} joined admin-company-${companyId}`);
  });

  socket.on('join-interview-room', (token) => {
    socket.join(`interview-${token}`);
    console.log(`Socket ${socket.id} joined interview-${token}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Pass io to request object so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded resumes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/experiences', experiencesRoutes);

const interviewRoutes = require('./routes/interview');
app.use('/api/interview', interviewRoutes);

// Health check endpoint for Docker & monitoring
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Base route
app.get('/', (req, res) => {
  res.send('PlaceMentor API is running');
});

// Start Server listening on 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});