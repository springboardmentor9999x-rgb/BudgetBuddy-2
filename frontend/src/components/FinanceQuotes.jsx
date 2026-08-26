import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const FINANCE_QUOTES = [
  "“A budget is telling your money where to go instead of wondering where it went.” — John C. Maxwell",
  "“Small savings today create big possibilities tomorrow.”",
  "“Track your money. Control your future.”",
  "“Spend wisely. Save consistently. Grow confidently.”",
  "“Every rupee has a purpose.”",
  "“Every financial journey starts with the first step.”",
  "“Beware of little expenses. A small leak will sink a great ship.” — Benjamin Franklin",
  "“Financial freedom is available to those who learn about it and work for it.”"
];

export default function FinanceQuotes() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Select random initial quote
    const initialIndex = Math.floor(Math.random() * FINANCE_QUOTES.length);
    setIndex(initialIndex);

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % FINANCE_QUOTES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-start space-x-3 text-slate-300 shadow-sm animate-fade-in">
      <Quote className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
      <p className="text-sm font-medium italic leading-relaxed text-slate-200">
        {FINANCE_QUOTES[index]}
      </p>
    </div>
  );
}
