import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        setError('Access Denied: Student accounts cannot access the Admin Portal.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 selection:bg-purple-500 selection:text-white">
      <div className="max-w-md w-full space-y-8 bg-slate-800/90 backdrop-blur-xl p-10 rounded-3xl border border-slate-700 shadow-2xl shadow-purple-950/20">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 items-center justify-center text-white shadow-lg shadow-purple-600/30 font-black text-2xl mb-4">
            <ShieldCheck size={28} />
          </div>
          <div className="inline-block bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Restricted Access
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Admin Portal Sign In</h2>
          <p className="text-sm text-slate-400 mt-2">PlaceMentor Officer & Placement Coordinator Access</p>
        </div>

        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 text-xs text-purple-200 flex items-start gap-3">
          <AlertCircle size={18} className="text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-purple-300 block mb-0.5">Admin Security Requirement</span>
            Administrator privileges are exclusively granted to registered system admin credentials (<code className="bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-200 font-mono">admin@gmail.com</code>).
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="text-rose-400 text-sm text-center bg-rose-950/50 border border-rose-800/60 p-3.5 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Admin Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-xl block w-full pl-11 pr-4 py-3.5 border border-slate-700 bg-slate-900/70 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl block w-full pl-11 pr-4 py-3.5 border border-slate-700 bg-slate-900/70 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-purple-500/30 shadow-lg shadow-purple-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying Admin Access...' : 'Sign In to Admin Portal'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 pt-2 border-t border-slate-700/60">
          Are you a student?{' '}
          <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer">
            Student Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
