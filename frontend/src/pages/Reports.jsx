import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Target, 
  Bell 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { showToast } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2024, 2025, 2026, 2027];

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch monthly report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/export/pdf?month=${selectedMonth}&year=${selectedYear}`, {
        responseType: 'blob',
      });

      const monthLabel = months.find((m) => m.value === selectedMonth)?.label || 'Month';
      const filename = `BudgetBuddy_Report_${monthLabel}_${selectedYear}.pdf`;

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Monthly financial report PDF downloaded! 📄');
    } catch (err) {
      console.error('Failed to download PDF report:', err);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Monthly Reports & PDF Export</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Select month and year to view financial summary and download PDF reports</p>
          </div>
        </div>

        {/* Month & Year Selectors + PDF Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none pr-2"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none pr-2"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-xl shadow-blue-500/25 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating PDF...' : 'Download Monthly Report PDF'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading report data...</p>
        </div>
      ) : reportData ? (
        <>
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                <span>Monthly Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                + ₹{reportData.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                <span>Monthly Expenses</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-black text-red-400">
                - ₹{reportData.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                <span>Remaining Net Balance</span>
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
              <div className={`text-2xl font-black ${reportData.remaining_balance >= 0 ? 'text-white' : 'text-amber-400'}`}>
                ₹{reportData.remaining_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Detailed Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Expenses */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Category-Wise Expenses</span>
              </h3>

              {reportData.category_spending.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No expenses recorded for this month.</p>
              ) : (
                <div className="space-y-3">
                  {reportData.category_spending.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                      <span className="font-semibold text-slate-200">{c.category}</span>
                      <div className="text-right">
                        <span className="font-bold text-red-400 block">₹{c.amount.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-400">{c.percentage}% share</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Budget Status */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-teal-400" />
                <span>Category Budgets & Overspending</span>
              </h3>

              {reportData.budget_status.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No budgets created for this month.</p>
              ) : (
                <div className="space-y-3">
                  {reportData.budget_status.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-200">{b.category}</span>
                        <span className={b.is_exceeded ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          ₹{b.spent_amount.toLocaleString('en-IN')} / ₹{b.monthly_limit.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{b.utilization_percentage}% used</span>
                        {b.is_exceeded && (
                          <span className="text-red-400 font-bold flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Budget Exceeded</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Goals & Notifications Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Savings Goals */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>Savings Goals Status</span>
              </h3>

              {reportData.savings_goals.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No savings goals found.</p>
              ) : (
                <div className="space-y-3">
                  {reportData.savings_goals.map((g) => (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{g.title}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{g.goal_type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 block">
                          ₹{g.current.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">{g.percentage}% ({g.status})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Alert Log */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span>Monthly Alert History</span>
              </h3>

              {reportData.notifications.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No alerts recorded for this month.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reportData.notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs space-y-1">
                      <p className="text-slate-200">{n.message}</p>
                      <span className="text-[10px] text-slate-500">{n.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
