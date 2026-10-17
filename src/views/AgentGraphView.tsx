import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { AuditLog } from '../types';
import {
  Network,
  Bot,
  Box,
  Truck,
  FileText,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const AgentGraphView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeAgentTab, setActiveAgentTab] = useState<'graph' | 'audit'>('graph');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const agents = [
    {
      name: 'Supervisor Agent',
      role: 'Workflow Orchestration & State Transition Control',
      tools: ['route_order()', 'monitor_state_machine()', 'trigger_exception()', 'maintain_audit_trail()'],
      color: 'border-purple-500 bg-purple-50/50 text-purple-900',
      icon: Bot,
      status: 'Active (24/7 Monitor)',
      details: 'Coordinates all specialized agents, passes context, detects failures, and enforces strict order lifecycle validation.',
    },
    {
      name: 'Order Handler Agent',
      role: 'Order Intake, Address Validation & Line Item Audit',
      tools: ['validate_order_schema()', 'verify_address()', 'calculate_totals()', 'set_order_status()'],
      color: 'border-blue-500 bg-blue-50/50 text-blue-900',
      icon: Box,
      status: 'Idle (Listening for Webhooks/API)',
      details: 'Validates raw purchase orders, verifies delivery addresses, confirms customer accounts, and initiates the ORDER_RECEIVED state.',
    },
    {
      name: 'Inventory Agent',
      role: 'Multi-Warehouse Allocation & Stock Reservation',
      tools: ['check_multi_warehouse_stock()', 'reserve_inventory()', 'release_inventory()', 'flag_replenishment()'],
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900',
      icon: Box,
      status: 'Synchronized (5 Warehouses)',
      details: 'Checks availability across 5 regional hubs, prevents overselling, recommends split-fulfillment, and reserves stock atomically in the relational database.',
    },
    {
      name: 'Risk / Return Agent',
      role: 'Behavioral Fraud Scoring & Return Authorization',
      tools: ['calculate_risk_score()', 'evaluate_return_window()', 'generate_reverse_label()', 'flag_disputes()'],
      color: 'border-amber-500 bg-amber-50/50 text-amber-900',
      icon: ShieldCheck,
      status: 'Evaluating (0 Scammer labels, Objective Vectors)',
      details: 'Computes continuous 0-100 risk score using return rate, failed drops, disputes, and order spikes. Authorizes RMA returns and reverse logistics.',
    },
    {
      name: 'Fulfillment & Shipment Agent',
      role: 'Warehouse Scoring & Dynamic Carrier Routing',
      tools: ['find_best_warehouse()', 'compare_carriers()', 'create_shipment()', 'generate_tracking_id()'],
      color: 'border-cyan-500 bg-cyan-50/50 text-cyan-900',
      icon: Truck,
      status: 'Optimizing (10 Carriers)',
      details: 'Evaluates distance, SLA deadlines, handling costs, and carrier historical reliability with learned offsets to dispatch parcels.',
    },
    {
      name: 'Invoice Agent',
      role: 'Fiscal Calculation & Downloadable PDF Generation',
      tools: ['calculate_tax_and_shipping()', 'generate_invoice()', 'render_pdf_invoice()', 'audit_discounts()'],
      color: 'border-indigo-500 bg-indigo-50/50 text-indigo-900',
      icon: FileText,
      status: 'Operational (PDF Engine Active)',
      details: 'Produces itemized commercial invoices with tax, discounts, and shipping lines, rendering downloadable PDFs with barcode timestamps.',
    },
    {
      name: 'Exception & Recovery Agent',
      role: 'Self-Healing Engine & Alternative Route Solver',
      tools: ['detect_delayed_orders()', 'evaluate_alternatives()', 'generate_recovery_plan()', 'execute_recovery()'],
      color: 'border-rose-500 bg-rose-50/50 text-rose-900',
      icon: AlertTriangle,
      status: 'Active (Continuous Telemetry)',
      details: 'Detects in-transit delays, stock-outs, or bad addresses. Evaluates cost vs ETA vs reliability trade-offs and generates self-healing recovery plans.',
    },
    {
      name: 'Feedback / Learning Agent',
      role: 'Closed-Loop Calibration & Carrier Reliability Tuning',
      tools: ['record_feedback()', 'calculate_learned_offset()', 'adjust_scoring_weights()', 'audit_corrections()'],
      color: 'border-amber-500 bg-amber-50/50 text-amber-900',
      icon: Sparkles,
      status: 'Learning Active (Adjusting Weights)',
      details: 'Captures post-delivery feedback and manager corrections to dynamically tune carrier and warehouse scoring weights for future routing decisions.',
    },
  ];

  const filteredLogs = selectedAgent
    ? logs.filter(l => l.agent_name.toLowerCase().includes(selectedAgent.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-base text-slate-900">Multi-Agent Architecture & Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Powered by Google Agent Development Kit (ADK) — Supervisor Orchestrator coordinates specialized subagents with type-safe tools and real database mutations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setActiveAgentTab('graph')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeAgentTab === 'graph' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Interactive Agent Map
            </button>
            <button
              onClick={() => setActiveAgentTab('audit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeAgentTab === 'audit' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Live Audit Log ({logs.length})
            </button>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeAgentTab === 'graph' ? (
        <div className="space-y-6">
          {/* Visual Orchestration Flow */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
                End-to-End Orchestrated Pipeline
              </span>
              <h3 className="text-xl font-bold mt-2">Central Supervisor & Specialized Agent Pipeline</h3>
              <p className="text-xs text-slate-300 mt-1">
                The Supervisor routes orders sequentially through specialized agents while the Exception Agent continuously monitors the feedback loop.
              </p>
            </div>

            {/* Stepper Diagram */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-indigo-300 font-bold block mb-1">Step 1 • Ingestion</span>
                <p className="text-white font-medium">Order Handler</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Validates payload & customer address</p>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-indigo-300 font-bold block mb-1">Step 2 • Stock Check</span>
                <p className="text-white font-medium">Inventory Agent</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Checks 5 hubs & reserves units</p>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-indigo-300 font-bold block mb-1">Step 3 • Fulfillment</span>
                <p className="text-white font-medium">Fulfillment & Shipping</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Picks optimal hub & best carrier</p>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-indigo-300 font-bold block mb-1">Step 4 • Fiscal Audit</span>
                <p className="text-white font-medium">Invoice Agent</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Generates invoice & PDF slip</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-rose-500/20 p-3 rounded-xl border border-rose-500/30">
                <span className="text-rose-300 font-bold block mb-1">Continuous Safeguard • Self-Healing Loop</span>
                <p className="text-white font-medium">Exception & Recovery Agent</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Detects delivery delays, out-of-stock events, or transit halts; evaluates alternative carriers and automatically executes recovery.
                </p>
              </div>

              <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30">
                <span className="text-amber-300 font-bold block mb-1">Closed-Loop Adaptation</span>
                <p className="text-white font-medium">Feedback / Learning Agent</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Updates carrier reliability scoring weights based on delivered performance and manager corrections.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent, idx) => {
              const Icon = agent.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3 transition-all hover:shadow-md ${agent.color.split(' ')[0]}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{agent.name}</h4>
                        <p className="text-xs text-slate-500">{agent.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {agent.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{agent.details}</p>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Deterministic Tools & Function Declarations
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Audit Trail View */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Deterministic AI Decision Audit Ledger</h3>
              <p className="text-xs text-slate-500">
                Every action taken by agents, tool invocations, and supervisor state transitions is logged here with exact timestamps.
              </p>
            </div>

            {/* Filter by agent */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAgent || ''}
                onChange={e => setSelectedAgent(e.target.value || null)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Agents</option>
                <option value="Supervisor">Supervisor Agent</option>
                <option value="Order Handler">Order Handler Agent</option>
                <option value="Inventory">Inventory Agent</option>
                <option value="Risk">Risk / Return Agent</option>
                <option value="Fulfillment">Fulfillment & Shipment Agent</option>
                <option value="Invoice">Invoice Agent</option>
                <option value="Exception">Exception & Recovery Agent</option>
                <option value="Feedback">Feedback / Learning Agent</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details & Rationale</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isRecovered = log.status === 'RECOVERED';
                  const isWarning = log.status === 'WARNING';
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{log.agent_name}</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-700 text-[11px] font-medium">{log.action}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {log.target_type}: {log.target_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-md">{log.details}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isRecovered
                              ? 'bg-purple-100 text-purple-800'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
