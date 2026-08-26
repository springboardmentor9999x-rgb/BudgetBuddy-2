import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import SavingsGoalCard from '../components/SavingsGoalCard';
import SavingsGoalForm from '../components/SavingsGoalForm';
import ContributionModal from '../components/ContributionModal';
import { Target, PlusCircle, Filter, RefreshCw, CheckCircle2, Clock, PiggyBank } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Goals() {
  const { showToast } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState('all'); // all, 1m, 2m, 3m, 6m, 12m
  const [statusFilter, setStatusFilter] = useState('');
  const [goalTypeFilter, setGoalTypeFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      let params = {};
      if (statusFilter) params.status = statusFilter;
      if (goalTypeFilter) params.goal_type = goalTypeFilter;

      const res = await api.get('/goals', { params });
      let data = res.data;

      // Apply Period Filter on Target Date
      if (period !== 'all') {
        const monthsCount = parseInt(period);
        if (!isNaN(monthsCount)) {
          const now = new Date();
          const maxDate = new Date();
          maxDate.setMonth(now.getMonth() + monthsCount);

          data = data.filter((g) => {
            const tDate = new Date(g.target_date);
            return tDate <= maxDate;
          });
        }
      }

      setGoals(data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [period, statusFilter, goalTypeFilter]);

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.delete(`/goals/${goalId}`);
      showToast('info', 'Savings goal deleted.');
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const completedCount = goals.filter((g) => g.status === 'completed' || g.current_amount >= g.target_amount).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Savings Goals</h1>
              <p className="text-slate-400 text-xs sm:text-sm">Set targets, contribute funds, and achieve your financial milestones</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateGoal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-xl shadow-blue-500/25 transition-transform hover:scale-105 shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Create New Goal</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Saved Across Goals</span>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">
              ₹{totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Target: ₹{totalTarget.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Goals</span>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-2xl font-black text-blue-400">
              {goals.length - completedCount}
            </div>
            <Clock className="w-6 h-6 text-blue-500/40" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Goals</span>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-2xl font-black text-purple-400">
              {completedCount}
            </div>
            <CheckCircle2 className="w-6 h-6 text-purple-500/40" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        {/* Period Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center shrink-0">
            <Filter className="w-3.5 h-3.5 mr-1" /> Target:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: '1', label: '1 Month' },
            { id: '2', label: '2 Months' },
            { id: '3', label: '3 Months' },
            { id: '6', label: '6 Months' },
            { id: '12', label: '12 Months' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                period === p.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Status & Type Selectors */}
        <div className="flex items-center space-x-3 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={goalTypeFilter}
            onChange={(e) => setGoalTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="">All Goal Types</option>
            <option value="emergency_fund">Emergency Fund</option>
            <option value="travel">Travel</option>
            <option value="education">Education</option>
            <option value="electronics">Electronics</option>
            <option value="vehicle">Vehicle</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={fetchGoals}
            title="Refresh Goals"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Cards Grid / Empty State */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading your savings goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <PiggyBank className="w-16 h-16 text-slate-600 mx-auto opacity-40" />
          <h3 className="text-xl font-bold text-white">No savings goals found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            You don't have any savings goals matching the selected period and filters. Create your first savings goal today!
          </p>
          <button
            onClick={handleCreateGoal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-xs inline-flex items-center space-x-2 shadow-lg shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => (
            <SavingsGoalCard
              key={g.id}
              goal={g}
              onContribute={(goal) => setContributingGoal(goal)}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <SavingsGoalForm
          goal={editingGoal}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchGoals}
        />
      )}

      {/* Contribute Modal */}
      {contributingGoal && (
        <ContributionModal
          goal={contributingGoal}
          onClose={() => setContributingGoal(null)}
          onSuccess={fetchGoals}
        />
      )}
    </div>
  );
}
