import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Save,
  RefreshCw,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  KeyRound,
  MailCheck,
} from 'lucide-react';

export default function Profile() {
  const { user, setUser, showToast, logout } = useAuth();
  const navigate = useNavigate();

  // ============================================================
  // PROFILE STATE
  // ============================================================

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');

  // ============================================================
  // PASSWORD STATE
  // ============================================================

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState('standard');

  const [currentPassword, setCurrentPassword] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ============================================================
  // DELETE ACCOUNT STATE
  // ============================================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ============================================================
  // FETCH PROFILE
  // ============================================================

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await api.get('/profile');

        setProfile(res.data);

        setFullName(
          res.data?.full_name ||
          user?.full_name ||
          ''
        );

        setCurrency(
          res.data?.currency ||
          'INR (₹)'
        );
      } catch (err) {
        console.error('Profile loading error:', err);
        showToast('error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, showToast]);

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      showToast('error', 'Full name cannot be empty.');
      return;
    }

    setSaving(true);

    try {
      const res = await api.put('/profile', {
        full_name: trimmedName,
        currency,
      });

      setProfile(res.data);

      if (user) {
        const updatedUser = {
          ...user,
          full_name: trimmedName,
          currency,
        };

        setUser(updatedUser);

        localStorage.setItem(
          'budgetbuddy_user',
          JSON.stringify(updatedUser)
        );
      }

      setFullName(trimmedName);

      showToast(
        'success',
        'Profile updated successfully!'
      );
    } catch (err) {
      console.error('Profile update error:', err);

      showToast(
        'error',
        err.response?.data?.detail ||
          'Failed to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // PASSWORD FORM RESET
  // ============================================================

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordMode('standard');
  };

  const closePasswordModal = () => {
    if (changingPassword || sendingOtp) return;

    resetPasswordForm();
    setShowPasswordModal(false);
  };

  // ============================================================
  // SEND FORGOT PASSWORD OTP
  // ============================================================

  const handleSendForgotOTP = async () => {
    setPasswordError('');

    if (!user?.email) {
      setPasswordError(
        'Your registered email address could not be found.'
      );
      return;
    }

    setSendingOtp(true);

    try {
      await api.post(
        '/auth/forgot-password/send-otp',
        {
          email: user.email,
        }
      );

      showToast(
        'info',
        'Password reset OTP code sent to your registered email.'
      );

      setPasswordMode('forgot_otp');
    } catch (err) {
      console.error('Forgot password OTP error:', err);

      setPasswordError(
        err.response?.data?.detail ||
          'Failed to send OTP to your email.'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // ----------------------------------------------------------
    // STANDARD PASSWORD CHANGE
    // ----------------------------------------------------------

    if (passwordMode === 'standard') {
      if (!currentPassword) {
        setPasswordError(
          'Current password is required.'
        );
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        setPasswordError(
          'New password must be at least 6 characters.'
        );
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setPasswordError(
          'New password and confirm password do not match.'
        );
        return;
      }

      if (currentPassword === newPassword) {
        setPasswordError(
          'New password must be different from your current password.'
        );
        return;
      }

      setChangingPassword(true);

      try {
        await api.put(
          '/auth/change-password',
          {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmNewPassword,
          }
        );

        showToast(
          'success',
          'Password changed successfully!'
        );

        resetPasswordForm();
        setShowPasswordModal(false);
      } catch (err) {
        console.error('Change password error:', err);

        setPasswordError(
          err.response?.data?.detail ||
            'Current password is incorrect or new password strength is insufficient.'
        );
      } finally {
        setChangingPassword(false);
      }

      return;
    }

    // ----------------------------------------------------------
    // OTP PASSWORD RESET
    // ----------------------------------------------------------

    if (!forgotOtp || forgotOtp.length !== 6) {
      setPasswordError(
        'Please enter a valid 6-digit OTP code.'
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(
        'New password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError(
        'New password and confirm password do not match.'
      );
      return;
    }

    if (!user?.email) {
      setPasswordError(
        'Your registered email address could not be found.'
      );
      return;
    }

    setChangingPassword(true);

    try {
      const cleanOtp = forgotOtp.trim();

      // Verify OTP
      await api.post(
        '/auth/forgot-password/verify-otp',
        {
          email: user.email,
          otp: cleanOtp,
        }
      );

      // Reset password
      await api.post(
        '/auth/forgot-password/reset',
        {
          email: user.email,
          otp: cleanOtp,
          new_password: newPassword,
          confirm_password: confirmNewPassword,
        }
      );

      showToast(
        'success',
        'Password updated successfully via OTP! 🎉'
      );

      resetPasswordForm();
      setShowPasswordModal(false);
    } catch (err) {
      console.error(
        'OTP password reset error:',
        err
      );

      setPasswordError(
        err.response?.data?.detail ||
          'Invalid OTP code or password reset failed.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError(
        'Please enter your current password to confirm account deletion.'
      );
      return;
    }

    setDeleting(true);

    try {
      await api.delete('/auth/me', {
        data: {
          password: deletePassword,
        },
      });

      showToast(
        'info',
        'Your account has been deleted successfully.'
      );

      setShowDeleteModal(false);
      setDeletePassword('');

      logout();
      navigate('/login');
    } catch (err) {
      console.error(
        'Delete account error:',
        err
      );

      setDeleteError(
        err.response?.data?.detail ||
          'Incorrect password. Account deletion canceled.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(false);
  };

  // ============================================================
  // DATE FORMATTER
  // ============================================================

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  };

  // ============================================================
  // ROLE HELPERS
  // ============================================================

  const role = user?.role || 'user';

  const isAdmin = role === 'admin';
  const isPremium = role === 'premium';
  const hasPremiumAccess =
    isAdmin || isPremium;

  const getAccountType = () => {
    if (isAdmin) return 'Administrator';
    if (isPremium) return 'Premium User';
    return 'Normal User';
  };

  const getInitials = () => {
    const name = user?.full_name?.trim();

    if (!name) return 'U';

    const parts = name.split(/\s+/);

    if (parts.length >= 2) {
      return (
        `${parts[0][0]}${parts[1][0]}`
      ).toUpperCase();
    }

    return name
      .slice(0, 2)
      .toUpperCase();
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
        </div>

        <div className="text-center">
          <p className="text-white text-sm font-bold">
            Loading user profile...
          </p>

          <p className="text-slate-500 text-xs mt-1">
            Please wait while we retrieve your account details.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // NO USER STATE
  // ============================================================

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <h2 className="text-lg font-bold text-white">
            Unable to load profile
          </h2>

          <p className="text-slate-400 text-sm mt-2">
            Please log in again to continue.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-slate-900/70 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

          <div className="flex items-center space-x-4">

            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-xl flex items-center justify-center shadow-xl shadow-blue-900/30">
              {getInitials()}
            </div>

            {/* User information */}
            <div>
              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-black text-white">
                  {user.full_name || 'User'}
                </h1>

                {user.is_email_verified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Not Verified
                  </span>
                )}

              </div>

              <p className="text-slate-400 text-xs mt-1.5">
                {user.email}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">

                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Account Type
                </span>

                {isAdmin && (
                  <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Administrator
                  </span>
                )}

                {isPremium && (
                  <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Premium User
                  </span>
                )}

                {role === 'user' && (
                  <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                    <User className="w-3 h-3" />
                    Normal User
                  </span>
                )}

              </div>
            </div>
          </div>

          {/* Email verification button */}
          {!user.is_email_verified && (
            <button
              onClick={() =>
                navigate('/verify-email', {
                  state: {
                    email: user.email,
                  },
                })
              }
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all"
            >
              Verify Email
            </button>
          )}

        </div>
      </div>

      {/* ======================================================
          ACCOUNT INFORMATION + PROFILE PREFERENCES
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Account Information */}
        <div className="md:col-span-1 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-5">

          <div>
            <h3 className="font-bold text-white text-base">
              Account Information
            </h3>

            <p className="text-slate-500 text-xs mt-1">
              Your BudgetBuddy account details.
            </p>
          </div>

          <div className="space-y-3 text-xs">

            {/* Account Type */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">
                Account Type
              </span>

              <span className="font-semibold text-slate-200 text-right">
                {getAccountType()}
              </span>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">
                Role
              </span>

              <span className="font-bold uppercase tracking-widest text-blue-400">
                {role}
              </span>
            </div>

            {/* Premium Access */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">
                Premium Access
              </span>

              <span
                className={`font-semibold ${
                  hasPremiumAccess
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {hasPremiumAccess
                  ? 'Enabled'
                  : 'Not Enabled'}
              </span>
            </div>

            {/* Admin Access */}
            {isAdmin && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">
                  Admin Access
                </span>

                <span className="font-semibold text-rose-400">
                  Enabled
                </span>
              </div>
            )}

            {/* Email Status */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">
                Email Status
              </span>

              <span
                className={`font-semibold ${
                  user.is_email_verified
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {user.is_email_verified
                  ? 'Verified'
                  : 'Pending'}
              </span>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Member Since</span>
              </span>

              <span className="font-semibold text-slate-200 text-right">
                {formatDate(user.created_at)}
              </span>
            </div>

          </div>
        </div>

        {/* Profile Preferences */}
        <div className="md:col-span-2 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800">

          <div className="mb-6">
            <h3 className="font-bold text-white text-lg">
              Profile Preferences
            </h3>

            <p className="text-slate-500 text-xs mt-1">
              Update your personal information and preferred currency.
            </p>
          </div>

          <form
            onSubmit={handleUpdateProfile}
            className="space-y-5"
          >

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>

              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />

                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
                <span className="text-slate-500 ml-1">
                  (Read Only)
                </span>
              </label>

              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />

                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred Currency
              </label>

              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value)
                }
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                <option value="INR (₹)">
                  INR - Indian Rupee (₹)
                </option>

                <option value="USD ($)">
                  USD - US Dollar ($)
                </option>

                <option value="EUR (€)">
                  EUR - Euro (€)
                </option>

                <option value="GBP (£)">
                  GBP - British Pound (£)
                </option>
              </select>
            </div>

            {/* Save */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 text-sm transition-all"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                <span>
                  {saving
                    ? 'Saving...'
                    : 'Save Profile Changes'}
                </span>
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ======================================================
          PASSWORD SECURITY
      ====================================================== */}

      <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Lock className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">
              Password Security
            </h3>

            <p className="text-slate-400 text-xs mt-0.5">
              Change your password using your current password or secure email OTP verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetPasswordForm();
            setShowPasswordModal(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* ======================================================
          PREMIUM UPGRADE
      ====================================================== */}

      {role === 'user' && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/5 p-6 sm:p-8 rounded-3xl border border-yellow-500/30 flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex-1 space-y-2">

            <h3 className="font-bold text-yellow-400 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Upgrade to Premium</span>
            </h3>

            <p className="text-slate-300 text-sm">
              Unlock advanced analytics, premium insights, AI-powered financial assistance, and detailed report exports.
            </p>

            <ul className="text-xs text-slate-400 space-y-1.5 mt-3 list-disc list-inside">
              <li>
                Advanced monthly trend charts and spending analysis
              </li>

              <li>
                AI-based spending analysis and personalized budgeting
              </li>

              <li>
                Download detailed financial reports as PDF and Excel
              </li>

              <li>
                Advanced budget utilization and savings goal analytics
              </li>
            </ul>

          </div>

          <button
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-yellow-500/20 transition-all shrink-0 w-full md:w-auto"
          >
            Upgrade to Premium
          </button>

        </div>
      )}

      {/* ======================================================
          DANGER ZONE
      ====================================================== */}

      <div className="bg-red-950/10 p-6 sm:p-8 rounded-3xl border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

        <div className="flex items-center gap-3">

          <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Trash2 className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">
              Delete Account
            </h3>

            <p className="text-slate-400 text-xs mt-0.5">
              Permanently remove your account, transactions, budgets, savings goals, and related data.
            </p>
          </div>

        </div>

        <button
          onClick={() => {
            setDeletePassword('');
            setDeleteError('');
            setShowDeleteModal(true);
          }}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/25 transition-all shrink-0"
        >
          Delete Account
        </button>

      </div>

      {/* ======================================================
          CHANGE PASSWORD MODAL
      ====================================================== */}

      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in">

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">

              <div className="flex items-center gap-2 text-indigo-400">
                <Lock className="w-5 h-5" />

                <h3 className="text-lg font-bold text-white">
                  {passwordMode === 'standard'
                    ? 'Change Password'
                    : 'Reset Password via OTP'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword || sendingOtp}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleChangePassword}
              className="mt-4 space-y-4"
            >

              {/* Error */}
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* STANDARD MODE */}
              {passwordMode === 'standard' ? (
                <>
                  {/* Current Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">

                      <label className="block text-xs font-semibold text-slate-300">
                        Current Password
                      </label>

                      <button
                        type="button"
                        disabled={sendingOtp || changingPassword}
                        onClick={handleSendForgotOTP}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <MailCheck className="w-3 h-3" />

                        <span>
                          {sendingOtp
                            ? 'Sending OTP...'
                            : 'Forgot Password? Use OTP'}
                        </span>
                      </button>

                    </div>

                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Password
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />

                    <p className="text-[10px] text-slate-500 mt-1">
                      Minimum 6 characters.
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) =>
                        setConfirmNewPassword(e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Information */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs leading-relaxed">
                    OTP code has been sent to{' '}
                    <strong className="text-blue-200">
                      {user.email}
                    </strong>
                    . Enter the 6-digit code below along with your new password.
                  </div>

                  {/* OTP */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      6-Digit Verification OTP
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) =>
                        setForgotOtp(
                          e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 6)
                        )
                      }
                      placeholder="123456"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm tracking-[0.35em] text-center font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Password
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) =>
                        setConfirmNewPassword(e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Back */}
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode('standard');
                      setForgotOtp('');
                      setPasswordError('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline block text-center pt-1"
                  >
                    Back to Standard Change Password
                  </button>
                </>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword || sendingOtp}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword || sendingOtp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword
                    ? 'Updating...'
                    : passwordMode === 'standard'
                    ? 'Confirm Password Change'
                    : 'Update Password via OTP'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE ACCOUNT MODAL
      ====================================================== */}

      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade-in">

            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">

              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />

                <h3 className="text-lg font-bold text-white">
                  Confirm Account Deletion
                </h3>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleDeleteAccount}
              className="mt-4 space-y-4"
            >

              {/* Warning */}
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">

                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />

                  <div>
                    <p className="text-red-300 text-xs font-bold">
                      This action cannot be undone.
                    </p>

                    <p className="text-slate-300 text-xs leading-relaxed mt-1.5">
                      Deleting your account will permanently remove your bank accounts, transactions, budgets, savings goals, and related financial data.
                    </p>
                  </div>

                </div>
              </div>

              {/* Error */}
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Current Password
                </label>

                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) =>
                    setDeletePassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-red-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/30"
                />

                <p className="text-[10px] text-slate-500 mt-1.5">
                  Your password is required to confirm this permanent action.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}

                  <span>
                    {deleting
                      ? 'Deleting...'
                      : 'Permanently Delete Account'}
                  </span>
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
