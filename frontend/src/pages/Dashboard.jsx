import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import FinanceQuotes from '../components/FinanceQuotes';
import walletImg from '../assets/budgetbuddy-wallet.png';

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PlusCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ============================================================
  // FORMAT CURRENCY SAFELY
  // ============================================================

  const formatCurrency = (value) => {
    const amount = Number(value ?? 0);

    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value) => {
    const amount = Number(value ?? 0);

    return amount.toLocaleString('en-IN');
  };

  // ============================================================
  // FETCH DASHBOARD
  // ============================================================

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get('/dashboard');

      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);

      setError(
        err?.response?.data?.detail ||
        'Unable to load your financial dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        </div>

        <h2 className="text-lg font-bold text-white">
          Preparing your dashboard
        </h2>

        <p className="text-slate-400 text-sm mt-1 text-center">
          Gathering your latest financial insights...
        </p>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="w-full max-w-lg bg-slate-900/80 border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>

          <h2 className="text-xl font-bold text-white">
            Dashboard unavailable
          </h2>

          <p className="text-sm text-slate-400 mt-2">
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // ============================================================
  // NORMALIZE DASHBOARD DATA
  // ============================================================

  const numberOfAccounts = Number(data?.number_of_accounts ?? 0);

  const availableBalance = Number(data?.available_balance ?? 0);
  const totalIncome = Number(data?.total_income ?? 0);
  const totalExpenses = Number(data?.total_expenses ?? 0);
  const totalInGoals = Number(data?.total_in_goals ?? 0);

  const accountBalances = Array.isArray(data?.account_balances)
    ? data.account_balances
    : [];

  const budgetSummary = Array.isArray(data?.budget_summary)
    ? data.budget_summary
    : [];

  const recentTransactions = Array.isArray(data?.recent_transactions)
    ? data.recent_transactions
    : [];

  // ============================================================
  // EMPTY ACCOUNT STATE
  // ============================================================

  if (numberOfAccounts === 0) {
    return (
      <div className="space-y-8 animate-fade-in">

        {/* Welcome Card */}
        <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-3xl p-7 sm:p-10 lg:p-12 text-center max-w-4xl mx-auto shadow-2xl">

          {/* Decorative Background */}
          <div className="absolute -right-24 -top-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="relative inline-flex p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6">
            <Wallet className="w-12 h-12" />
          </div>

          <h1 className="relative text-2xl sm:text-3xl lg:text-4xl font-black text-white">
            Welcome to BudgetBuddy! 👋
          </h1>

          <p className="relative text-slate-300 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Your financial journey starts here. Add your first bank, UPI,
            wallet, or cash account to begin tracking your money.
          </p>

          {/* Welcome Image */}
          <div className="relative my-8 flex justify-center">
            <img
              src={walletImg}
              alt="BudgetBuddy wallet illustration"
              className="w-full max-w-sm rounded-2xl border border-slate-800 shadow-xl object-cover"
            />
          </div>

          {/* Finance Quote */}
          <div className="relative max-w-md mx-auto mb-8">
            <FinanceQuotes />
          </div>

          {/* CTA */}
          <Link
            to="/accounts"
            className="relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Your First Account</span>
          </Link>

        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  return (
    <div className="space-y-7 sm:space-y-8 animate-fade-in">

      {/* ========================================================
          DASHBOARD HEADER
      ======================================================== */}

      <section className="relative overflow-hidden bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">

        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-blue-400" />

              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Overview
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Financial Dashboard
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Monitor your accounts, cash flow, goals, and budgets in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              title="Refresh dashboard"
              className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
            </button>

            {/* Add Income */}
            <Link
              to="/income"
              className="inline-flex items-center gap-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Add Income</span>
            </Link>

            {/* Add Expense */}
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1.5 bg-red-600/15 hover:bg-red-600/25 text-red-300 border border-red-500/30 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-all"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Add Expense</span>
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================================
          REFRESH ERROR
      ======================================================== */}

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />

          <p className="text-xs text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* ========================================================
          SUMMARY CARDS
      ======================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">

        {/* Available Balance */}
        <div className="group bg-slate-900/70 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-5 shadow-xl transition-all">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Balance
            </span>

            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>

          </div>

          <div className="mt-5">
            <p className="text-2xl sm:text-3xl font-black text-white break-words">
              ₹{formatCurrency(availableBalance)}
            </p>

            <p className="text-xs text-slate-400 mt-1.5">
              Across {numberOfAccounts} account
              {numberOfAccounts !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Income */}
        <div className="group bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 shadow-xl transition-all">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Income
            </span>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>

          </div>

          <div className="mt-5">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 break-words">
              + ₹{formatCurrency(totalIncome)}
            </p>

            <p className="text-xs text-slate-400 mt-1.5">
              All recorded income
            </p>
          </div>
        </div>

        {/* Expenses */}
        <div className="group bg-slate-900/70 border border-slate-800 hover:border-red-500/30 rounded-2xl p-5 shadow-xl transition-all">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>

            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>

          </div>

          <div className="mt-5">
            <p className="text-2xl sm:text-3xl font-black text-red-400 break-words">
              - ₹{formatCurrency(totalExpenses)}
            </p>

            <p className="text-xs text-slate-400 mt-1.5">
              All recorded expenses
            </p>
          </div>
        </div>

        {/* Savings */}
        <div className="group bg-slate-900/70 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-5 shadow-xl transition-all">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Savings Goals
            </span>

            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
              <PiggyBank className="w-5 h-5" />
            </div>

          </div>

          <div className="mt-5">
            <p className="text-2xl sm:text-3xl font-black text-indigo-400 break-words">
              ₹{formatCurrency(totalInGoals)}
            </p>

            <p className="text-xs text-slate-400 mt-1.5">
              Saved towards goals
            </p>
          </div>
        </div>

      </section>

      {/* ========================================================
          ACCOUNTS
      ======================================================== */}

      <section className="space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

          <div>
            <h2 className="font-bold text-white text-xl">
              Financial Accounts
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Your connected bank, wallet, UPI, and cash accounts
            </p>
          </div>

          <Link
            to="/accounts"
            className="self-start sm:self-auto text-blue-400 hover:text-blue-300 font-semibold text-xs inline-flex items-center gap-1"
          >
            <span>Manage Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

        </div>

        {accountBalances.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">

            {accountBalances.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
              />
            ))}

          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
            <CreditCard className="w-8 h-8 text-slate-500 mx-auto mb-2" />

            <p className="text-sm font-semibold text-slate-300">
              No account details available
            </p>

            <Link
              to="/accounts"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Manage Accounts
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      </section>

      {/* ========================================================
          GOALS + BUDGETS
      ======================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Savings Goals */}
        <div className="xl:col-span-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">

          <div className="flex items-center justify-between">

            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              Savings Goals
            </h2>

            <Link
              to="/goals"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </Link>

          </div>

          <p className="text-slate-400 text-xs leading-relaxed mt-4">
            Set targets and track progress for travel, electronics,
            emergency funds, education, and other financial goals.
          </p>

          <div className="mt-5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />

              <span className="text-xs font-semibold text-emerald-300">
                Keep building your financial future
              </span>
            </div>
          </div>

          <Link
            to="/goals"
            className="mt-5 block w-full text-center bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-semibold py-2.5 rounded-xl text-xs transition-all"
          >
            + Create / Contribute Goal
          </Link>

        </div>

        {/* Budgets */}
        <div className="xl:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

            <div>
              <h2 className="font-bold text-white text-lg">
                Active Budgets
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Monitor spending and catch overspending early
              </p>
            </div>

            <Link
              to="/budgets"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All Budgets
            </Link>

          </div>

          {budgetSummary.length === 0 ? (
            <div className="py-8 text-center">

              <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-3" />

              <p className="text-sm text-slate-400">
                No budgets created for this month.
              </p>

              <Link
                to="/budgets"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Create a Budget
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

              {budgetSummary.map((budget) => {

                const utilization = Math.max(
                  0,
                  Number(budget.utilization_percentage ?? 0)
                );

                const progressWidth = Math.min(
                  utilization,
                  100
                );

                const isExceeded = Boolean(
                  budget.is_exceeded
                );

                const progressClass = isExceeded
                  ? 'bg-red-500'
                  : utilization >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500';

                return (
                  <div
                    key={budget.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all"
                  >

                    <div className="flex justify-between items-start gap-3">

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {budget.category || 'General'}
                        </p>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Monthly budget
                        </p>
                      </div>

                      {isExceeded && (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}

                    </div>

                    <div className="flex justify-between items-center mt-4 gap-2">

                      <span className="text-xs text-slate-400">
                        ₹{formatNumber(budget.spent_amount)}
                      </span>

                      <span className="text-xs text-slate-500">
                        of ₹{formatNumber(budget.monthly_limit)}
                      </span>

                    </div>

                    <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden mt-2">

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressClass}`}
                        style={{
                          width: `${progressWidth}%`,
                        }}
                      />

                    </div>

                    <div className="flex justify-between items-center mt-2">

                      <span className="text-[11px] text-slate-500">
                        {utilization.toFixed(0)}% utilized
                      </span>

                      {isExceeded ? (
                        <span className="text-[11px] text-red-400 font-bold">
                          Exceeded
                        </span>
                      ) : utilization >= 80 ? (
                        <span className="text-[11px] text-amber-400 font-bold">
                          Near limit
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          On track
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </section>

      {/* ========================================================
          RECENT TRANSACTIONS
      ======================================================== */}

      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">

          <div>
            <h2 className="font-bold text-white text-lg">
              Recent Transactions
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Your latest financial activity
            </p>
          </div>

          <span className="text-[11px] text-slate-500">
            Latest 10 records
          </span>

        </div>

        {recentTransactions.length > 0 ? (
          <TransactionList
            transactions={recentTransactions}
          />
        ) : (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">

            <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-3" />

            <p className="text-sm font-semibold text-slate-400">
              No recent transactions
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Add income or expenses to start tracking your activity.
            </p>

            <div className="flex justify-center gap-2 mt-4">

              <Link
                to="/income"
                className="px-3 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/20"
              >
                Add Income
              </Link>

              <Link
                to="/expenses"
                className="px-3 py-2 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-600/20"
              >
                Add Expense
              </Link>

            </div>

          </div>
        )}

      </section>

    </div>
  );
}

