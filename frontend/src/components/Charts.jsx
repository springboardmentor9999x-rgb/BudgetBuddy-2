import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ComposedChart
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#a855f7', '#64748b'];

// 1. SpendingPieChart — Category-wise Expenses Pie Chart
export function SpendingPieChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
        No expense data available for pie chart.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={4}
            dataKey="amount"
            nameKey="category"
            label={({ category, percentage }) => `${category} (${percentage || 0}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. MonthlyTrendLineChart — Monthly Income, Expenses, and Net Line Chart
export function MonthlyTrendLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
        No trend data available for line chart.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis dataKey="month_label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff' }}
            formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="net" name="Net Flow" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. ExpenseHistogram — Expense Amount Distribution Histogram
export function ExpenseHistogram({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
        No expense distribution data available.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis dataKey="range" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff' }}
            formatter={(value, name) => [name === 'count' ? `${value} transaction(s)` : `₹${Number(value).toLocaleString('en-IN')}`, name === 'count' ? 'Count' : 'Total Amount']}
          />
          <Bar dataKey="count" name="Transaction Count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. SavingsDonutChart — Savings Goal Progress Donut Chart
export function SavingsDonutChart({ goals = [] }) {
  if (!goals || goals.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
        No savings goal data available.
      </div>
    );
  }

  const totalSaved = goals.reduce((acc, g) => acc + g.current, 0);
  const totalRemaining = goals.reduce((acc, g) => acc + g.remaining, 0);

  const donutData = [
    { name: 'Saved', value: totalSaved },
    { name: 'Remaining', value: totalRemaining },
  ];

  const DONUT_COLORS = ['#10b981', '#3b82f6'];

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={donutData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
          >
            {donutData.map((entry, index) => (
              <Cell key={`donut-${index}`} fill={DONUT_COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Backward Compatibility Alias Components
export function MonthlyTrendChart({ trends = [] }) {
  const mapped = trends.map(t => ({ month_label: t.month_label, income: t.income, expenses: t.expense, net: t.savings }));
  return <MonthlyTrendLineChart data={mapped} />;
}

export function CategoryExpenseChart({ categoryTotals = [] }) {
  return <SpendingPieChart data={categoryTotals} />;
}

export function IncomeSourceChart({ sources = [] }) {
  if (!sources || sources.length === 0) {
    return <div className="h-72 flex items-center justify-center text-slate-500 text-sm">No income source data.</div>;
  }
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sources} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <YAxis dataKey="source" type="category" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Income Amount']}
          />
          <Bar dataKey="amount" name="Income Amount" fill="#10b981" radius={[0, 8, 8, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccountFlowChart({ accountFlows = [] }) {
  if (!accountFlows || accountFlows.length === 0) {
    return <div className="h-72 flex items-center justify-center text-slate-500 text-sm">No account flow data.</div>;
  }
  const data = accountFlows.map(acc => ({
    name: acc.bank_name,
    Income: acc.total_income,
    Expense: acc.total_expense,
    Balance: acc.current_balance
  }));
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff' }}
            formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1', paddingTop: '10px' }} />
          <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Balance" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
