
import React from 'react';
import AuthModal from './AuthModal';

interface LoginProps {
  onLogin: (user: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const handleLoginSuccess = (username: string, token: string) => {
    // Optionally store token in localStorage here
    // localStorage.setItem('token', token);
    onLogin(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-white/[0.02] blur-[120px] rounded-full"></div>
      
      {/* Auth Container */}
      <div className="z-10 w-full max-w-md">
        <AuthModal onLoginSuccess={handleLoginSuccess} />
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
    </div>
  );
};

export default Login;
