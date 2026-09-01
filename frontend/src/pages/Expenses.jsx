import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import TransactionList from '../components/TransactionList';
import { useAuth } from '../context/AuthContext';
import { Plus, TrendingDown, X, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { showToast } = useAuth();

  const [formData, setFormData] = useState({
    account_id: '',
    title: '',
    category: 'Food',
    amount: '',
    payment_method: 'UPI',
    card_type: '',
    card_last4: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, accRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/accounts'),
      ]);
      setExpenses(expRes.data);
      setAccounts(accRes.data);
      if (accRes.data.length > 0 && !formData.account_id) {
        setFormData((prev) => ({ ...prev, account_id: accRes.data[0].id }));
      }
    } catch (err) {
      showToast('error', 'Failed to load expense data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        account_id: expense.account_id,
        title: expense.title,
        category: expense.category,
        amount: String(expense.amount),
        payment_method: expense.payment_method,
        card_type: expense.card_type || '',
        card_last4: expense.card_last4 || '',
        date: expense.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        description: expense.description || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        account_id: accounts.length > 0 ? accounts[0].id : '',
        title: '',
        category: 'Food',
        amount: '',
        payment_method: 'UPI',
        card_type: '',
        card_last4: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
      });
    }
    setShowModal(true);
  };

  const selectedAccount = accounts.find((a) => String(a.id) === String(formData.account_id));
  const isInsufficient = selectedAccount && formData.amount && parseFloat(formData.amount) > selectedAccount.current_balance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_id) {
      showToast('error', 'Please select an account.');
      return;
    }

    if (!formData.description || !formData.description.trim()) {
      showToast('error', 'Description / Vendor details are required for expenses.');
      return;
    }

    if (isInsufficient) {
      showToast('error', `Insufficient balance in ${selectedAccount.bank_name}. Available: ₹${selectedAccount.current_balance}`);
      return;
    }

    const payload = {
      account_id: parseInt(formData.account_id),
      title: formData.title,
      category: formData.category,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      card_type: ['Debit Card', 'Credit Card'].includes(formData.payment_method) ? formData.card_type || null : null,
      card_last4: ['Debit Card', 'Credit Card'].includes(formData.payment_method) ? formData.card_last4 || null : null,
      date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      description: formData.description.trim(),
    };

    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
        showToast('success', 'Expense updated!');
      } else {
        await api.post('/expenses', payload);
        showToast('success', 'Expense added successfully! Account balance deducted.');
      }
      window.dispatchEvent(new Event('refreshNotifications'));
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to save expense');
    }
  };

  const handleDelete = async (tx) => {
    if (!window.confirm(`Are you sure you want to delete expense "${tx.title}" of ₹${tx.amount}?`)) {
      return;
    }
    try {
      await api.delete(`/expenses/${tx.raw_id || tx.id}`);
      showToast('success', 'Expense deleted. Account balance restored.');
      fetchData();
    } catch (err) {
      showToast('error', 'Failed to delete expense.');
    }
  };

  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Expense Tracking</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Track daily spends, category breakdown, card payments, and receipts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={accounts.length === 0}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/20 flex items-center space-x-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          ⚠️ You need to add at least one Bank Account before adding Expenses.
        </div>
      )}

      {/* Summary metric */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recorded Expenses</span>
          <div className="text-3xl font-black text-red-400 mt-1">
            - ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
          <TrendingDown className="w-8 h-8" />
        </div>
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading expense history...</p>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="font-bold text-white text-lg mb-4">All Expenses</h3>
          <TransactionList
            transactions={expenses.map((exp) => ({
              id: exp.id,
              raw_id: exp.id,
              type: 'expense',
              title: exp.title,
              category: exp.category,
              amount: exp.amount,
              account_name: `${exp.account_name || 'Account'} (${exp.payment_method}${exp.card_last4 ? ` ****${exp.card_last4}` : ''})`,
              date: exp.date,
              notes: exp.description,
            }))}
            onEdit={(tx) => {
              const target = expenses.find((e) => e.id === (tx.raw_id || tx.id));
              if (target) handleOpenModal(target);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
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
                  Expense Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery Shopping, Fuel, Rent"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Select Account
                </label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
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
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
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
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Insufficient Balance warning badge */}
              {isInsufficient && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>
                    Insufficient balance in this account! Available: ₹{selectedAccount.current_balance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>

              {['Debit Card', 'Credit Card'].includes(formData.payment_method) && (
                <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Card Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Visa, Mastercard"
                      value={formData.card_type}
                      onChange={(e) => setFormData({ ...formData, card_type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4582"
                      value={formData.card_last4}
                      onChange={(e) => setFormData({ ...formData, card_last4: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Vendor <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter required notes or merchant details"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
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
                  disabled={isInsufficient}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-500/25"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
