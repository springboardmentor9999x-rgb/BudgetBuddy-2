import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import TransactionList from '../components/TransactionList';
import { useAuth } from '../context/AuthContext';
import { Plus, TrendingUp, X, RefreshCw } from 'lucide-react';

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const { showToast } = useAuth();

  const [formData, setFormData] = useState({
    account_id: '',
    source: 'Salary',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, accRes] = await Promise.all([
        api.get('/incomes'),
        api.get('/accounts'),
      ]);
      setIncomes(incRes.data);
      setAccounts(accRes.data);
      if (accRes.data.length > 0 && !formData.account_id) {
        setFormData((prev) => ({ ...prev, account_id: accRes.data[0].id }));
      }
    } catch (err) {
      showToast('error', 'Failed to load income data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (income = null) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        account_id: income.account_id,
        source: income.source,
        amount: String(income.amount),
        date: income.date ? income.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: income.notes || '',
      });
    } else {
      setEditingIncome(null);
      setFormData({
        account_id: accounts.length > 0 ? accounts[0].id : '',
        source: 'Salary',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_id) {
      showToast('error', 'Please select an account.');
      return;
    }

    if (!formData.notes || !formData.notes.trim()) {
      showToast('error', 'Description / Notes are required for income.');
      return;
    }

    const payload = {
      account_id: parseInt(formData.account_id),
      source: formData.source,
      amount: parseFloat(formData.amount),
      date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      notes: formData.notes.trim(),
    };

    try {
      if (editingIncome) {
        await api.put(`/incomes/${editingIncome.id}`, payload);
        showToast('success', 'Income record updated!');
      } else {
        await api.post('/incomes', payload);
        showToast('success', 'Income added successfully! Account balance increased.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to save income record');
    }
  };

  const handleDelete = async (tx) => {
    if (!window.confirm(`Are you sure you want to delete this income record of ₹${tx.amount}?`)) {
      return;
    }
    try {
      await api.delete(`/incomes/${tx.raw_id || tx.id}`);
      showToast('success', 'Income deleted successfully. Account balance restored.');
      fetchData();
    } catch (err) {
      showToast('error', 'Failed to delete income.');
    }
  };

  const totalIncomeAmount = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Income Management</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Record salaries, freelance payouts, gifts, and business revenues</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={accounts.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Income</span>
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          ⚠️ You need to add at least one Bank Account before adding Income records.
        </div>
      )}

      {/* Summary metric */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recorded Incomes</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            + ₹{totalIncomeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      {/* Income List */}
      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading income records...</p>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="font-bold text-white text-lg mb-4">All Income Records</h3>
          <TransactionList
            transactions={incomes.map((inc) => ({
              id: inc.id,
              raw_id: inc.id,
              type: 'income',
              title: `Income: ${inc.source}`,
              category: inc.source,
              amount: inc.amount,
              account_name: inc.account_name,
              date: inc.date,
              notes: inc.notes,
            }))}
            onEdit={(tx) => {
              const target = incomes.find((i) => i.id === (tx.raw_id || tx.id));
              if (target) handleOpenModal(target);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Income Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingIncome ? 'Edit Income Record' : 'Add Income'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Select Target Account
                </label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((acc) => {
                    const b = (acc.bank_name || '').trim();
                    const a = (acc.account_name || '').trim();
                    const label = (!a || b.toLowerCase() === a.toLowerCase()) ? b : `${b} (${a})`;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {label} — ₹{acc.current_balance.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Income Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Salary">Salary</option>
                  <option value="Freelancing">Freelancing</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Business">Business</option>
                  <option value="Gift">Gift</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 30000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Notes / Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter required notes or description"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25"
                >
                  {editingIncome ? 'Save Changes' : 'Record Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
