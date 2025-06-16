const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Store online users
const onlineUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  onlineUsers.set(socket.userId, socket.id);

  // Broadcast online users to all clients
  io.emit('online users', Array.from(onlineUsers.keys()));

  // Handle private messages
  socket.on('private message', async (message) => {
    try {
      console.log('Received message:', message);
      
      // Save message to database
      const newMessage = new Message({
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        timestamp: message.timestamp
      });
      
      const savedMessage = await newMessage.save();
      console.log('Saved message:', savedMessage);

      // Send to sender
      socket.emit('private message', savedMessage);

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(message.receiver);
      if (receiverSocketId) {
        console.log('Sending to receiver:', receiverSocketId);
        io.to(receiverSocketId).emit('private message', savedMessage);
      } else {
        console.log('Receiver is offline:', message.receiver);
      }
    } catch (error) {
      console.error('Error saving/sending message:', error);
    }
  });

  // Handle user joining
  socket.on('join', (userId) => {
    console.log('User joined:', userId);
    onlineUsers.set(userId, socket.id);
    io.emit('online users', Array.from(onlineUsers.keys()));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    onlineUsers.delete(socket.userId);
    io.emit('online users', Array.from(onlineUsers.keys()));
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Message routes
app.get('/api/messages/users/chatlist', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get all users except the current user
    const users = await User.find({ _id: { $ne: userId } });

    // Get the last message for each conversation
    const chatList = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, receiver: user._id },
            { sender: user._id, receiver: userId }
          ]
        }).sort({ timestamp: -1 });

        return {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email
          },
          lastMessage: lastMessage
        };
      })
    );

    res.json(chatList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Profile route
app.get('/api/auth/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 