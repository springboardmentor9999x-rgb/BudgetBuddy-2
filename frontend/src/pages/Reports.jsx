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
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [txType, setTxType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];
  const years = [2024, 2025, 2026, 2027];

  const buildParams = () => {
    const params = new URLSearchParams({
      month: selectedMonth,
      year: selectedYear,
    });
    if (accountId) params.append('account_id', accountId);
    if (category) params.append('category', category);
    if (txType) params.append('tx_type', txType);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return params.toString();
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?${buildParams()}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch monthly report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear, accountId, category, txType, startDate, endDate]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/export/pdf?${buildParams()}`, { responseType: 'blob' });
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

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/export/excel?${buildParams()}`, { responseType: 'blob' });
      const monthLabel = months.find((m) => m.value === selectedMonth)?.label || 'Month';
      const filename = `BudgetBuddy_Report_${monthLabel}_${selectedYear}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Monthly financial report Excel downloaded! 📊');
    } catch (err) {
      console.error('Failed to download Excel report:', err);
      alert('Error generating Excel report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Financial Reports</h1>
              <p className="text-slate-400 text-xs sm:text-sm">Filter data and download your statement</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} disabled={downloading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50">
              <Download className="w-4 h-4" /> <span>PDF</span>
            </button>
            <button onClick={handleDownloadExcel} disabled={downloading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50">
              <Download className="w-4 h-4" /> <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent text-xs font-bold text-white focus:outline-none pr-2">
              {months.map(m => <option key={m.value} value={m.value} className="bg-slate-900 text-white">{m.label}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent text-xs font-bold text-white focus:outline-none pr-2">
              {years.map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
            </select>
          </div>
          
          <select value={txType} onChange={e => setTxType(e.target.value)} className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none">
            <option value="">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-400 focus:outline-none" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-400 focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading report data...</p>
        </div>
      ) : reportData ? (
        <div className="bg-white text-black p-6 sm:p-8 rounded-3xl shadow-xl space-y-8">
          
          <div className="text-center mb-8 border-b pb-4">
            <h2 className="text-3xl font-bold">Financial Report</h2>
            <p className="text-gray-600">{months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</p>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                <span>Total Income</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-black text-green-700">
                ₹{reportData.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                <span>Total Expenses</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-700">
                ₹{reportData.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                <span>Remaining Net Balance</span>
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <div className={`text-2xl font-black ${reportData.remaining_balance >= 0 ? 'text-black' : 'text-orange-600'}`}>
                ₹{reportData.remaining_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Detailed Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Category Expenses */}
            <div className="p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg flex items-center space-x-2 border-b pb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Category-Wise Expenses</span>
              </h3>

              {reportData.category_spending.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No expenses recorded for this month.</p>
              ) : (
                <div className="space-y-3">
                  {reportData.category_spending.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                      <span className="font-semibold text-gray-800">{c.category}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 block">₹{c.amount.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-gray-500">{c.percentage}% share</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Budget Status */}
            <div className="p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg flex items-center space-x-2 border-b pb-2">
                <Target className="w-5 h-5 text-teal-600" />
                <span>Category Budgets</span>
              </h3>

              {reportData.budget_status.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No budgets created for this month.</p>
              ) : (
                <div className="space-y-3">
                  {reportData.budget_status.map((b) => (
                    <div key={b.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1.5 text-sm">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-800">{b.category}</span>
                        <span className={b.is_exceeded ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          ₹{b.spent_amount.toLocaleString('en-IN')} / ₹{b.monthly_limit.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{b.utilization_percentage}% used</span>
                        {b.is_exceeded && (
                          <span className="text-red-600 font-bold flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
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

          {/* Goals & Notifications Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Savings Goals */}
            <div className="p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg flex items-center space-x-2 border-b pb-2">
                <Target className="w-5 h-5 text-green-600" />
                <span>Savings Goals Progress</span>
              </h3>

              {reportData.savings_goals.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No savings goals found.</p>
              ) : (
                <div className="space-y-3">
                  {reportData.savings_goals.map((g) => (
                    <div key={g.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-bold text-gray-800 block">{g.title}</span>
                        <span className="text-xs text-gray-500 capitalize">{g.goal_type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-700 block">
                          ₹{g.current.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500">{g.percentage}% ({g.status})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Alert Log */}
            <div className="p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg flex items-center space-x-2 border-b pb-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Monthly Alerts & Notifications</span>
              </h3>

              {reportData.notifications.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No alerts recorded for this month.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reportData.notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm space-y-1">
                      <p className="text-gray-800">{n.message}</p>
                      <span className="text-xs text-gray-500">{n.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Bank Statement Table */}
          <div className="p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center space-x-2 border-b pb-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Detailed Transaction Statement</span>
            </h3>

            {reportData.transactions?.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No transactions found for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3 border-b">Date</th>
                      <th className="p-3 border-b">Time</th>
                      <th className="p-3 border-b">Type</th>
                      <th className="p-3 border-b">Description</th>
                      <th className="p-3 border-b text-right">Debit</th>
                      <th className="p-3 border-b text-right">Credit</th>
                      <th className="p-3 border-b text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions?.map((t, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-gray-700 whitespace-nowrap">{t.date_str}</td>
                        <td className="p-3 text-gray-600 whitespace-nowrap">{t.time_str}</td>
                        <td className="p-3 font-semibold">
                          <span className={t.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700 max-w-xs truncate" title={t.description}>{t.description}</td>
                        <td className="p-3 text-red-600 font-medium text-right">
                          {t.debit}
                        </td>
                        <td className="p-3 text-green-600 font-medium text-right">
                          {t.credit}
                        </td>
                        <td className="p-3 text-blue-700 font-bold text-right">
                          ₹{t.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
