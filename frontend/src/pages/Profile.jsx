import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, Calendar, DollarSign, Save, RefreshCw, Lock, Trash2, AlertTriangle, CheckCircle2, X, KeyRound, MailCheck } from 'lucide-react';

export default function Profile() {
  const { user, setUser, showToast, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');

  // Change Password Modal fields
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState('standard'); // 'standard' or 'forgot_otp'
  const [currentPassword, setCurrentPassword] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete Account Modal fields
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/profile');
        setProfile(res.data);
        setFullName(res.data.full_name || user?.full_name || '');
        setCurrency(res.data.currency || 'INR (₹)');
      } catch (err) {
        showToast('error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', {
        full_name: fullName,
        currency,
      });
      setProfile(res.data);
      if (user) {
        const updatedUser = { ...user, full_name: fullName };
        setUser(updatedUser);
        localStorage.setItem('budgetbuddy_user', JSON.stringify(updatedUser));
      }
      showToast('success', 'Profile updated successfully!');
    } catch (err) {
      showToast('error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendForgotOTP = async () => {
    setPasswordError('');
    setSendingOtp(true);
    try {
      await api.post('/auth/forgot-password/send-otp', { email: user?.email });
      showToast('info', 'Password reset OTP code sent to your registered email.');
      setPasswordMode('forgot_otp');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to send OTP to your email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordMode === 'standard') {
      if (!currentPassword) {
        setPasswordError('Current password is required.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setPasswordError('New password and confirm password do not match.');
        return;
      }

      setChangingPassword(true);
      try {
        await api.put('/auth/change-password', {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmNewPassword,
        });
        showToast('success', 'Password changed successfully!');
        resetPasswordForm();
        setShowPasswordModal(false);
      } catch (err) {
        setPasswordError(err.response?.data?.detail || 'Current password is incorrect or new password strength insufficient.');
      } finally {
        setChangingPassword(false);
      }
    } else {
      // OTP Reset mode
      if (!forgotOtp || forgotOtp.length !== 6) {
        setPasswordError('Please enter a 6-digit OTP code.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setPasswordError('New password and confirm password do not match.');
        return;
      }

      setChangingPassword(true);
      try {
        await api.post('/auth/forgot-password/verify-otp', {
          email: user?.email,
          otp: forgotOtp.trim(),
        });

        await api.post('/auth/forgot-password/reset', {
          email: user?.email,
          otp: forgotOtp.trim(),
          new_password: newPassword,
          confirm_password: confirmNewPassword,
        });

        showToast('success', 'Password updated successfully via OTP! 🎉');
        resetPasswordForm();
        setShowPasswordModal(false);
      } catch (err) {
        setPasswordError(err.response?.data?.detail || 'Invalid OTP code or password reset failed.');
      } finally {
        setChangingPassword(false);
      }
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordMode('standard');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your current password to confirm account deletion.');
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/auth/me', {
        data: { password: deletePassword }
      });
      showToast('info', 'Your account has been deleted successfully.');
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Incorrect password. Account deletion canceled.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xl">
            {user?.full_name?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white">{user?.full_name}</h1>
              {user?.is_email_verified ? (
                <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Email Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Not Verified</span>
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-1">{user?.email}</p>
          </div>
        </div>

        {!user?.is_email_verified && (
          <button
            onClick={() => navigate('/verify-email', { state: { email: user?.email } })}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all"
          >
            Verify Here
          </button>
        )}
      </div>

      {/* Grid: Account Info & Profile Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Account Info Card */}
        <div className="md:col-span-1 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base">Account Information</h3>
          
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Email Status</span>
              </span>
              {user?.is_email_verified ? (
                <span className="font-semibold text-emerald-400">✓ Verified</span>
              ) : (
                <span className="font-semibold text-amber-400">⚠ Not Verified</span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Member Since</span>
              </span>
              <span className="font-semibold text-slate-200">{formatDate(user?.created_at)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Default Currency</span>
              </span>
              <span className="font-semibold text-slate-200">{profile?.currency || 'INR (₹)'}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="md:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-white text-lg mb-6">Profile Preferences</h3>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address (Read Only)
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="INR (₹)">INR - Indian Rupee (₹)</option>
                <option value="USD ($)">USD - US Dollar ($)</option>
                <option value="EUR (€)">EUR - Euro (€)</option>
                <option value="GBP (£)">GBP - British Pound (£)</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center space-x-2 text-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Password Security Action Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Password Security</h3>
            <p className="text-slate-400 text-xs mt-0.5">Change your password with current password or via OTP email verification</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetPasswordForm();
            setShowPasswordModal(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* Danger Zone: Account Delete */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/20 bg-red-950/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Delete Account</h3>
            <p className="text-slate-400 text-xs mt-0.5">Permanently remove your account, transactions, and budgets. This action cannot be undone.</p>
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">
                  {passwordMode === 'standard' ? 'Change Password' : 'Reset Password via OTP'}
                </h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordMode === 'standard' ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Current Password</label>
                      <button
                        type="button"
                        disabled={sendingOtp}
                        onClick={handleSendForgotOTP}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
                      >
                        <MailCheck className="w-3 h-3" />
                        <span>{sendingOtp ? 'Sending OTP...' : 'Forgot Password? (Use OTP)'}</span>
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                    OTP code has been sent to <strong>{user?.email}</strong>. Enter the OTP below along with your new password.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit Verification OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm tracking-widest text-center font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setPasswordMode('standard')}
                    className="text-xs text-slate-400 hover:text-white underline block text-center pt-1"
                  >
                    Back to Standard Change Password
                  </button>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : passwordMode === 'standard' ? 'Confirm Change Password' : 'Update Password via OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeleteAccount} className="mt-4 space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Are you sure you want to delete your account? This action is <strong className="text-red-400">permanent</strong> and will delete all your bank accounts, transactions, savings goals, and reports.
              </p>

              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enter Current Password to Confirm</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-red-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
