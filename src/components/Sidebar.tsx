import React from 'react';
import {
  LayoutDashboard,
  Network,
  Package,
  Warehouse,
  Truck,
  AlertOctagon,
  ShieldAlert,
  FileCheck2,
  Sparkles,
  FileUp,
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'agents'
  | 'orders'
  | 'inventory'
  | 'shipments'
  | 'incidents'
  | 'risk'
  | 'invoices'
  | 'feedback'
  | 'multimodal';

interface Props {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  openIncidentsCount: number;
  delayedOrdersCount: number;
  highRiskCount: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  openIncidentsCount,
  delayedOrdersCount,
  highRiskCount,
}) => {
  const menuItems = [
    { id: 'dashboard' as TabId, label: 'Dashboard & KPIs', icon: LayoutDashboard },
    { id: 'agents' as TabId, label: 'Multi-Agent Network', icon: Network, highlight: true },
    { id: 'orders' as TabId, label: 'Orders Management', icon: Package, badge: delayedOrdersCount > 0 ? `${delayedOrdersCount} late` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'inventory' as TabId, label: 'Inventory & Hubs', icon: Warehouse },
    { id: 'shipments' as TabId, label: 'Shipments & Tracking', icon: Truck },
    {
      id: 'incidents' as TabId,
      label: 'Self-Healing Engine',
      icon: AlertOctagon,
      badge: openIncidentsCount > 0 ? `${openIncidentsCount} action` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 font-bold animate-pulse',
    },
    {
      id: 'risk' as TabId,
      label: 'Risk & Returns',
      icon: ShieldAlert,
      badge: highRiskCount > 0 ? `${highRiskCount} alert` : undefined,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    { id: 'invoices' as TabId, label: 'Invoices & Billing', icon: FileCheck2 },
    { id: 'feedback' as TabId, label: 'Feedback & Learning', icon: Sparkles },
    { id: 'multimodal' as TabId, label: 'Multimodal PO Ingestion', icon: FileUp },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800/80">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
          Operations Control
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>7 Specialized Agents Active</span>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1.5">
        <div className="flex justify-between">
          <span>Region Scope</span>
          <span className="text-white font-semibold flex items-center gap-1">
            <span>🇮🇳</span> Pan-India
          </span>
        </div>
        <div className="flex justify-between">
          <span>Supervisor Status</span>
          <span className="text-emerald-400 font-medium">Authoritative</span>
        </div>
        <div className="flex justify-between">
          <span>Relational Store</span>
          <span className="text-slate-400">Grounded DB</span>
        </div>
        <div className="flex justify-between">
          <span>Self-Healing Loop</span>
          <span className="text-indigo-400 font-medium">Active (Agent 7)</span>
        </div>
      </div>
    </aside>
  );
};
