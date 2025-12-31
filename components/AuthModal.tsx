
import React, { useState } from 'react';

interface AuthModalProps {
  onLoginSuccess: (username: string, token: string) => void;
}

type AuthState = 'SIGNUP' | 'VERIFY' | 'LOGIN';

const API_BASE_URL = 'http://127.0.0.1:5000';

const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [authState, setAuthState] = useState<AuthState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    code: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      setAuthState('VERIFY');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      onLoginSuccess(data.username, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      onLoginSuccess(data.username, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass p-10 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-2xl relative">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">WorkLens<span className="text-lime-500">.</span></h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-bold">Secure Access Node</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
          {error}
        </div>
      )}

      {authState === 'LOGIN' && (
        <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <input
            name="email"
            type="email"
            placeholder="EMAIL ADDRESS"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-lime-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 font-medium text-center tracking-widest text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="ACCESS KEY"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-lime-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 font-medium text-center tracking-widest text-sm"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'AUTHENTICATING...' : 'ESTABLISH SESSION'}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setAuthState('SIGNUP')}
              className="text-zinc-500 hover:text-lime-400 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Request New Clearance (Signup)
            </button>
          </div>
        </form>
      )}

      {authState === 'SIGNUP' && (
        <form onSubmit={handleSignup} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <input
            name="username"
            type="text"
            placeholder="IDENTITY (USERNAME)"
            value={formData.username}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-lime-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 font-medium text-center tracking-widest text-sm"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="CONTACT EMAIL"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-lime-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 font-medium text-center tracking-widest text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="CREATE KEY"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-lime-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 font-medium text-center tracking-widest text-sm"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'REGISTERING...' : 'INITIATE REGISTRATION'}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setAuthState('LOGIN')}
              className="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Return to Login
            </button>
          </div>
        </form>
      )}

      {authState === 'VERIFY' && (
        <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lime-500/10 text-lime-500 mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-xs">Code sent to <span className="text-white font-mono">{formData.email}</span></p>
          </div>

          <input
            name="code"
            type="text"
            placeholder="ENTER 6-DIGIT CODE"
            maxLength={6}
            value={formData.code}
            onChange={handleChange}
            className="w-full bg-white/5 border border-lime-500/30 rounded-xl px-5 py-4 text-lime-500 focus:outline-none focus:border-lime-500 focus:bg-lime-500/5 transition-all placeholder:text-zinc-700 font-bold text-center tracking-[0.5em] text-xl"
            required
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] disabled:opacity-50"
          >
            {isLoading ? 'VERIFYING...' : 'VERIFY & LOGIN'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AuthModal;
