import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';
import { Bell, CheckCircle, AlertTriangle, Target, FileText, Check, RefreshCw, TrendingUp, TrendingDown, PieChart, CreditCard, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { showToast } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refreshNotifications', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      showToast('info', 'Notification marked as read');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      showToast('success', 'Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelection = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(notifications.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Are you sure you want to remove the selected notifications?")) return;

    try {
      await api.delete('/notifications/selected/bulk', {
        data: { notification_ids: selectedIds }
      });
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      showToast('success', `${selectedIds.length} notifications removed successfully.`);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to bulk delete notifications:', err);
      showToast('error', 'Failed to remove selected notifications.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />;
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'goal_milestone':
      case 'goal_created':
        return <Target className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'income_added':
        return <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />;
      case 'expense_added':
        return <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'budget_created':
        return <PieChart className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'account_created':
        return <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'monthly_report':
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={fetchNotifications}
              title="Refresh"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800 flex justify-between items-center">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50"
                />
                <span>Select All</span>
              </label>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                <p className="font-semibold text-slate-300">No notifications</p>
                <p>System alerts and milestones will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start space-x-3 transition-colors group ${
                    !n.is_read ? 'bg-blue-600/5 hover:bg-blue-600/10' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(n.id)}
                      onChange={(e) => toggleSelection(n.id, e)}
                      className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                    />
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className={`text-xs ${!n.is_read ? 'text-white font-semibold' : 'text-slate-300'}`}>
                        {n.rich_text ? (
                          <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                            <ReactMarkdown>{n.rich_text}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{n.message}</p>
                        )}
                      </div>
                      <div className="flex items-center ml-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button
                            onClick={(e) => markAsRead(n.id, e)}
                            title="Mark as read"
                            className="text-slate-500 hover:text-emerald-400 p-1 shrink-0 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          title="Delete notification"
                          className="text-slate-500 hover:text-red-400 p-1 shrink-0 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {!n.rich_text && (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
