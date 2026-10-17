import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { NotificationItem, SystemSettings } from '../types';
import {
  Bell,
  Play,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Zap,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

interface Props {
  onOpenDemo: () => void;
  onOpenChat: () => void;
  onRefreshData: () => void;
  settings: SystemSettings | null;
  onSettingsChange: (s: SystemSettings) => void;
}

export const Header: React.FC<Props> = ({
  onOpenDemo,
  onOpenChat,
  onRefreshData,
  settings,
  onSettingsChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  const fetchNotifs = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    for (const n of notifications.filter(x => !x.read)) {
      await api.markNotificationRead(n.id);
    }
    fetchNotifs();
  };

  const toggleMode = async () => {
    if (!settings || isTogglingMode) return;
    setIsTogglingMode(true);
    const newMode = settings.mode === 'ASSISTED' ? 'AUTONOMOUS' : 'ASSISTED';
    try {
      const updated = await api.updateSettings({ mode: newMode });
      onSettingsChange(updated);
    } catch (e: any) {
      alert(`Could not toggle mode: ${e.message}`);
    } finally {
      setIsTogglingMode(false);
    }
  };

  const handleResetDb = async () => {
    if (confirm('Reset database to clean seed state (50 orders, 5 warehouses, 10 carriers, 1 open incident)?')) {
      await api.resetDatabase();
      onRefreshData();
      fetchNotifs();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      {/* Left: Branding & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-sm font-black text-lg">
          SL
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-slate-900 tracking-tight">
              SMART LOGISTICS HANDLER AGENT
            </h1>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase flex items-center gap-1">
              <span>🇮🇳</span>
              <span>India Network</span>
            </span>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase hidden sm:inline-block">
              Multi-Agent Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time Supervisor Orchestrator • Self-Healing Exception Engine • Closed-Loop Feedback Learning
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Mode Toggle: Assisted vs Autonomous */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={toggleMode}
            disabled={isTogglingMode}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              settings?.mode === 'ASSISTED'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Assisted Mode: AI recommends recovery plans; Human Operator approves high-impact decisions."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Assisted Mode</span>
          </button>
          <button
            onClick={toggleMode}
            disabled={isTogglingMode}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              settings?.mode === 'AUTONOMOUS'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Autonomous Mode: AI automatically executes low & medium-risk recovery actions and carrier switches."
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Autonomous Mode</span>
          </button>
        </div>

        {/* 21-Step Demo Simulation Runner */}
        <button
          onClick={onOpenDemo}
          className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run 21-Step Demo</span>
        </button>

        {/* AI Chat trigger */}
        <button
          onClick={onOpenChat}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors border border-slate-200"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ask AI Agent</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
                <span className="font-semibold">Operations Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-slate-300 hover:text-white underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 font-semibold text-slate-800">
                        {n.severity === 'error' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        ) : n.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : n.severity === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-slate-600 leading-snug">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Database Reset Button */}
        <button
          onClick={handleResetDb}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="Reset Seed Database"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
