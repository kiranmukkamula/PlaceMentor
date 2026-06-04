require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const applicationRoutes = require('./routes/applications');
const resumeRoutes = require('./routes/resume');
const rankingRoutes = require('./routes/ranking');
const usersRoutes = require('./routes/users');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Set specific origins in production
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
app.use(cors());
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

const interviewRoutes = require('./routes/interview');
app.use('/api/interview', interviewRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('PlaceMentor API is running');
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});