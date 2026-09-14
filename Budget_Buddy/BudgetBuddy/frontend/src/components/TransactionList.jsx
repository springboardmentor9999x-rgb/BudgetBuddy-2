import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, Edit2, Trash2 } from 'lucide-react';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
        <p className="text-slate-400 text-sm font-medium">No recent transactions recorded yet.</p>
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const isGoal = tx.type === 'goal_contribution';
        const isExpense = tx.type === 'expense';

        let bgColor = '';
        let textColor = '';
        let Icon = ArrowDownLeft;
        let sign = '-';

        if (isIncome) {
          bgColor = 'bg-emerald-500/10 border-emerald-500/20';
          textColor = 'text-emerald-400';
          Icon = ArrowUpRight;
          sign = '+';
        } else if (isGoal) {
          bgColor = 'bg-indigo-500/10 border-indigo-500/20';
          textColor = 'text-indigo-400';
          Icon = ArrowUpRight; // or another icon
          sign = '-';
        } else {
          bgColor = 'bg-red-500/10 border-red-500/20';
          textColor = 'text-red-400';
          Icon = ArrowDownLeft;
          sign = '-';
        }

        return (
          <div
            key={tx.id}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800/80 transition-colors group"
          >
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${bgColor} ${textColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <h4 className="font-semibold text-slate-100 text-sm sm:text-base">
                  {tx.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {tx.category}
                  </span>
                  {tx.account_name && (
                    <span>• {tx.account_name}</span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(tx.date)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span
                  className={`text-base sm:text-lg font-bold ${textColor}`}
                >
                  {sign} ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {(onEdit || onDelete) && (
                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
