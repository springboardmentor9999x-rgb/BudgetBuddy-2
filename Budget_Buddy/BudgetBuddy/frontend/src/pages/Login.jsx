import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FinanceQuotes from '../components/FinanceQuotes';
import walletImg from '../assets/budgetbuddy-wallet.png';
import { Wallet, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      let target = from;
      if (from === '/dashboard') {
        if (res.user.role === 'admin') target = '/admin';
        else if (res.user.role === 'premium') target = '/premium';
      }
      navigate(target, { replace: true });
    } else if (res.isUnverified) {
      // Send a fresh OTP and redirect to verify email page
      await resendOTP(email);
      navigate('/verify-email', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding & Illustration */}
        <div className="flex flex-col justify-between space-y-6 md:pr-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                  BudgetBuddy
                </h1>
                <p className="text-sm font-semibold text-blue-400">
                  Your money. Your goals. Your future.
                </p>
              </div>
            </div>

            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Welcome back to your financial control center. Log in to track expenses, monitor budget utilization, and manage your bank balances.
            </p>
          </div>

          <div className="relative group flex justify-center py-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <img
              src={walletImg}
              alt="BudgetBuddy Finance"
              className="relative w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl object-cover"
            />
          </div>

          <FinanceQuotes />
        </div>

        {/* Right Side: Login Form */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-400 text-xs mt-1">Log in to manage your BudgetBuddy account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-400 font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{submitting ? 'Logging in...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
