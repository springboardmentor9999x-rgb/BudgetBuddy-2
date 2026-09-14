import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, ShieldCheck, Menu, Wallet, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo, Mobile Toggle & Back Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/80 border border-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate(-1)}
            title="Go Back"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center space-x-1.5 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold hidden sm:inline text-slate-300">Back</span>
          </button>

          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                  BudgetBuddy
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Your money. Your goals. Your future.
              </p>
            </div>
          </Link>
        </div>

        {/* Right Side: User Profile & Actions */}
        {user && (
          <div className="flex items-center space-x-3 sm:space-x-4">
            <NotificationBell />

            {user.is_email_verified && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
            )}

            <Link
              to="/profile"
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                {getInitials(user.full_name)}
              </div>
              <span className="text-sm font-semibold text-slate-200 hidden md:block">
                {user.full_name}
              </span>
            </Link>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
