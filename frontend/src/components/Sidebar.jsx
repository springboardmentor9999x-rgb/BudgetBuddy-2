import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  User,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ============================================================
  // ROLE CHECKS
  // ============================================================

  const role = user?.role || 'user';

  const isAdmin = role === 'admin';
  const isPremium = role === 'premium';

  const hasAdvancedAccess = isAdmin || isPremium;

  // ============================================================
  // BASE NAVIGATION
  // Available to every authenticated user
  // ============================================================

  const baseNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Bank Accounts',
      path: '/accounts',
      icon: CreditCard,
    },
    {
      label: 'Income',
      path: '/income',
      icon: TrendingUp,
    },
    {
      label: 'Expenses',
      path: '/expenses',
      icon: TrendingDown,
    },
    {
      label: 'Budgets',
      path: '/budgets',
      icon: PieChart,
    },
    {
      label: 'Savings Goals',
      path: '/goals',
      icon: Target,
    },
  ];

  // ============================================================
  // BUILD ROLE-BASED NAVIGATION
  //
  // ADMIN:
  // Admin Dashboard appears FIRST.
  //
  // PREMIUM:
  // Advanced Analytics + Premium Reports.
  //
  // NORMAL USER:
  // Basic navigation only.
  //
  // ALL USERS:
  // My Profile.
  // ============================================================

  const navItems = [];

  // Admin Dashboard must always be first for Admin
  if (isAdmin) {
    navItems.push({
      label: 'Admin Dashboard',
      path: '/admin',
      icon: ShieldCheck,
      special: 'admin',
    });
  }

  // Common navigation
  navItems.push(...baseNavItems);

  // Premium + Admin features
  if (hasAdvancedAccess) {
    navItems.push(
      {
        label: 'Advanced Analytics',
        path: '/analytics',
        icon: BarChart3,
        special: 'premium',
      },
      {
        label: 'Premium Reports',
        path: '/reports',
        icon: FileText,
        special: 'premium',
      }
    );
  }

  // Profile for everyone
  navItems.push({
    label: 'My Profile',
    path: '/profile',
    icon: User,
  });

  // ============================================================
  // ACTIVE PATH CHECK
  // ============================================================

  const isPathActive = (path) => {
    return location.pathname === path;
  };

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
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`
      .toUpperCase();
  };

  // ============================================================
  // ROLE LABEL
  // ============================================================

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'ADMIN';

      case 'premium':
        return 'PREMIUM';

      default:
        return 'USER';
    }
  };

  // ============================================================
  // ROLE COLOR
  // ============================================================

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return 'text-rose-400';

      case 'premium':
        return 'text-yellow-400';

      default:
        return 'text-emerald-400';
    }
  };

  // ============================================================
  // ROLE ICON
  // ============================================================

  const RoleIcon = isAdmin
    ? ShieldCheck
    : isPremium
      ? ShieldCheck
      : User;

  // ============================================================
  // CLOSE MOBILE SIDEBAR
  // ============================================================

  const handleNavigation = () => {
    if (onClose) {
      onClose();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ========================================================
          MOBILE BACKDROP
      ======================================================== */}

      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40
          bg-slate-900/95
          border-r border-slate-800/80
          backdrop-blur-xl
          transition-all duration-300 ease-in-out
          flex flex-col
          justify-between
          md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >

        {/* ======================================================
            MAIN SIDEBAR CONTENT
        ====================================================== */}

        <div className="flex-1 overflow-y-auto py-4 px-3">

          {/* ====================================================
              MOBILE HEADER
          ==================================================== */}

          <div className="flex items-center justify-between md:hidden pb-3 mb-4 px-2 border-b border-slate-800">

            <div>
              <p className="font-bold text-slate-200 text-sm">
                BudgetBuddy
              </p>

              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                Navigation
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* ====================================================
              GO BACK BUTTON
          ==================================================== */}

          <div className="px-1 mb-4">

            <button
              type="button"
              onClick={() => navigate(-1)}
              title="Go Back to Previous Page"
              className={`
                w-full
                flex items-center
                gap-3
                px-3 py-2.5
                rounded-xl
                text-xs font-bold
                text-slate-300
                bg-slate-800/50
                hover:bg-blue-600/20
                hover:text-blue-400
                border border-slate-700/60
                hover:border-blue-500/40
                transition-all
                group
                ${isCollapsed ? 'md:justify-center md:px-0' : ''}
              `}
            >

              <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-1 transition-transform shrink-0" />

              <span
                className={`
                  ${isCollapsed ? 'md:hidden' : 'block'}
                `}
              >
                Go Back
              </span>

            </button>

          </div>

          {/* ====================================================
              DIVIDER
          ==================================================== */}

          <div className="h-px bg-slate-800/70 mx-1 mb-4" />

          {/* ====================================================
              NAVIGATION
          ==================================================== */}

          <nav
            aria-label="Main navigation"
            className="space-y-1.5"
          >

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(item.path);

              const isAdminItem = item.special === 'admin';
              const isPremiumItem = item.special === 'premium';

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigation}
                  title={
                    isCollapsed
                      ? item.label
                      : undefined
                  }
                  className={`
                    relative
                    flex items-center
                    gap-3.5
                    px-3.5 py-3
                    rounded-xl
                    text-sm font-semibold
                    transition-all
                    group
                    ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : isAdminItem
                          ? 'text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'
                          : isPremiumItem
                            ? 'text-yellow-300/80 hover:text-yellow-200 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                    }
                  `}
                >

                  {/* Active Indicator */}
                  {isActive && (
                    <span
                      className="
                        absolute
                        left-0
                        top-2
                        bottom-2
                        w-1
                        bg-gradient-to-b
                        from-blue-500
                        to-indigo-500
                        rounded-r-full
                      "
                    />
                  )}

                  {/* Admin Indicator */}
                  {isAdminItem && !isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-rose-500/60 rounded-r-full" />
                  )}

                  {/* Premium Indicator */}
                  {isPremiumItem && !isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-yellow-500/50 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <Icon
                    className={`
                      w-5 h-5
                      shrink-0
                      transition-transform
                      group-hover:scale-110
                      ${
                        isActive
                          ? 'text-blue-400'
                          : isAdminItem
                            ? 'text-rose-400'
                            : isPremiumItem
                              ? 'text-yellow-400'
                              : 'text-slate-400 group-hover:text-blue-400'
                      }
                    `}
                  />

                  {/* Label */}
                  <span
                    className={`
                      truncate
                      ${isCollapsed ? 'md:hidden' : 'block'}
                    `}
                  >
                    {item.label}
                  </span>

                </NavLink>
              );
            })}

          </nav>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-900/70">

          {/* ====================================================
              USER PROFILE CARD
          ==================================================== */}

          {user && (
            <div
              className={`
                flex items-center
                gap-3
                p-2
                rounded-xl
                bg-slate-950/60
                border border-slate-800/80
                ${isCollapsed
                  ? 'md:justify-center md:p-1.5'
                  : ''
                }
              `}
            >

              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                {getInitials(user.full_name)}
              </div>

              {/* User Information */}
              <div
                className={`
                  flex-1
                  min-w-0
                  ${isCollapsed ? 'md:hidden' : 'block'}
                `}
              >

                <p className="text-xs font-bold text-slate-200 truncate">
                  {user.full_name || 'User'}
                </p>

                <div className="flex items-center gap-1 mt-1">

                  <RoleIcon
                    className={`w-3 h-3 ${getRoleColor()}`}
                  />

                  <span
                    className={`text-[10px] font-bold tracking-wide ${getRoleColor()}`}
                  >
                    {getRoleLabel()}
                  </span>

                </div>

              </div>

            </div>
          )}

          {/* ====================================================
              COLLAPSE / EXPAND
          ==================================================== */}

          <button
            type="button"
            onClick={onToggleCollapse}
            title={
              isCollapsed
                ? 'Expand Sidebar'
                : 'Collapse Sidebar'
            }
            aria-label={
              isCollapsed
                ? 'Expand Sidebar'
                : 'Collapse Sidebar'
            }
            className="
              hidden md:flex
              w-full
              items-center
              justify-center
              gap-2
              py-2
              rounded-xl
              text-xs
              font-semibold
              text-slate-400
              hover:text-white
              bg-slate-800/40
              hover:bg-slate-800
              border border-slate-800
              hover:border-slate-700
              transition-all
            "
          >

            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}

          </button>

        </div>

      </aside>
    </>
  );
}

