import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Chat() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const handleLogout = () => {
    if (socket) {
      socket.close();
    }
    logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const newSocket = io(API_URL, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    newSocket.on('online users', (users) => {
      console.log('Online users updated:', users);
      setOnlineUsers(new Set(users));
    });

    newSocket.on('private message', (message) => {
      console.log('Received message:', message);
      setMessages((prev) => {
        const messageExists = prev.some(
          (m) => m._id === message._id || 
          (m.sender === message.sender && 
           m.receiver === message.receiver && 
           m.content === message.content && 
           new Date(m.timestamp).getTime() === new Date(message.timestamp).getTime())
        );
        
        if (messageExists) {
          return prev;
        }
        
        return [...prev, message];
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      console.log('Joining room for user:', user.id);
      socket.emit('join', user.id);
    }
  }, [socket, user]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/users/chatlist`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      content: newMessage,
      sender: user.id,
      receiver: selectedUser._id,
      timestamp: new Date()
    };

    console.log('Sending message:', messageData);
    socket.emit('private message', messageData);
    
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <span className="ml-2 text-lg font-medium text-gray-900">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Users List */}
        <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Conversations</h2>
            <div className="space-y-2">
              {users.map((chat) => (
                <button
                  key={chat.user._id}
                  onClick={() => setSelectedUser(chat.user)}
                  className={`w-full text-left p-3 rounded-lg ${
                    selectedUser?._id === chat.user._id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 relative">
                      <UserCircleIcon className="h-10 w-10 text-gray-400" />
                      {onlineUsers.has(chat.user._id) && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{chat.user.username}</p>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 relative">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    {onlineUsers.has(selectedUser._id) && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">{selectedUser.username}</p>
                    <p className="text-sm text-gray-500">
                      {onlineUsers.has(selectedUser._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.sender === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === user.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === user.id ? 'text-indigo-200' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat; 