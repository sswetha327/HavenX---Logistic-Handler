import React, { useState } from 'react';
import { DashboardMetrics, Order, Shipment, Incident, Warehouse } from '../types';
import {
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Warehouse as WarehouseIcon,
  ShieldAlert,
  ArrowUpRight,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  MapPin,
  Sparkles,
  HelpCircle,
  FileText,
  Boxes,
} from 'lucide-react';
import { IndiaLogisticsMap } from '../components/IndiaLogisticsMap';

interface Props {
  metrics: DashboardMetrics | null;
  recentOrders: Order[];
  shipments: Shipment[];
  incidents: Incident[];
  warehouses?: Warehouse[];
  onOpenDemo: () => void;
  onNavigateToTab: (tab: any) => void;
  onSimulateDelay: (shipmentId: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  metrics,
  recentOrders,
  shipments,
  incidents,
  warehouses = [],
  onOpenDemo,
  onNavigateToTab,
  onSimulateDelay,
}) => {
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(true);
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<number>(1);

  const delayedShipments = shipments.filter(s => s.status === 'DELAYED');
  const openIncidents = incidents.filter(i => i.status === 'OPEN');

  const workflowStages = [
    {
      num: 1,
      title: 'Order Handler Agent',
      desc: 'Validates purchase orders across Indian cities, verifies GSTIN & PIN codes, and sets initial ORDER_RECEIVED state.',
      tab: 'orders',
      icon: Package,
    },
    {
      num: 2,
      title: 'Inventory Agent',
      desc: 'Checks multi-warehouse stock (Delhi, Mumbai, Bengaluru, Kolkata, Hyderabad) and reserves inventory atomically.',
      tab: 'inventory',
      icon: Boxes,
    },
    {
      num: 3,
      title: 'Risk & Return Agent',
      desc: 'Evaluates customer behavioral signals (disputes, returns, failed COD handoffs) to generate 0-100 objective risk scores.',
      tab: 'risk',
      icon: ShieldAlert,
    },
    {
      num: 4,
      title: 'Fulfillment & Carrier Agent',
      desc: 'Selects optimal regional hub and compares top Indian carriers (Blue Dart, Delhivery, DTDC, Shadowfax) for lowest transit SLA.',
      tab: 'shipments',
      icon: Truck,
    },
    {
      num: 5,
      title: 'Invoice Agent',
      desc: 'Calculates Indian GST (CGST/SGST/IGST), applies corporate discounts, and issues official downloadable PDF tax invoices.',
      tab: 'invoices',
      icon: FileText,
    },
    {
      num: 6,
      title: 'Self-Healing Exception Agent',
      desc: 'Continuously monitors telemetry, detects delays (e.g. NH48 highway landslide), evaluates alternatives, and auto-executes recovery.',
      tab: 'incidents',
      icon: AlertTriangle,
    },
    {
      num: 7,
      title: 'Feedback / Learning Agent',
      desc: 'Captures delivery satisfaction and manager interventions to dynamically adjust carrier reliability weights for future orders.',
      tab: 'feedback',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner with Quick Simulation CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Autonomous Multi-Agent Architecture</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/20">
              <span>🇮🇳 Pan-India Domestic Logistics Network</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Smart Logistics Handler Agent System
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
            A fully functional multi-agent operations engine automating the complete order-to-delivery lifecycle across India: Order Intake, Multi-Warehouse Inventory Routing, Risk Assessment, Dynamic Carrier Selection, GST Tax Invoices, Self-Healing Recovery, and Feedback Learning.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenDemo}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulate Full 21-Step Workflow</span>
            </button>
            <button
              onClick={() => onNavigateToTab('agents')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-medium border border-white/10 transition-all cursor-pointer"
            >
              View Multi-Agent Architecture Graph
            </button>
            <button
              onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
              className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showWorkflowGuide ? 'Hide Guide' : 'Explain System'}</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
      </div>

      {/* Interactive Workflow Guide Stepper (Collapsible & Intuitive for Users) */}
      {showWorkflowGuide && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                How It Works: The 7-Agent Autonomous Logistics Cycle
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Click any stage to understand the agent's role
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {workflowStages.map(stage => {
              const Icon = stage.icon;
              const isSelected = activeWorkflowStage === stage.num;

              return (
                <button
                  key={stage.num}
                  onClick={() => setActiveWorkflowStage(stage.num)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-400 shadow-xs ring-1 ring-indigo-400/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {stage.num}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{stage.title}</h4>
                </button>
              );
            })}
          </div>

          {/* Active Stage Details Banner */}
          {(() => {
            const current = workflowStages.find(s => s.num === activeWorkflowStage) || workflowStages[0];
            return (
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-indigo-900 block mb-0.5">
                    Stage {current.num}: {current.title}
                  </span>
                  <p className="text-slate-700 leading-relaxed">{current.desc}</p>
                </div>
                <button
                  onClick={() => onNavigateToTab(current.tab)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shrink-0 transition-colors shadow-xs"
                >
                  Open {current.title} →
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.total_orders || recentOrders.length || 50}</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pan-India Grounded DB</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Shipments</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.active_shipments || shipments.length || 12}</div>
          <div className="text-xs text-slate-500 mt-1">10 Indian carriers tracked</div>
        </div>

        <div
          onClick={() => onNavigateToTab('incidents')}
          className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Delayed Shipments</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{delayedShipments.length}</div>
          <div className="text-xs text-rose-700 flex items-center gap-1 mt-1 font-medium">
            <span>Self-Healing Action Ready</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">On-Time SLA Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {metrics?.on_time_rate || 96.4}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Contractual delivery SLA performance</div>
        </div>
      </div>

      {/* Interactive Pan-India Map Component */}
      <IndiaLogisticsMap
        warehouses={warehouses}
        shipments={shipments}
        orders={recentOrders}
        onSelectRegion={zone => onNavigateToTab('orders')}
        onNavigateToShipments={() => onNavigateToTab('shipments')}
      />

      {/* Delayed Orders & Immediate Self-Healing Banner */}
      {delayedShipments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-900">
                  Exception Agent: {delayedShipments.length} Delayed Consignment Detected (Imminent SLA Breach)
                </h3>
                <p className="text-xs text-amber-700">
                  Carrier terminal backlog or equipment issue flagged. Self-Healing recovery proposal ready.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('incidents')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Review Recovery Plan →
            </button>
          </div>

          <div className="space-y-2">
            {delayedShipments.map(s => (
              <div
                key={s.id}
                className="bg-white p-3 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-slate-900 mr-2">{s.order_id}</span>
                  <span className="text-slate-600">({s.carrier_name})</span>
                  <span className="text-rose-600 font-semibold ml-2">+{s.delay_hours || 36}h delay</span>
                  <p className="text-slate-500 mt-0.5">{s.delay_reason}</p>
                </div>
                <button
                  onClick={() => onNavigateToTab('incidents')}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-medium hover:bg-indigo-100 transition-colors self-start sm:self-auto"
                >
                  Inspect Alternative Routes
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Carrier Learning Performance & Warehouse Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carrier Historical & Feedback Learning */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Carrier Dynamic Reliability & Learning</h3>
              <p className="text-xs text-slate-500">Learned reliability score adjusts dynamically based on manager feedback.</p>
            </div>
            <button
              onClick={() => onNavigateToTab('feedback')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Feedback Loop →
            </button>
          </div>

          <div className="space-y-2.5">
            {(metrics?.carrier_performance || []).slice(0, 5).map((c: any) => {
              const adjusted = c.adjusted_reliability || c.base_reliability;
              const hasLearned = c.learning_notes && !c.learning_notes.includes('Standard baseline');

              return (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-md font-mono text-slate-600">
                        {c.code}
                      </span>
                      {hasLearned && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-semibold">
                          Feedback Adapted
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900">{adjusted}% Reliability</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        adjusted >= 95 ? 'bg-emerald-500' : adjusted >= 85 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${adjusted}%` }}
                    />
                  </div>

                  {c.learning_notes && (
                    <p className="text-[11px] text-slate-500 italic">{c.learning_notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Network Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Regional Fulfillment Network</h3>
              <p className="text-xs text-slate-500">5 automated distribution centers monitored by Inventory Agent.</p>
            </div>
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              All Hubs →
            </button>
          </div>

          <div className="space-y-2.5">
            {(metrics?.warehouse_utilization || []).map((w: any) => (
              <div key={w.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{w.name}</span>
                  <span className="text-slate-600 font-medium">{w.utilization_pct}% Capacity</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      w.utilization_pct > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${w.utilization_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Supervised order pipeline with live state machine statuses across Indian destinations.</p>
          </div>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Manage All Orders →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Carrier / Tracking</th>
                <th className="py-2.5 px-3">Amount (INR)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.slice(0, 7).map(order => {
                const isDelayed = order.status === 'DELAYED';
                const isDelivered = order.status === 'DELIVERED';
                const totalAmt = order.total_amount_inr || (order as any).total_amount || 0;

                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{order.id}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{order.customer_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {order.delivery_city}, {order.delivery_state}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          order.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700'
                            : order.priority === 'EXPEDITED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {order.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {order.tracking_id || 'Pending assignment'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      ₹{totalAmt.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          isDelayed
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
