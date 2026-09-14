import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

export default function AdminUserAccounts() {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          userRes,
          accountsRes,
          incomeRes,
          expensesRes,
          budgetsRes,
          goalsRes,
          notificationsRes,
        ] = await Promise.all([
          api.get(`/admin/users/${userId}`),
          api.get(`/admin/users/${userId}/accounts`),
          api.get(`/admin/users/${userId}/income`),
          api.get(`/admin/users/${userId}/expenses`),
          api.get(`/admin/users/${userId}/budgets`),
          api.get(`/admin/users/${userId}/savings-goals`),
          api.get(`/admin/users/${userId}/notifications`),
        ]);

        setUser(userRes.data);
        setAccounts(accountsRes.data || []);
        setIncome(incomeRes.data || []);
        setExpenses(expensesRes.data || []);
        setBudgets(budgetsRes.data || []);
        setSavingsGoals(goalsRes.data || []);
        setNotifications(notificationsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
        setError(
          err?.response?.data?.detail ||
            "Failed to load this user's information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }

    if (role === "premium") {
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    }

    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-slate-600 border-t-blue-400 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">
              Loading user's complete financial data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <Link
          to="/admin"
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          &larr; Back to Admin
        </Link>

        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-300">
            Unable to load user
          </h2>
          <p className="text-red-200/80 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
          >
            &larr; Back to Admin
          </Link>

          <h1 className="text-3xl font-bold mt-3">
            User Financial Details
          </h1>

          <p className="text-slate-400 mt-1">
            Complete financial information for the selected user.
          </p>
        </div>
      </div>

      {/* User Information */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wider">
              User
            </p>

            <h2 className="text-2xl font-bold text-white mt-1">
              {user?.full_name || "Unnamed User"}
            </h2>

            <p className="text-slate-400 mt-1">
              {user?.email || "No email available"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full border text-sm font-semibold capitalize ${getRoleBadge(
                user?.role
              )}`}
            >
              {user?.role || "user"}
            </span>

            <span
              className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                user?.is_active
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}
            >
              {user?.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Accounts</p>
          <p className="text-2xl font-bold mt-2">{accounts.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Income Records</p>
          <p className="text-2xl font-bold mt-2">{income.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Expense Records</p>
          <p className="text-2xl font-bold mt-2">{expenses.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Budgets</p>
          <p className="text-2xl font-bold mt-2">{budgets.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Savings Goals</p>
          <p className="text-2xl font-bold mt-2">{savingsGoals.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="text-2xl font-bold mt-2">{notifications.length}</p>
        </div>
      </section>

      {/* Accounts */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Accounts</h2>
            <p className="text-sm text-slate-500 mt-1">
              User's linked financial accounts.
            </p>
          </div>

          <span className="text-sm text-slate-400">
            {accounts.length} record{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {accounts.length === 0 ? (
          <EmptyState text="No accounts found for this user." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5"
              >
                <h3 className="font-bold text-white">
                  {account.account_name || "Unnamed Account"}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {account.bank_name || "Bank not specified"}
                </p>

                <p className="text-sm text-slate-400 mt-2 capitalize">
                  {account.account_type || "Account"}
                </p>

                <p className="text-2xl font-bold mt-4 text-emerald-300">
                  {formatCurrency(account.current_balance)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Income */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Income</h2>
            <p className="text-sm text-slate-500 mt-1">
              All income records belonging to this user.
            </p>
          </div>

          <span className="text-sm text-slate-400">
            {income.length} record{income.length !== 1 ? "s" : ""}
          </span>
        </div>

        {income.length === 0 ? (
          <EmptyState text="No income records found." />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <TableHeader>Date</TableHeader>
                <TableHeader>Source</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Description</TableHeader>
              </tr>
            </thead>

            <tbody>
              {income.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.source || "—"}</TableCell>
                  <TableCell>
                    <span className="text-emerald-300 font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                  </TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* Expenses */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Expenses</h2>
            <p className="text-sm text-slate-500 mt-1">
              All expense records belonging to this user.
            </p>
          </div>

          <span className="text-sm text-slate-400">
            {expenses.length} record{expenses.length !== 1 ? "s" : ""}
          </span>
        </div>

        {expenses.length === 0 ? (
          <EmptyState text="No expense records found." />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <TableHeader>Date</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Description</TableHeader>
              </tr>
            </thead>

            <tbody>
              {expenses.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.category || "—"}</TableCell>
                  <TableCell>
                    <span className="text-red-300 font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                  </TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* Budgets */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Budgets</h2>
            <p className="text-sm text-slate-500 mt-1">
              Budget limits configured by this user.
            </p>
          </div>

          <span className="text-sm text-slate-400">
            {budgets.length} budget{budgets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {budgets.length === 0 ? (
          <EmptyState text="No budgets found." />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <TableHeader>Category</TableHeader>
                <TableHeader>Monthly Limit</TableHeader>
                <TableHeader>Month</TableHeader>
                <TableHeader>Year</TableHeader>
              </tr>
            </thead>

            <tbody>
              {budgets.map((budget) => (
                <tr
                  key={budget.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <TableCell>{budget.category || "—"}</TableCell>
                  <TableCell>
                    <span className="text-blue-300 font-semibold">
                      {formatCurrency(budget.monthly_limit)}
                    </span>
                  </TableCell>
                  <TableCell>{budget.month ?? "—"}</TableCell>
                  <TableCell>{budget.year ?? "—"}</TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* Savings Goals */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Savings Goals</h2>
            <p className="text-sm text-slate-500 mt-1">
              Savings goals created by this user.
            </p>
          </div>

          <span className="text-sm text-slate-400">
            {savingsGoals.length} goal
            {savingsGoals.length !== 1 ? "s" : ""}
          </span>
        </div>

        {savingsGoals.length === 0 ? (
          <EmptyState text="No savings goals found." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {savingsGoals.map((goal) => {
              const current = Number(goal.current_amount || 0);
              const target = Number(goal.target_amount || 0);

              const progress =
                target > 0
                  ? Math.min((current / target) * 100, 100)
                  : 0;

              return (
                <div
                  key={goal.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5"
                >
                  <h3 className="font-bold text-white">
                    {goal.name || "Savings Goal"}
                  </h3>

                  <div className="flex justify-between text-sm mt-4">
                    <span className="text-slate-400">
                      {formatCurrency(current)}
                    </span>

                    <span className="text-slate-500">
                      {formatCurrency(target)}
                    </span>
                  </div>

                  <div className="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-slate-500">
                      {progress.toFixed(0)}% complete
                    </span>

                    {goal.target_date && (
                      <span className="text-xs text-slate-500">
                        Target: {formatDate(goal.target_date)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="text-sm text-slate-500 mt-1">
              Notifications associated with this user.
            </p>
          </div>

          <span className="text-sm text-slate-400">
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""}
          </span>
        </div>

        {notifications.length === 0 ? (
          <EmptyState text="No notifications found." />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">
                      {notification.title || "Notification"}
                    </h3>

                    <p className="text-slate-400 text-sm mt-1">
                      {notification.message || "—"}
                    </p>
                  </div>

                  <div className="text-xs text-slate-500">
                    {formatDate(notification.created_at)}
                  </div>
                </div>

                <div className="mt-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      notification.is_read
                        ? "bg-slate-800 text-slate-400"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {notification.is_read ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* Reusable Components */

function EmptyState({ text }) {
  return (
    <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center">
      <p className="text-slate-500">{text}</p>
    </div>
  );
}

function DataTable({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="text-left py-3 px-4 text-slate-500 font-semibold whitespace-nowrap">
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td className="py-3 px-4 text-slate-300 align-top">
      {children}
    </td>
  );
}