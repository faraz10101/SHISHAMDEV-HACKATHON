import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { Button } from './components/ui/button';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // login | register | dashboard
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if token exists on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Ideal situation: verify token from backend, yahan hum dashboard state par move ho sakte hain
      setCurrentScreen('dashboard');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentScreen('login');
  };

  if (currentScreen === 'login') {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentScreen('register')}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterForm
        onSwitchToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 gap-4 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200 text-center space-y-4 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-slate-800">Welcome Back! 🎉</h1>
        <p className="text-slate-500">You have successfully authenticated with your Express Backend.</p>
        <div className="bg-slate-100 p-3 rounded-md text-left text-xs font-mono break-all text-slate-600">
          Token: {localStorage.getItem('token') || 'No Token'}
        </div>
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          Sign Out & Clear Token
        </Button>
      </div>
    </div>
  );
}