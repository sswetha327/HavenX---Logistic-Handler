import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Incident, RecoveryPlan, SystemSettings } from '../types';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  onRefreshData?: () => void;
  settings: SystemSettings | null;
}

export const SelfHealingView: React.FC<Props> = ({ onRefreshData, settings }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [plans, setPlans] = useState<RecoveryPlan[]>([]);
  const [delayedOrders, setDelayedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executingPlanId, setExecutingPlanId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data.incidents);
      setPlans(data.recovery_plans);
      setDelayedOrders(data.delayed_orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecutePlan = async (planId: string) => {
    setExecutingPlanId(planId);
    try {
      await api.executeRecoveryPlan(planId, 'Logistics Operations Specialist (Interactive UI)');
      fetchData();
      if (onRefreshData) onRefreshData();
      alert('Self-Healing Recovery Plan executed successfully! Carrier reassigned and incident resolved.');
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecutingPlanId(null);
    }
  };

  const openIncidents = incidents.filter(i => i.status === 'OPEN');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-rose-900/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-3 border border-rose-500/30">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Autonomous Self-Healing & Exception Engine (Agent 7)</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">
            Automated Incident Mitigation & Recovery Loop
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Instead of merely alerting humans to shipment bottlenecks or stock shortages, the Exception Agent analyzes root causes, checks promised SLAs, compares real alternative carriers (Cost vs ETA vs Reliability), and executes recovery reassignments.
          </p>

          <div className="flex items-center gap-3 text-xs">
            <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              Current Mode: <strong className="text-white">{settings?.mode || 'ASSISTED'}</strong>
            </span>
            <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-slate-300">
              {openIncidents.length} Open Incidents • {resolvedIncidents.length} Resolved
            </span>
          </div>
        </div>
      </div>

      {/* Visual Self-Healing Loop Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">The Autonomous Self-Healing Cycle</h3>
            <p className="text-xs text-slate-500">Continuous telemetry loop ensuring zero order drops without manual restarts.</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <span className="font-bold text-indigo-700 block">1. MONITOR</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Live GPS & carrier hub telemetry</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
            <span className="font-bold text-rose-700 block">2. DETECT</span>
            <span className="text-[11px] text-rose-600 mt-1 block">Delay & SLA breach flagged</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
            <span className="font-bold text-amber-700 block">3. ANALYZE</span>
            <span className="text-[11px] text-amber-600 mt-1 block">Root cause & lost hours computed</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
            <span className="font-bold text-blue-700 block">4. EVALUATE</span>
            <span className="text-[11px] text-blue-600 mt-1 block">Compare alternate carriers</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-center">
            <span className="font-bold text-purple-700 block">5. RECOVER</span>
            <span className="text-[11px] text-purple-600 mt-1 block">Human sign-off or Auto-execute</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
            <span className="font-bold text-emerald-700 block">6. LEARN</span>
            <span className="text-[11px] text-emerald-600 mt-1 block">Recalibrate carrier weights</span>
          </div>
        </div>
      </div>

      {/* Active Recovery Plans Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          <span>Active Self-Healing Recovery Proposals ({plans.filter(p => p.status === 'PENDING_APPROVAL').length} Pending)</span>
        </h3>

        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            No active incidents. You can inject a simulated carrier delay on any order in the <strong>Shipments</strong> tab!
          </div>
        ) : (
          plans.map(plan => {
            const isPending = plan.status === 'PENDING_APPROVAL';
            const isExecuted = plan.status === 'APPROVED' || plan.status === 'AUTO_EXECUTED';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-6 shadow-2xs space-y-5 transition-all ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                {/* Header of Proposal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {plan.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Order Ref: {plan.order_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900 mt-1.5">{plan.recommendation}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Cause: {plan.root_cause}</p>
                  </div>

                  {/* Confidence Score & Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Confidence</span>
                      <span className="text-xl font-black text-emerald-600">{plan.confidence}%</span>
                    </div>

                    {isPending && (
                      <button
                        onClick={() => handleExecutePlan(plan.id)}
                        disabled={executingPlanId === plan.id}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        {executingPlanId === plan.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Reassigning Carrier...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Execute Recovery</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Rationale & Quantitative Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                      Key Decision Reasons
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {plan.reasons.map((r, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Quantitative Evidence & Recovery Metrics
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {plan.evidence.map((ev, eIdx) => (
                        <li key={eIdx} className="flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Alternatives Comparison Matrix */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Evaluated Routing Alternatives (Cost vs ETA vs Reliability)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {plan.alternatives.map((alt, aIdx) => (
                      <div
                        key={aIdx}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          aIdx === 0
                            ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{alt.title}</span>
                          {aIdx === 0 && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                              AI Choice
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-slate-100 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Cost (INR)</span>
                            <span className="font-bold text-slate-800">₹{(alt.cost_inr || (alt as any).cost || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">ETA</span>
                            <span className="font-bold text-slate-800">{alt.eta_days}d</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Reliability</span>
                            <span className="font-bold text-emerald-700">{alt.reliability}%</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">
                          <strong>Risk:</strong> {alt.risk}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
