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
} from 'recharts';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#a855f7',
  '#64748b',
];

// ============================================================
// 1. IncomeBarChart — Monthly Income Distribution
// ============================================================

export function IncomeBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        Not enough income data available to display this chart.
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ccc"
            opacity={0.6}
          />

          <XAxis
            dataKey="month"
            stroke="#000"
            tick={{ fill: '#000', fontSize: 12 }}
            tickFormatter={formatMonthLabel}
          />

          <YAxis
            stroke="#000"
            tickFormatter={(v) =>
              `₹${(Number(v) / 1000).toFixed(0)}k`
            }
            tick={{ fill: '#000', fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#ccc',
              borderRadius: '8px',
              color: '#000',
            }}
            itemStyle={{ color: '#000' }}
            formatter={(value) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              'Income',
            ]}
            labelFormatter={formatMonthLabel}
          />

          <Legend
            wrapperStyle={{
              color: '#000',
              paddingTop: '10px',
            }}
          />

          <Bar
            dataKey="income"
            name="Monthly Income"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 2. ExpenseLineChart — Monthly Expense Trend
// ============================================================

export function ExpenseLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        Not enough data available to display this chart.
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ccc"
            opacity={0.6}
          />

          <XAxis
            dataKey="month"
            stroke="#000"
            tick={{ fill: '#000', fontSize: 12 }}
            tickFormatter={formatMonthLabel}
          />

          <YAxis
            stroke="#000"
            tickFormatter={(v) =>
              `₹${(Number(v) / 1000).toFixed(0)}k`
            }
            tick={{ fill: '#000', fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#ccc',
              borderRadius: '8px',
              color: '#000',
            }}
            itemStyle={{ color: '#000' }}
            formatter={(value) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              'Total Expenses',
            ]}
            labelFormatter={formatMonthLabel}
          />

          <Legend
            wrapperStyle={{
              color: '#000',
              paddingTop: '10px',
            }}
          />

          <Line
            type="monotone"
            dataKey="expenses"
            name="Total Expenses"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 3. CategoryPieChart — Expense Category Distribution
// ============================================================

export function CategoryPieChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        Not enough data available to display this chart.
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white">
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
            label={({ category, percentage }) =>
              `${category} (${percentage || 0}%)`
            }
            labelStyle={{
              fill: '#000',
              fontSize: '12px',
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#ccc',
              borderRadius: '8px',
              color: '#000',
            }}
            itemStyle={{ color: '#000' }}
            formatter={(value) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              'Spent',
            ]}
          />

          <Legend
            wrapperStyle={{
              color: '#000',
              paddingTop: '10px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 4. BudgetUsagePieChart — Budget Usage Distribution
// ============================================================

export function BudgetUsagePieChart({ data = [], budgetStatus = [] }) {
  /*
    Supports both:
      <BudgetUsagePieChart data={...} />
    and
      <BudgetUsagePieChart budgetStatus={...} />
  */

  const sourceData =
    Array.isArray(data) && data.length > 0
      ? data
      : Array.isArray(budgetStatus)
        ? budgetStatus
        : [];

  if (sourceData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        Not enough data available to display this chart.
      </div>
    );
  }

  /*
    If the dashboard already provides prepared
    spent/remaining values, use them directly.

    Otherwise calculate them from monthly_limit
    and spent_amount.
  */

  const hasPreparedData = sourceData.some(
    (item) =>
      item.spent !== undefined ||
      item.remaining !== undefined
  );

  let totalLimit = 0;
  let totalSpent = 0;

  if (hasPreparedData) {
    totalSpent = sourceData.reduce(
      (acc, item) =>
        acc + Number(item.spent ?? 0),
      0
    );

    const totalRemaining = sourceData.reduce(
      (acc, item) =>
        acc + Number(item.remaining ?? 0),
      0
    );

    totalLimit =
      totalSpent + totalRemaining;
  } else {
    totalLimit = sourceData.reduce(
      (acc, item) =>
        acc +
        Number(
          item.monthly_limit ??
          item.limit ??
          0
        ),
      0
    );

    totalSpent = sourceData.reduce(
      (acc, item) =>
        acc +
        Number(
          item.spent_amount ??
          item.spent ??
          item.amount_spent ??
          0
        ),
      0
    );
  }

  if (totalLimit <= 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        Not enough budget data available to display this chart.
      </div>
    );
  }

  const remaining = Math.max(
    0,
    totalLimit - totalSpent
  );

  const spentPct =
    (totalSpent / totalLimit) * 100;

  const remainPct =
    (remaining / totalLimit) * 100;

  const chartData = [
    {
      name: 'Used Budget',
      value: totalSpent,
      pct: Number(spentPct.toFixed(2)),
    },
    {
      name: 'Remaining Budget',
      value: remaining,
      pct: Number(remainPct.toFixed(2)),
    },
  ];

  return (
    <div className="w-full h-80 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            label={({ name, pct }) =>
              `${name} (${pct}%)`
            }
            labelStyle={{
              fill: '#000',
              fontSize: '12px',
            }}
          >
            <Cell fill="#ef4444" />
            <Cell fill="#10b981" />
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#ccc',
              borderRadius: '8px',
              color: '#000',
            }}
            itemStyle={{ color: '#000' }}
            formatter={(value) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              'Amount',
            ]}
          />

          <Legend
            wrapperStyle={{
              color: '#000',
              paddingTop: '10px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 5. CategoryTrendChart — Category Spending Over Time
// ============================================================

export function CategoryTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        Not enough category spending data available to display this chart.
      </div>
    );
  }

  const categories = [
    ...new Set(
      data
        .map((item) => item.category)
        .filter(Boolean)
    ),
  ];

  const monthMap = {};

  data.forEach((item) => {
    if (!item.month) return;

    if (!monthMap[item.month]) {
      monthMap[item.month] = {
        month: item.month,
      };
    }

    const category =
      item.category || 'Other';

    monthMap[item.month][category] =
      Number(item.amount || 0);
  });

  const chartData = Object.values(monthMap)
    .sort((a, b) =>
      String(a.month).localeCompare(
        String(b.month)
      )
    )
    .map((item) => ({
      ...item,
      month: formatMonthLabel(item.month),
    }));

  return (
    <div className="w-full h-96 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ccc"
            opacity={0.6}
          />

          <XAxis
            dataKey="month"
            stroke="#000"
            tick={{
              fill: '#000',
              fontSize: 12,
            }}
          />

          <YAxis
            stroke="#000"
            tick={{
              fill: '#000',
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              `₹${(
                Number(value) / 1000
              ).toFixed(0)}k`
            }
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#ccc',
              borderRadius: '8px',
              color: '#000',
            }}
            itemStyle={{
              color: '#000',
            }}
            formatter={(value, name) => [
              `₹${Number(value).toLocaleString(
                'en-IN'
              )}`,
              name,
            ]}
          />

          <Legend
            wrapperStyle={{
              color: '#000',
              paddingTop: '10px',
            }}
          />

          {categories.map(
            (category, index) => (
              <Bar
                key={category}
                dataKey={category}
                name={category}
                stackId="categories"
                fill={
                  COLORS[
                    index % COLORS.length
                  ]
                }
              />
            )
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 6. SavingsTrendChart — Savings Contribution Trend
// ============================================================

export function SavingsTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-black text-sm">
        No savings contribution data available to display this chart.
      </div>
    );
  }

  const chartData = data
    .map((item) => ({
      month:
        item.month ??
        item.month_key ??
        'Unknown',

      contribution: Number(
        item.contribution ?? 0
      ),

      cumulative_contribution: Number(
        item.cumulative_contribution ?? 0
      ),
    }))
    .sort((a, b) =>
      String(a.month).localeCompare(
        String(b.month)
      )
    )
    .map((item) => ({
      ...item,
      month: formatMonthLabel(item.month),
    }));

  return (
    <div className="w-full h-96 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ccc"
            opacity={0.6}
          />

          <XAxis
            dataKey="month"
            stroke="#000"
            tick={{
              fill: '#000',
              fontSize: 12,
            }}
          />

          <YAxis
            stroke="#000"
            tick={{
              fill: '#000',
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              `₹${(
                Number(value) / 1000
              ).toFixed(0)}k`
            }
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#ccc',
              borderRadius: '8px',
              color: '#000',
            }}
            itemStyle={{
              color: '#000',
            }}
            labelStyle={{
              color: '#000',
            }}
            labelFormatter={(label) =>
              label
            }
            formatter={(value, name) => [
              `₹${Number(value).toLocaleString(
                'en-IN'
              )}`,
              name === 'contribution'
                ? 'Monthly Contribution'
                : 'Cumulative Savings',
            ]}
          />

          <Legend
            wrapperStyle={{
              color: '#000',
              paddingTop: '10px',
            }}
          />

          <Line
            type="monotone"
            dataKey="contribution"
            name="Monthly Contribution"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="cumulative_contribution"
            name="Cumulative Savings"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// Helper — Format YYYY-MM as "Sep 2026"
// ============================================================

function formatMonthLabel(monthKey) {
  if (!monthKey || !String(monthKey).includes('-')) {
    return monthKey;
  }

  const [year, month] =
    String(monthKey).split('-');

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      year: 'numeric',
    }
  );
}

