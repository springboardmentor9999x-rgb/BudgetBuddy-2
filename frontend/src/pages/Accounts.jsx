import React, { useState, useEffect } from 'react';
import api, { parseApiError } from '../api/axios';
import AccountCard from '../components/AccountCard';
import { useAuth } from '../context/AuthContext';
import { Plus, CreditCard, X, RefreshCw } from 'lucide-react';

const POPULAR_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Kotak Mahindra Bank',
  'IDFC FIRST Bank',
  'IndusInd Bank',
  'Federal Bank',
  'Yes Bank',
  'Central Bank of India',
  'Indian Bank',
  'Bank of India',
  'UCO Bank',
  'DBS Bank India',
  'Standard Chartered Bank',
  'HSBC India',
  'Post Office Savings Bank (POSB)',
  'Paytm Payments Bank / Wallet',
  'PhonePe / BHIM UPI',
  'Google Pay (GPay)',
  'Amazon Pay Balance',
  'CRED Cash / Pay',
  'MobiKwik Wallet',
  'Cash Stash / Pocket Money',
  'Piggy Bank / Savings Jar',
  'Other / Custom Bank',
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const { showToast } = useAuth();

  const [selectedBankPreset, setSelectedBankPreset] = useState(POPULAR_BANKS[0]);
  const [customBankName, setCustomBankName] = useState('');

  const [formData, setFormData] = useState({
    bank_name: '',
    account_type: 'Savings Account',
    opening_balance: '0',
    last4: '',
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      showToast('error', parseApiError(err, 'Failed to load accounts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      const isPreset = POPULAR_BANKS.includes(account.bank_name);
      if (isPreset) {
        setSelectedBankPreset(account.bank_name);
        setCustomBankName('');
      } else {
        setSelectedBankPreset('Other / Custom Bank');
        setCustomBankName(account.bank_name);
      }

      setFormData({
        bank_name: account.bank_name,
        account_type: account.account_type,
        opening_balance: String(account.opening_balance),
        last4: account.last4 || '',
      });
    } else {
      setEditingAccount(null);
      setSelectedBankPreset(POPULAR_BANKS[0]);
      setCustomBankName('');
      setFormData({
        bank_name: POPULAR_BANKS[0],
        account_type: 'Savings Account',
        opening_balance: '0',
        last4: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const actualBankName = selectedBankPreset === 'Other / Custom Bank'
      ? customBankName.trim()
      : selectedBankPreset;

    if (!actualBankName) {
      showToast('error', 'Please select or enter a valid Bank Name.');
      return;
    }

    if (actualBankName.length < 2) {
      showToast('error', 'Bank name must be at least 2 characters.');
      return;
    }

    const trimmedLast4 = (formData.last4 || '').trim();
    const effectiveAccountName = trimmedLast4 ? `${actualBankName} (*${trimmedLast4})` : actualBankName;

    const dupAcc = accounts.find((acc) => {
      if (editingAccount && acc.id === editingAccount.id) return false;
      const sameBank = acc.bank_name.trim().toLowerCase() === actualBankName.toLowerCase();
      const sameLast4 = (acc.last4 || '').trim() === trimmedLast4;
      return sameBank && sameLast4;
    });

    if (dupAcc) {
      showToast(
        'error',
        `An account for "${actualBankName}" ${trimmedLast4 ? `ending in digits "${trimmedLast4}"` : ''} already exists. Duplicate bank accounts are not allowed.`
      );
      return;
    }

    const parsedBalance = parseFloat(formData.opening_balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      showToast('error', 'Opening balance must be a valid positive number or 0.');
      return;
    }

    const payload = {
      bank_name: actualBankName,
      account_name: effectiveAccountName,
      account_type: formData.account_type,
      opening_balance: parsedBalance,
      last4: trimmedLast4 || null,
    };

    try {
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload);
        showToast('success', 'Account updated successfully!');
      } else {
        await api.post('/accounts', payload);
        showToast('success', 'New account created successfully!');
      }
      setShowModal(false);
      fetchAccounts();
    } catch (err) {
      showToast('error', parseApiError(err, 'Failed to save account'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account? All associated transactions will also be deleted.')) {
      return;
    }
    try {
      await api.delete(`/accounts/${id}`);
      showToast('success', 'Account deleted successfully.');
      fetchAccounts();
    } catch (err) {
      showToast('error', parseApiError(err, 'Failed to delete account.'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Bank & Financial Accounts</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Manage savings, current, UPI, cash, and digital wallets</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center space-x-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Account</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 inline-block">
            <CreditCard className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white">No Financial Accounts Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Add your bank accounts, UPI apps, or cash wallets to track real balances accurately.</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            + Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Account Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingAccount ? 'Edit Financial Account' : 'Add Financial Account'}
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
                  Bank / Institution Name
                </label>
                <select
                  value={selectedBankPreset}
                  onChange={(e) => setSelectedBankPreset(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {selectedBankPreset === 'Other / Custom Bank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Custom Bank Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom bank or institution name"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Account Type
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Savings Account">Savings Account</option>
                  <option value="Pocket Money / Cash Stash">Pocket Money / Cash Stash</option>
                  <option value="Salary Account">Salary Account</option>
                  <option value="Current / Business Account">Current / Business Account</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Cash Wallet">Cash Wallet</option>
                  <option value="UPI (Google Pay / PhonePe / Paytm)">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Digital Wallet">Digital Wallet (Amazon / Paytm Wallet)</option>
                  <option value="Student / Allowance Account">Student / Allowance Account</option>
                  <option value="Fixed Deposit / Savings Jar">Fixed Deposit / Savings Jar</option>
                  <option value="Credit Card Account">Credit Card Account</option>
                  <option value="Investment / Wealth Account">Investment / Wealth Account</option>
                  <option value="Other Account">Other Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Last 4 Digits of Account (Optional)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={formData.last4}
                  onChange={(e) => setFormData({ ...formData, last4: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
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
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
