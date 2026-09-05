import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  LogOut,
  ShieldCheck,
  Menu,
  Wallet,
  ArrowLeft,
  UserCircle,
} from 'lucide-react';

import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ============================================================
  // USER INITIALS
  // ============================================================

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`
      .toUpperCase();
  };

  // ============================================================
  // ROLE LABEL
  // ============================================================

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator';

      case 'premium':
        return 'Premium User';

      default:
        return 'Normal User';
    }
  };

  // ============================================================
  // ROLE BADGE CLASS
  // ============================================================

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      case 'premium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';

      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // ============================================================
  // LOGOUT HANDLER
  // ============================================================

  const handleLogout = () => {
    logout();
  };

  // ============================================================
  // NAVBAR
  // ============================================================

  return (
    <header className="bg-slate-900/85 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ======================================================
            LEFT SIDE
        ====================================================== */}

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
            title="Open navigation menu"
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go Back"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-1.5 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />

            <span className="text-xs font-semibold hidden sm:inline text-slate-300">
              Back
            </span>
          </button>

          {/* ==================================================
              BRAND
          ================================================== */}

          <Link
            to="/dashboard"
            aria-label="Go to BudgetBuddy dashboard"
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0"
          >

            {/* Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>

            {/* Brand Text */}
            <div className="min-w-0">

              <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                BudgetBuddy
              </span>

              <p className="text-[11px] text-slate-400 hidden sm:block font-medium truncate">
                Your money. Your goals. Your future.
              </p>

            </div>

          </Link>
        </div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        {user && (
          <div className="flex items-center gap-2 sm:gap-3">

            {/* ==================================================
                NOTIFICATION BELL
            ================================================== */}

            <NotificationBell />

            {/* ==================================================
                EMAIL VERIFICATION STATUS
            ================================================== */}

            {user.is_email_verified && (
              <div
                title="Email verified"
                className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />

                <span>
                  Verified
                </span>
              </div>
            )}

            {/* ==================================================
                USER PROFILE
            ================================================== */}

            <Link
              to="/profile"
              aria-label="Open profile"
              className="flex items-center gap-2 sm:gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700"
            >

              {/* Avatar */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                {getInitials(user.full_name)}
              </div>

              {/* User Details */}
              <div className="hidden md:block text-left max-w-[180px]">

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-200 truncate">
                    {user.full_name || 'User'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${getRoleBadgeClass()}`}
                  >
                    {getRoleLabel()}
                  </span>

                </div>

              </div>

              {/* Mobile Profile Icon */}
              <UserCircle className="w-4 h-4 text-slate-500 hidden sm:block md:hidden" />

            </Link>

            {/* ==================================================
                LOGOUT
            ================================================== */}

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>
        )}

      </div>
    </header>
  );
}
