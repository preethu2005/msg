const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username profilePicture')
    .populate('receiver', 'username profilePicture');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get all users with their last message
router.get('/users/chatlist', auth, async (req, res) => {
  try {
    // Get all users except current user
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('username profilePicture status lastSeen');

    // Get last message for each conversation
    const chatList = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: req.userId, receiver: user._id },
          { sender: user._id, receiver: req.userId }
        ]
      })
      .sort({ timestamp: -1 })
      .select('content timestamp read');

      return {
        user,
        lastMessage: lastMessage || null
      };
    }));

    res.json(chatList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat list', error: error.message });
  }
});

// Mark messages as read
router.put('/:userId/read', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.userId,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

module.exports = router; 