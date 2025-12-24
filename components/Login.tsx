
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile } from '../services/journalService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (!username.trim()) {
          throw new Error('Please choose a username.');
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(cred.user.uid, email, username);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-8 bg-[#0d1618] selection:bg-primary/30">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Brand Icon */}
        <div className="mb-12">
          <div className="w-24 h-24 rounded-[2.5rem] bg-[#112124] flex items-center justify-center border border-white/5 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-5xl font-light">menu_book</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            {isRegistering ? 'Begin Journey' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {isRegistering ? 'Create your sacred space' : 'Resume your journey'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="w-full space-y-6">
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl bg-[#112124] border border-white/5 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all animate-in fade-in slide-in-from-top-1"
                placeholder="choose a handle"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email or Username</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-[#112124] border border-white/5 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-5 pr-14 rounded-2xl bg-[#112124] border border-white/5 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all"
                placeholder="Enter your password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <span className={`material-symbols-outlined text-xl ${showPassword ? 'filled' : ''}`}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {!isRegistering && (
              <div className="flex justify-end">
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity mt-1">
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <p className="text-red-500 text-center text-[10px] font-black uppercase tracking-widest leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? '...' : (
              <>
                <span>{isRegistering ? 'Sign Up' : 'Sign In'}</span>
                <span className="material-symbols-outlined text-lg">login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 font-medium text-xs">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }} 
              className="ml-2 text-primary font-black uppercase tracking-widest"
            >
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
