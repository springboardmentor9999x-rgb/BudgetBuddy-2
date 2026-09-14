import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  SpendingPieChart, 
  MonthlyTrendLineChart, 
  ExpenseHistogram, 
  SavingsDonutChart 
} from '../components/Charts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Target, 
  PieChart,
  RefreshCw 
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [months, setMonths] = useState(12); // 1, 2, 3, 6, 12
  const [summary, setSummary] = useState(null);
  const [spendingCat, setSpendingCat] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [expenseDist, setExpenseDist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, trendRes, savRes, distRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get(`/analytics/spending-by-category?months=${months}`),
        api.get(`/analytics/monthly-trend?months=${months}`),
        api.get('/analytics/savings-progress'),
        api.get('/analytics/expense-distribution'),
      ]);

      setSummary(sumRes.data);
      setSpendingCat(catRes.data);
      setMonthlyTrend(trendRes.data);
      setSavingsGoals(savRes.data);
      setExpenseDist(distRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [months]);

  if (loading && !summary) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Generating your financial analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Analytics & Visualizations</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Deep-dive financial breakdown, spending patterns, and progress charts</p>
          </div>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-stretch sm:self-auto justify-center">
          {[
            { id: 1, label: '1 Month' },
            { id: 2, label: '2 Months' },
            { id: 3, label: '3 Months' },
            { id: 6, label: '6 Months' },
            { id: 12, label: '12 Months' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMonths(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                months === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Total Income</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ₹{summary.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">Lifetime total income recorded</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400">
              ₹{summary.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">Lifetime total expenses recorded</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Remaining Cash</span>
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">
              ₹{summary.remaining_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">Net available balance (Income - Expense)</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Savings Rate</span>
              <PiggyBank className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-400">
              {summary.savings_rate}%
            </div>
            <p className="text-[11px] text-slate-400">₹{summary.total_savings.toLocaleString('en-IN')} allocated in goals</p>
          </div>
        </div>
      )}

      {/* 4 Core Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Spending by Category (Pie Chart) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-lg">Spending by Category</h3>
            </div>
            <span className="text-xs text-slate-400">Category Share %</span>
          </div>
          <SpendingPieChart data={spendingCat} />
        </div>

        {/* Chart 2: Monthly Trend (Line Chart) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">Monthly Cash Flow Trend</h3>
            </div>
            <span className="text-xs text-slate-400">Last {months} Month(s)</span>
          </div>
          <MonthlyTrendLineChart data={monthlyTrend} />
        </div>

        {/* Chart 3: Expense Amount Distribution (Histogram) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-lg">Expense Amount Distribution</h3>
            </div>
            <span className="text-xs text-slate-400">Histogram Bins</span>
          </div>
          <ExpenseHistogram data={expenseDist} />
        </div>

        {/* Chart 4: Savings Goal Progress (Donut Chart) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-white text-lg">Savings Goal Progress</h3>
            </div>
            <span className="text-xs text-slate-400">Saved vs Target Remaining</span>
          </div>
          <SavingsDonutChart goals={savingsGoals} />
        </div>

      </div>
    </div>
  );
}
