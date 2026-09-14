import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, PieChart, AlertCircle, CheckCircle2, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const { showToast } = useAuth();

  const now = new Date();
  const [formData, setFormData] = useState({
    category: 'Food',
    monthly_limit: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data);
    } catch (err) {
      showToast('error', 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleOpenModal = (b = null) => {
    if (b) {
      setEditingBudget(b);
      setFormData({
        category: b.category,
        monthly_limit: String(b.monthly_limit),
        month: b.month,
        year: b.year,
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: 'Food',
        monthly_limit: '',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cat = formData.category;
    const m = parseInt(formData.month);
    const y = parseInt(formData.year);

    const isDuplicate = budgets.some((b) => {
      if (editingBudget && b.id === editingBudget.id) return false;
      return b.category === cat && b.month === m && b.year === y;
    });

    if (isDuplicate) {
      showToast('error', `A budget for category "${cat}" in month ${m}/${y} already exists. Duplicate budget limits for the same category in a month are not allowed.`);
      return;
    }

    const payload = {
      category: cat,
      monthly_limit: parseFloat(formData.monthly_limit),
      month: m,
      year: y,
    };

    try {
      if (editingBudget) {
        await api.put(`/budgets/${editingBudget.id}`, payload);
        showToast('success', 'Budget limit updated!');
      } else {
        await api.post('/budgets', payload);
        showToast('success', 'New monthly budget created successfully!');
      }
      setShowModal(false);
      fetchBudgets();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget limit?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      showToast('success', 'Budget deleted.');
      fetchBudgets();
    } catch (err) {
      showToast('error', 'Failed to delete budget.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Monthly Budget Limits</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Control category-wise spending limits and receive over-budget warnings</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center space-x-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Budget</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Calculating budget utilization...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 inline-block">
            <PieChart className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white">No Monthly Budgets Configured</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Set monthly limits for categories like Food, Shopping, or Travel to prevent overspending.</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            + Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-2xl glass-card border ${
                b.is_exceeded
                  ? 'border-red-500/50 bg-red-950/20'
                  : b.utilization_percentage >= 80
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-slate-800'
              } flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {b.month}/{b.year} Budget
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">{b.category}</h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenModal(b)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                    title="Edit Budget"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Amounts */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Spent: ₹{b.spent_amount.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-white">Limit: ₹{b.monthly_limit.toLocaleString('en-IN')}</span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.is_exceeded
                        ? 'bg-red-500'
                        : b.utilization_percentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(b.utilization_percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">{b.utilization_percentage}% Used</span>
                  <span className={b.remaining_amount < 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                    {b.remaining_amount >= 0
                      ? `₹${b.remaining_amount.toLocaleString('en-IN')} remaining`
                      : `₹${Math.abs(b.remaining_amount).toLocaleString('en-IN')} over limit`}
                  </span>
                </div>
              </div>

              {/* Exceeded Warning Banner */}
              {b.is_exceeded && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>Budget Exceeded! You have spent more than your limit.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Budget Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingBudget ? 'Edit Budget Limit' : 'Create Monthly Budget'}
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
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Food">Food & Dining</option>
                  <option value="Travel">Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills">Bills & Utilities</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Rent">Rent</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 5000"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Month
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                      <option key={m} value={m}>Month {m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25"
                >
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
