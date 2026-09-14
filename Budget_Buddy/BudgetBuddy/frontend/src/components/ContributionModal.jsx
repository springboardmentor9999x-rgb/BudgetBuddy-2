import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ContributionModal({ goal, onClose, onSuccess }) {
  const { showToast } = useAuth();
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/accounts');
        setAccounts(response.data);
        if (response.data.length > 0) {
          setAccountId(response.data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch accounts');
      } finally {
        setFetchingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  if (!goal) return null;

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!accountId) {
      setError('Please select a bank account');
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid contribution amount greater than 0');
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === parseInt(accountId));
    if (selectedAccount && val > selectedAccount.current_balance) {
      setError(`Insufficient balance in ${selectedAccount.bank_name}. Available: ₹${selectedAccount.current_balance.toLocaleString('en-IN')}`);
      return;
    }

    if (val > remaining) {
      setError(`Contribution amount cannot exceed remaining target of ₹${remaining.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/goals/${goal.id}/contribute`, { amount: val, account_id: parseInt(accountId) });
      showToast('success', `Contributed ₹${val.toLocaleString('en-IN')} to '${goal.title}' from ${selectedAccount?.bank_name}! 🎉`);
      window.dispatchEvent(new Event('refreshNotifications'));
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to contribute to goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade-in">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Contribute to Goal</h3>
            <p className="text-slate-400 text-xs mt-0.5">{goal.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Target Amount:</span>
              <span className="font-semibold text-slate-200">₹{goal.target_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Currently Saved:</span>
              <span className="font-semibold text-emerald-400">₹{goal.current_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Needed:</span>
              <span className="font-semibold text-blue-400">₹{remaining.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={fetchingAccounts}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none disabled:opacity-50"
              required
            >
              {fetchingAccounts ? (
                <option value="">Loading accounts...</option>
              ) : accounts.length === 0 ? (
                <option value="">No accounts found</option>
              ) : (
                accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} — Available: ₹{acc.current_balance.toLocaleString('en-IN')}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contribution Amount (₹)</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingAccounts || accounts.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Confirm Contribution'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
