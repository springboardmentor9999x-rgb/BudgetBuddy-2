import React, { useState, useEffect } from 'react';
import api from '../api/axios';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setAnalyticsLoading(true);

      const [usersRes, statsRes, analyticsRes] = await Promise.all([
        api.get('/admin/users', {
          params: {
            role: filterRole || undefined,
            search: search || undefined,
          },
        }),

        api.get('/admin/stats'),

        api.get('/admin/analytics'),
      ]);

      setUsers(usersRes.data || []);
      setStats(statsRes.data || null);
      setSystemAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [filterRole, search]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
      });

      alert('User role updated successfully');

      await fetchAdminData();
    } catch (err) {
      console.error('Role update error:', err);
      alert('Failed to update role');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      alert('Please enter a notification message.');
      return;
    }

    try {
      await api.post('/admin/notifications', {
        message: message.trim(),
        target_role: 'all',
      });

      alert('Notification sent successfully');

      setMessage('');
    } catch (err) {
      console.error('Notification error:', err);
      alert('Failed to send notification');
    }
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /*
   * ============================================================
   * USER ROLE ANALYTICS
   * ============================================================
   */

  const userRoleData = [
    {
      name: 'Normal Users',
      value: Number(systemAnalytics?.users?.normal || 0),
    },
    {
      name: 'Premium Users',
      value: Number(systemAnalytics?.users?.premium || 0),
    },
    {
      name: 'Admins',
      value: Number(systemAnalytics?.users?.admin || 0),
    },
  ].filter((item) => item.value > 0);

  /*
   * ============================================================
   * CATEGORY SPENDING ANALYTICS
   * ============================================================
   */

  const categoryData =
    systemAnalytics?.spending_by_category?.map((item) => ({
      name: item.category || 'Other',
      value: Number(item.amount || 0),
      percentage: Number(item.percentage || 0),
    })) || [];

  /*
   * ============================================================
   * MONTHLY FINANCIAL TREND
   * ============================================================
   */

  const monthlyTrendData =
    systemAnalytics?.monthly_trend?.map((item) => ({
      month: item.month,
      income: Number(item.income || 0),
      expenses: Number(item.expenses || 0),
      net: Number(item.net || 0),
    })) || [];

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-300 font-semibold">
            Loading Admin Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div>
        <h1 className="text-3xl font-bold text-slate-100">
          Admin Dashboard
        </h1>

        <p className="text-slate-400 mt-1">
          Manage users and monitor system-wide financial activity.
        </p>
      </div>


      {/* ========================================================
          ADMIN STATISTICS
      ======================================================== */}

      {stats && (
        <section>
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            Administration Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Total Users */}

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Total Users
              </h3>

              <p className="text-3xl text-blue-400 font-bold">
                {stats.total_users || 0}
              </p>
            </div>


            {/* Normal Users */}

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Normal Users
              </h3>

              <p className="text-3xl text-slate-300 font-bold">
                {stats.normal_users || 0}
              </p>
            </div>


            {/* Premium Users */}

            <div className="bg-slate-900 p-5 rounded-xl border border-purple-500/20 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Premium Users
              </h3>

              <p className="text-3xl text-purple-400 font-bold">
                {stats.total_premium || 0}
              </p>
            </div>


            {/* Administrators */}

            <div className="bg-slate-900 p-5 rounded-xl border border-rose-500/20 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Administrators
              </h3>

              <p className="text-3xl text-rose-400 font-bold">
                {stats.total_admins || 0}
              </p>
            </div>


            {/* Active / Inactive */}

            <div className="bg-slate-900 p-5 rounded-xl border border-emerald-500/20 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Active / Inactive
              </h3>

              <p className="text-3xl text-emerald-400 font-bold">
                {stats.active_users || 0}

                <span className="text-red-400 text-xl">
                  {' '}
                  / {stats.inactive_users || 0}
                </span>
              </p>
            </div>

          </div>
        </section>
      )}


      {/* ========================================================
          SYSTEM ANALYTICS
      ======================================================== */}

      <section>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">

          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              System Analytics
            </h2>

            <p className="text-slate-400 mt-1">
              Aggregated financial insights across all users.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Refresh Analytics
          </button>

        </div>


        {/* ======================================================
            ANALYTICS LOADING
        ====================================================== */}

        {analyticsLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />

            Loading system analytics...
          </div>
        ) : systemAnalytics ? (

          <div className="space-y-6">


            {/* ==================================================
                USER ACCOUNTS ANALYTICS
            ================================================== */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-100">
                  User Accounts Analytics
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Distribution of Normal, Premium and Admin accounts.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Pie Chart */}

                <div className="w-full h-[320px]">

                  {userRoleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>

                        <Pie
                          data={userRoleData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={55}
                          paddingAngle={4}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {userRoleData.map((entry, index) => (
                            <Cell
                              key={`user-role-${index}`}
                              fill={
                                index === 0
                                  ? '#64748b'
                                  : index === 1
                                  ? '#a855f7'
                                  : '#f43f5e'
                              }
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => [
                            value,
                            'Accounts',
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />

                        <Legend
                          wrapperStyle={{
                            color: '#cbd5e1',
                          }}
                        />

                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      No user account data available.
                    </div>
                  )}

                </div>


                {/* Role Summary */}

                <div className="space-y-4">

                  <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
                    <p className="text-sm text-slate-400">
                      Total Accounts
                    </p>

                    <p className="text-3xl font-bold text-blue-400 mt-1">
                      {systemAnalytics.users?.total || 0}
                    </p>
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-400 uppercase">
                        Normal
                      </p>

                      <p className="text-2xl font-bold text-slate-300 mt-1">
                        {systemAnalytics.users?.normal || 0}
                      </p>
                    </div>


                    <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
                      <p className="text-xs text-purple-300 uppercase">
                        Premium
                      </p>

                      <p className="text-2xl font-bold text-purple-400 mt-1">
                        {systemAnalytics.users?.premium || 0}
                      </p>
                    </div>


                    <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-500/20">
                      <p className="text-xs text-rose-300 uppercase">
                        Admin
                      </p>

                      <p className="text-2xl font-bold text-rose-400 mt-1">
                        {systemAnalytics.users?.admin || 0}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
                FINANCIAL SUMMARY
            ================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Income */}

              <div className="bg-slate-900 p-6 rounded-xl border border-emerald-500/20 shadow">

                <p className="text-slate-400 text-sm">
                  Total System Income
                </p>

                <p className="text-3xl font-bold text-emerald-400 mt-2">
                  {formatCurrency(
                    systemAnalytics.financial_summary?.total_income
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Combined income across all users
                </p>

              </div>


              {/* Expenses */}

              <div className="bg-slate-900 p-6 rounded-xl border border-red-500/20 shadow">

                <p className="text-slate-400 text-sm">
                  Total System Expenses
                </p>

                <p className="text-3xl font-bold text-red-400 mt-2">
                  {formatCurrency(
                    systemAnalytics.financial_summary?.total_expenses
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Combined expenses across all users
                </p>

              </div>


              {/* Net Savings */}

              <div className="bg-slate-900 p-6 rounded-xl border border-indigo-500/20 shadow">

                <p className="text-slate-400 text-sm">
                  System Net Savings
                </p>

                <p className="text-3xl font-bold text-indigo-400 mt-2">
                  {formatCurrency(
                    systemAnalytics.financial_summary?.net_savings
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Income minus expenses
                </p>

              </div>

            </div>


            {/* ==================================================
                CATEGORY SPENDING PIE CHART
            ================================================== */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-100">
                  Spending by Category
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Interactive expense distribution across all users.
                </p>
              </div>


              {categoryData.length > 0 ? (

                <div className="w-full h-[380px]">

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>

                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={125}
                        innerRadius={55}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >

                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`category-${index}`}
                            fill={[
                              '#3b82f6',
                              '#8b5cf6',
                              '#10b981',
                              '#f59e0b',
                              '#ef4444',
                              '#ec4899',
                              '#06b6d4',
                              '#84cc16',
                            ][index % 8]}
                          />
                        ))}

                      </Pie>

                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value),
                          'Expense',
                        ]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          color: '#cbd5e1',
                        }}
                      />

                    </PieChart>
                  </ResponsiveContainer>

                </div>

              ) : (

                <div className="py-16 text-center text-slate-500">
                  No system spending data available.
                </div>

              )}

            </div>


            {/* ==================================================
                CATEGORY BREAKDOWN
            ================================================== */}

            {categoryData.length > 0 && (

              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-100">
                    Category Breakdown
                  </h3>

                  <p className="text-sm text-slate-400">
                    Detailed spending distribution by category.
                  </p>
                </div>

                <div className="space-y-4">

                  {categoryData.map((item, index) => (

                    <div key={`${item.name}-${index}`}>

                      <div className="flex justify-between mb-1">

                        <span className="text-sm text-slate-300">
                          {item.name}
                        </span>

                        <span className="text-sm text-slate-400">
                          {formatCurrency(item.value)} (
                          {item.percentage.toFixed(2)}
                          %)
                        </span>

                      </div>

                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            )}


            {/* ==================================================
                MONTHLY FINANCIAL LINE CHART
            ================================================== */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-100">
                  Monthly Financial Trend
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Interactive system-wide income, expenses and net savings.
                </p>
              </div>


              {monthlyTrendData.length > 0 ? (

                <div className="w-full h-[400px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <LineChart
                      data={monthlyTrendData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 10,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                      />

                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(value) =>
                          `₹${Number(value).toLocaleString('en-IN')}`
                        }
                      />

                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(value),
                          name === 'income'
                            ? 'Income'
                            : name === 'expenses'
                            ? 'Expenses'
                            : 'Net Savings',
                        ]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 7 }}
                        name="Income"
                      />

                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 7 }}
                        name="Expenses"
                      />

                      <Line
                        type="monotone"
                        dataKey="net"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 7 }}
                        name="Net Savings"
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              ) : (

                <div className="py-16 text-center text-slate-500">
                  No monthly system data available.
                </div>

              )}

            </div>


            {/* ==================================================
                SAVINGS GOALS SUMMARY
            ================================================== */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">

                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    System Savings Goals
                  </h3>

                  <p className="text-sm text-slate-400">
                    Combined progress across all user savings goals.
                  </p>
                </div>

                <div className="text-left sm:text-right">

                  <p className="text-xs text-slate-500 uppercase">
                    Goals
                  </p>

                  <p className="text-2xl font-bold text-blue-400">
                    {systemAnalytics.savings_goals?.count || 0}
                  </p>

                </div>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div>
                  <p className="text-sm text-slate-400">
                    Total Target
                  </p>

                  <p className="text-xl font-bold text-slate-100 mt-1">
                    {formatCurrency(
                      systemAnalytics.savings_goals?.total_target
                    )}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-slate-400">
                    Current Savings
                  </p>

                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(
                      systemAnalytics.savings_goals?.total_current
                    )}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-slate-400">
                    Overall Progress
                  </p>

                  <p className="text-xl font-bold text-purple-400 mt-1">
                    {Number(
                      systemAnalytics.savings_goals
                        ?.progress_percentage || 0
                    ).toFixed(2)}
                    %
                  </p>
                </div>

              </div>


              <div className="mt-5">

                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        Number(
                          systemAnalytics.savings_goals
                            ?.progress_percentage || 0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

        ) : (

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            System analytics could not be loaded.
          </div>

        )}

      </section>


      {/* ========================================================
          GLOBAL NOTIFICATION
      ======================================================== */}

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

        <h2 className="text-xl font-bold text-slate-100 mb-4">
          Send Global Notification
        </h2>

        <form
          onSubmit={handleSendNotification}
          className="flex flex-col md:flex-row gap-4"
        >

          <input
            type="text"
            className="flex-1 bg-slate-800 text-slate-100 rounded-lg p-3 border border-slate-700 focus:outline-none focus:border-blue-500"
            placeholder="Notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-lg text-white font-semibold transition"
          >
            Send
          </button>

        </form>

      </div>


      {/* ========================================================
          USER MANAGEMENT
      ======================================================== */}

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-100">
              User Management
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Manage user roles and inspect individual accounts.
            </p>
          </div>


          <div className="flex flex-col sm:flex-row gap-3">

            <select
              className="bg-slate-800 text-slate-100 rounded-lg p-2 border border-slate-700"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >

              <option value="">
                All Roles
              </option>

              <option value="user">
                User
              </option>

              <option value="premium">
                Premium
              </option>

              <option value="admin">
                Admin
              </option>

            </select>


            <input
              type="text"
              placeholder="Search users..."
              className="bg-slate-800 text-slate-100 rounded-lg p-2 border border-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>


        {/* ======================================================
            USER TABLE
        ====================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-300">

            <thead className="bg-slate-800 text-slate-100 uppercase text-xs">

              <tr>

                <th className="p-3 rounded-tl">
                  Name
                </th>

                <th className="p-3">
                  Email
                </th>

                <th className="p-3">
                  Role
                </th>

                <th className="p-3">
                  Joined
                </th>

                <th className="p-3 rounded-tr">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {users.map((u) => (

                <tr
                  key={u.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >

                  <td className="p-3 font-medium text-slate-100">
                    {u.full_name || 'N/A'}
                  </td>


                  <td className="p-3">
                    {u.email}
                  </td>


                  <td className="p-3">

                    <span
                      className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-red-900/50 text-red-400'
                          : u.role === 'premium'
                          ? 'bg-purple-900/50 text-purple-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>

                  </td>


                  <td className="p-3">
                    {u.created_at
                      ? new Date(
                          u.created_at
                        ).toLocaleDateString()
                      : 'N/A'}
                  </td>


                  <td className="p-3">

                    <div className="flex gap-2 items-center">

                      <select
                        className="bg-slate-700 rounded-lg text-xs p-2 text-slate-200"
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            e.target.value
                          )
                        }
                      >

                        <option value="user">
                          User
                        </option>

                        <option value="premium">
                          Premium
                        </option>

                        <option value="admin">
                          Admin
                        </option>

                      </select>


                      <a
                        href={`/admin/users/${u.id}/accounts`}
                        className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-white text-xs font-semibold whitespace-nowrap"
                      >
                        View Accounts
                      </a>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>


          {users.length === 0 && (
            <p className="text-center text-slate-400 p-6">
              No users found.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}