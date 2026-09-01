import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FinanceQuotes from '../components/FinanceQuotes';
import walletImg from '../assets/budgetbuddy-wallet.png';
import { Wallet, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes expiry countdown
  const [resendCooldown, setResendCooldown] = useState(30); // 30 sec cooldown
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      // If no email, check if user exists in auth
      const savedUser = localStorage.getItem('budgetbuddy_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setEmail(u.email);
      }
    }
  }, [email]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtpDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) return;

    setSubmitting(true);
    const res = await verifyOTP(email, fullOtp);
    setSubmitting(false);

    if (res.success) {
      if (res.user?.email && res.user.email !== email) {
        alert(`IMPORTANT: Your admin login email has been automatically generated as:\n\n${res.user.email}\n\nPlease use this new email to log in from now on.`);
      }

      let target = '/dashboard';
      if (res.user?.role === 'admin') target = '/admin';
      else if (res.user?.role === 'premium') target = '/premium';
      navigate(target, { replace: true });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    const res = await resendOTP(email);
    setResending(false);

    if (res.success) {
      setTimer(300);
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding & Wallet image */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                BudgetBuddy
              </h1>
              <p className="text-sm font-semibold text-blue-400">
                Email Verification
              </p>
            </div>
          </div>

          <div className="relative group flex justify-center py-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-30"></div>
            <img
              src={walletImg}
              alt="BudgetBuddy Security"
              className="relative w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl object-cover"
            />
          </div>

          <FinanceQuotes />
        </div>

        {/* Right Side: OTP Input Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verify your email</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              We sent a 6-digit verification code to <br />
              <strong className="text-blue-400">{email || 'your email address'}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input Grid */}
            <div className="flex justify-center items-center space-x-2" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 bg-slate-900 border border-slate-700/80 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                />
              ))}
            </div>

            {/* Timer & Expiry */}
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-400">
                Code expires in: <strong className="text-amber-400 font-bold">{formatTimer(timer)}</strong>
              </span>
              {timer === 0 && (
                <span className="text-red-400 font-semibold">OTP Expired!</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitting || otpDigits.join('').length < 6 || timer === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all"
              >
                <span>{submitting ? 'Verifying Code...' : 'Verify Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-xl border border-slate-700 flex items-center justify-center space-x-2 text-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>
                  {resending
                    ? 'Resending OTP...'
                    : resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend OTP Code'}
                </span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
