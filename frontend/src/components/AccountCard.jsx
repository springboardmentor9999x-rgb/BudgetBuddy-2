import React from 'react';
import { CreditCard, Wallet, Smartphone, Landmark, PiggyBank, Coins, Briefcase, ShieldCheck, GraduationCap, TrendingUp, Edit2, Trash2 } from 'lucide-react';

export default function AccountCard({ account, onEdit, onDelete }) {
  const { bank_name, account_name, account_type, current_balance, last4 } = account;

  const getTypeIcon = () => {
    const t = (account_type || '').toLowerCase();
    if (t.includes('upi')) return <Smartphone className="w-5 h-5 text-emerald-400" />;
    if (t.includes('pocket money') || t.includes('cash') || t.includes('stash')) return <Coins className="w-5 h-5 text-amber-400" />;
    if (t.includes('wallet')) return <Wallet className="w-5 h-5 text-amber-400" />;
    if (t.includes('salary')) return <Briefcase className="w-5 h-5 text-teal-400" />;
    if (t.includes('credit card')) return <CreditCard className="w-5 h-5 text-purple-400" />;
    if (t.includes('emergency') || t.includes('deposit')) return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
    if (t.includes('student') || t.includes('allowance')) return <GraduationCap className="w-5 h-5 text-indigo-400" />;
    if (t.includes('investment') || t.includes('wealth')) return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (t.includes('savings')) return <PiggyBank className="w-5 h-5 text-blue-400" />;
    return <Landmark className="w-5 h-5 text-indigo-400" />;
  };

  const getGradient = () => {
    const t = (account_type || '').toLowerCase();
    if (t.includes('upi')) return 'from-emerald-900/40 via-slate-900 to-slate-900 border-emerald-500/30';
    if (t.includes('pocket money') || t.includes('cash') || t.includes('wallet')) return 'from-amber-900/40 via-slate-900 to-slate-900 border-amber-500/30';
    if (t.includes('credit card')) return 'from-purple-900/40 via-slate-900 to-slate-900 border-purple-500/30';
    if (t.includes('salary')) return 'from-teal-900/40 via-slate-900 to-slate-900 border-teal-500/30';
    return 'from-blue-900/40 via-slate-900 to-slate-900 border-blue-500/30';
  };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${getGradient()} border shadow-xl flex flex-col justify-between glass-card-hover relative group`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg leading-snug">{bank_name}</h3>
            {account_name && account_name.trim().toLowerCase() !== bank_name.trim().toLowerCase() && (
              <p className="text-xs text-slate-400 font-medium">{account_name}</p>
            )}
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {account_type}
        </span>
      </div>

      <div className="mt-6 mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Available Balance</span>
        <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          ₹{Number(current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 font-medium">
          {last4 ? `Account ending ****${last4}` : 'Primary Account'}
        </span>
        <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(account)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              title="Edit Account"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(account.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
