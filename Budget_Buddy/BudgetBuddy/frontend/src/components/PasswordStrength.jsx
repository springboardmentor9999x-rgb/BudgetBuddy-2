import React from 'react';
import { Check, X } from 'lucide-react';

export function checkPasswordStrength(password) {
  if (!password) return { level: 'None', score: 0, criteria: [] };

  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  let level = 'Weak';
  let color = 'text-red-400';
  let barColor = 'bg-red-500';

  if (metCount >= 5) {
    level = 'Strong';
    color = 'text-emerald-400';
    barColor = 'bg-emerald-500';
  } else if (metCount >= 3) {
    level = 'Medium';
    color = 'text-amber-400';
    barColor = 'bg-amber-500';
  }

  return { level, score: metCount, criteria, color, barColor };
}

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const { level, score, criteria, color, barColor } = checkPasswordStrength(password);

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center justify-between font-semibold">
        <span className="text-slate-400">Password Strength:</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>
          {level === 'Weak' && '🔴 Weak'}
          {level === 'Medium' && '🟠 Medium'}
          {level === 'Strong' && '🟢 Strong'}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step <= score ? barColor : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
        {criteria.map((item, index) => (
          <div key={index} className="flex items-center space-x-1.5">
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={item.met ? 'text-slate-300' : 'text-slate-500'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
