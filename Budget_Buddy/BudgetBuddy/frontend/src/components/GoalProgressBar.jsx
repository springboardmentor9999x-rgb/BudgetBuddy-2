import React from 'react';

export default function GoalProgressBar({ percentage, status }) {
  const safePct = Math.min(Math.max(percentage || 0, 0), 100);
  const isCompleted = status === 'completed' || safePct >= 100;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
          {isCompleted ? 'Goal Completed 🎉' : 'Progress'}
        </span>
        <span className={isCompleted ? 'text-emerald-400 font-extrabold' : 'text-blue-400 font-extrabold'}>
          {safePct.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30'
              : safePct >= 75
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20'
              : safePct >= 50
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
              : 'bg-gradient-to-r from-blue-600 to-blue-400'
          }`}
          style={{ width: `${safePct}%` }}
        />
      </div>
    </div>
  );
}
