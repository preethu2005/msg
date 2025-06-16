import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to="/login" replace />} 
            />
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <Register /> : <Navigate to="/chat" />} 
            />
            <Route 
              path="/chat" 
              element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/login" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 