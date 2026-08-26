import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SavingsGoalForm({ goal, onClose, onSuccess }) {
  const { showToast } = useAuth();
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState('other');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!goal;

  const goalTypes = [
    { value: 'emergency_fund', label: 'Emergency Fund' },
    { value: 'travel', label: 'Travel & Vacation' },
    { value: 'education', label: 'Education' },
    { value: 'electronics', label: 'Electronics & Gadgets' },
    { value: 'vehicle', label: 'Vehicle / Car' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setGoalType(goal.goal_type || 'other');
      setTargetAmount(goal.target_amount || '');
      setCurrentAmount(goal.current_amount || 0);
      if (goal.target_date) {
        setTargetDate(new Date(goal.target_date).toISOString().split('T')[0]);
      }
    }
  }, [goal]);

  useEffect(() => {
    if (!isEdit) {
      const fetchAccounts = async () => {
        setFetchingAccounts(true);
        try {
          const response = await api.get('/accounts');
          setAccounts(response.data);
          if (response.data.length > 0) {
            setAccountId(response.data[0].id);
          }
        } catch (err) {
          console.error('Failed to fetch accounts', err);
        } finally {
          setFetchingAccounts(false);
        }
      };
      fetchAccounts();
    }
  }, [isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const tAmt = parseFloat(targetAmount);
    if (isNaN(tAmt) || tAmt <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }
    const cAmt = parseFloat(currentAmount);
    if (isNaN(cAmt) || cAmt < 0) {
      setError('Current amount must be 0 or greater');
      return;
    }
    if (cAmt > tAmt) {
      setError('Initial saved amount cannot exceed target amount');
      return;
    }
    if (!isEdit && cAmt > 0 && !accountId) {
      setError('Please select an account to deduct the initial amount from');
      return;
    }

    if (!targetDate) {
      setError('Target date is required');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(targetDate);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Target completion date cannot be in the past');
      return;
    }

    setLoading(true);
    const dateFormatted = targetDate.includes('T') ? targetDate : `${targetDate}T00:00:00`;
    const payload = {
      title: title.trim(),
      goal_type: goalType,
      target_amount: tAmt,
      current_amount: cAmt,
      target_date: dateFormatted,
    };

    if (!isEdit && cAmt > 0) {
      payload.account_id = parseInt(accountId);
    }

    try {
      if (isEdit) {
        await api.put(`/goals/${goal.id}`, payload);
        showToast('success', `Savings goal '${title.trim()}' updated! 🎉`);
      } else {
        await api.post('/goals', payload);
        showToast('success', `Savings goal '${title.trim()}' created! 🎉`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save savings goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? 'Edit Savings Goal' : '+ Create New Savings Goal'}
          </h3>
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Laptop, Emergency Fund"
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Type</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            >
              {goalTypes.map((gt) => (
                <option key={gt.value} value={gt.value}>
                  {gt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Amount (₹)</label>
              <input
                type="number"
                step="any"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="50000"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                required
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Saved Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  max={targetAmount}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                />
              </div>
            )}
          </div>

          {!isEdit && parseFloat(currentAmount) > 0 && (
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 mt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Account to Deduct From</label>
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
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Completion Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : isEdit ? 'Update Goal' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
