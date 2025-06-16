# Real-time Messaging Application

A full-stack real-time messaging application built with Node.js, Express, Socket.IO, MongoDB, and React.

## Features

- User authentication (signup/login)
- Real-time messaging using Socket.IO
- Private messaging between users
- Message history persistence
- Online/offline status
- Beautiful UI with Tailwind CSS
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Create a new account or log in with existing credentials
3. Start chatting with other users

## Deployment

### Backend Deployment

1. Choose a hosting platform (e.g., Heroku, DigitalOcean, AWS)
2. Set up environment variables on your hosting platform
3. Deploy your Node.js application

### Frontend Deployment

1. Build the frontend application:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the built files to a static hosting service (e.g., Netlify, Vercel, GitHub Pages)

## Technologies Used

- Backend:
  - Node.js
  - Express
  - Socket.IO
  - MongoDB
  - JWT Authentication

- Frontend:
  - React
  - Socket.IO Client
  - Tailwind CSS
  - React Router
  - Axios

## License

MIT 