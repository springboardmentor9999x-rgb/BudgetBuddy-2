import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import FinanceQuotes from '../components/FinanceQuotes';
import walletImg from '../assets/budgetbuddy-wallet.png';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  PiggyBank, 
  PlusCircle, 
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Gathering your financial insights...</p>
      </div>
    );
  }

  // EMPTY STATE check: No accounts registered
  if (!data || data.number_of_accounts === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>

          <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6">
            <Wallet className="w-12 h-12" />
          </div>

          <h2 className="text-3xl font-extrabold text-white">Welcome to BudgetBuddy! 👋</h2>
          <p className="text-slate-300 text-base mt-2 max-w-lg mx-auto">
            Start by adding your first bank, UPI, or cash account and take complete control of your finances.
          </p>

          <div className="my-8 flex justify-center">
            <img
              src={walletImg}
              alt="Welcome to BudgetBuddy"
              className="w-full max-w-xs rounded-2xl border border-slate-800 shadow-xl object-cover"
            />
          </div>

          <div className="max-w-md mx-auto mb-8">
            <FinanceQuotes />
          </div>

          <Link
            to="/accounts"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 transition-transform hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Add Your First Account</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Financial Dashboard</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Real-time overview of your accounts, cash flows, and budgets</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/income"
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>+ Add Income</span>
          </Link>
          <Link
            to="/expenses"
            className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
          >
            <TrendingDown className="w-4 h-4" />
            <span>+ Add Expense</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Available Balance */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Available Balance</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white">
              ₹{data.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Across {data.number_of_accounts} accounts</p>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              + ₹{data.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">All recorded income</p>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-red-400">
              - ₹{data.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">All normal expenses</p>
          </div>
        </div>

        {/* Card 4: Total in Goals */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total in Goals</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">
              ₹{data.total_in_goals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Saved towards goals</p>
          </div>
        </div>

      </div>



      {/* Bank Accounts Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-xl">Financial Accounts</h3>
          <Link to="/accounts" className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center space-x-1">
            <span>Manage Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.account_balances.map((acc) => (
            <AccountCard key={acc.id} account={acc} />
          ))}
        </div>
      </div>

      {/* Savings Goals & Budget Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Savings Goals Card */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center space-x-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              <span>Savings Goals</span>
            </h3>
            <Link to="/goals" className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <p className="text-slate-400 text-xs">
            Track your savings progress, set targets for electronics, travel, or emergency funds.
          </p>

          <Link
            to="/goals"
            className="block w-full text-center bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            + Create / Contribute Goal
          </Link>
        </div>

        {/* Budget Utilization Status */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">Active Budgets & Overspending Alerts</h3>
            <Link to="/budgets" className="text-xs text-blue-400 hover:underline font-semibold">View All Budgets</Link>
          </div>

          {data.budget_summary.length === 0 ? (
            <p className="text-slate-400 text-xs py-4 text-center">No budgets created for this month.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.budget_summary.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-200">{b.category}</span>
                    <span className={b.is_exceeded ? 'text-red-400' : 'text-slate-300'}>
                      ₹{b.spent_amount.toLocaleString('en-IN')} / ₹{b.monthly_limit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        b.is_exceeded ? 'bg-red-500' : b.utilization_percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(b.utilization_percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{b.utilization_percentage}% utilized</span>
                    {b.is_exceeded && (
                      <span className="text-red-400 font-bold flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Exceeded</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Transactions List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Recent Transactions</h3>
          <span className="text-xs text-slate-400">Latest 10 records</span>
        </div>

        <TransactionList transactions={data.recent_transactions} />
      </div>

    </div>
  );
}
