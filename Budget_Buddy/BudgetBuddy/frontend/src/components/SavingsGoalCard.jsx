import React, { useState } from 'react';
import GoalProgressBar from './GoalProgressBar';
import { 
  ShieldCheck, 
  Plane, 
  GraduationCap, 
  Laptop, 
  Car, 
  PiggyBank, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';

export default function SavingsGoalCard({ goal, onContribute, onEdit, onDelete }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.status === 'completed' || goal.current_amount >= goal.target_amount;

  const getGoalIcon = (type) => {
    switch (type) {
      case 'emergency_fund': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'travel': return <Plane className="w-5 h-5 text-sky-400" />;
      case 'education': return <GraduationCap className="w-5 h-5 text-purple-400" />;
      case 'electronics': return <Laptop className="w-5 h-5 text-blue-400" />;
      case 'vehicle': return <Car className="w-5 h-5 text-amber-400" />;
      default: return <PiggyBank className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getGoalTypeLabel = (type) => {
    switch (type) {
      case 'emergency_fund': return 'Emergency Fund';
      case 'travel': return 'Travel';
      case 'education': return 'Education';
      case 'electronics': return 'Electronics';
      case 'vehicle': return 'Vehicle';
      default: return 'Other';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const formatted = new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace('am', 'AM').replace('pm', 'PM');
    return `${formatted} IST`;
  };

  return (
    <div className="glass-card p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col space-y-4 relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-md">
            {getGoalIcon(goal.goal_type)}
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">
              {goal.title}
            </h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/50">
                {getGoalTypeLabel(goal.goal_type)}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {isCompleted ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button onClick={() => onEdit(goal)} title="Edit Goal" className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(goal.id)} title="Delete Goal" className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Saved</span>
          <span className="text-sm font-extrabold text-emerald-400">₹{goal.current_amount.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Target</span>
          <span className="text-sm font-extrabold text-white">₹{goal.target_amount.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Needed</span>
          <span className="text-sm font-extrabold text-blue-400">₹{remaining.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <GoalProgressBar percentage={goal.progress_percentage} status={goal.status} />

      {goal.last_contribution_amount != null && (
        <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800/60 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 font-semibold">Last Contribution:</span>
            <span className="text-emerald-400 font-bold">₹{goal.last_contribution_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 font-semibold">Added from:</span>
            <span className="text-slate-300 font-medium">{goal.contributions?.[0]?.account_name || 'Account'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-semibold">Date & Time:</span>
            <span className="text-slate-300 font-medium">{formatDate(goal.last_contribution_date)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
            </div>
            {goal.contributions?.length > 0 && (
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                className="flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-semibold"
              >
                <History className="w-3 h-3" />
                <span>{isHistoryOpen ? 'Hide History' : 'View History'}</span>
                {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {!isCompleted ? (
            <button onClick={() => onContribute(goal)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-transform active:scale-95 shrink-0">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Contribute</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Achieved</span>
            </div>
          )}
        </div>

        {isHistoryOpen && goal.contributions?.length > 0 && (
          <div className="mt-4 animate-fade-in border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase font-bold border-b border-slate-700/60">
                  <tr>
                    <th className="px-2 py-2 w-32">Date & Time</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2">Bank Account</th>
                    <th className="px-2 py-2 text-right">Previous Amount</th>
                    <th className="px-2 py-2 text-right">New Amount</th>
                    <th className="px-2 py-2 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {goal.contributions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="px-2 py-2 whitespace-nowrap">{formatDate(c.created_at)}</td>
                      <td className="px-2 py-2 text-right font-bold text-emerald-400 whitespace-nowrap">₹{c.amount.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{c.account_name || '-'}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">₹{c.previous_amount.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">₹{c.new_amount.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right font-semibold whitespace-nowrap">{c.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
