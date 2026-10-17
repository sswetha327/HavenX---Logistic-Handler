import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ReturnRecord, Customer } from '../types';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Check,
  X,
  Truck,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

export const RiskReturnsView: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rets, custs] = await Promise.all([api.getReturns(), api.getCustomers()]);
      setReturns(rets);
      setCustomers(custs);
      if (custs.length > 0 && !selectedCustomerId) {
        // Pick one high-risk customer by default to showcase risk engine
        const highRisk = custs.find(c => c.risk_level === 'HIGH') || custs[0];
        setSelectedCustomerId(highRisk.id);
        runRiskAnalysis(highRisk.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runRiskAnalysis = async (cId: string) => {
    setIsScoring(true);
    try {
      const res = await api.getCustomerRisk(cId);
      setRiskAnalysis(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsScoring(false);
    }
  };

  const handleProcessReturn = async (returnId: string, decision: 'APPROVE' | 'REJECT', notes?: string) => {
    try {
      await api.processReturn(returnId, decision, notes);
      fetchData();
      alert(`Return ${decision === 'APPROVE' ? 'Approved & Reverse Tracking Issued' : 'Rejected'}.`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-base text-slate-900">Risk Assessment & Reverse Logistics</h2>
          <p className="text-xs text-slate-500">
            Behavioral anomaly scoring (no defamatory tags) and RMA reverse return workflows.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Behavioral Risk Analysis Engine Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-400/20">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
              <span>Agent 3: Objective Behavioral Risk Scoring</span>
            </div>
            <h3 className="text-xl font-bold">Customer Account Risk Evaluation</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              We never label users with pejorative terms. The agent calculates a multi-factor risk score (0-100) using return frequency, delivery dispute frequency, and order pattern anomalies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                runRiskAnalysis(e.target.value);
              }}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.name} ({c.risk_level} Risk • {c.risk_score}/100)
                </option>
              ))}
            </select>
          </div>
        </div>

        {riskAnalysis && (
          <div className="bg-white/10 rounded-xl p-5 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account</span>
                <h4 className="text-lg font-bold text-white">{riskAnalysis.customer_name}</h4>
                <p className="text-xs text-purple-200 mt-0.5">{riskAnalysis.recommendation}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Score</span>
                <span
                  className={`text-2xl font-black ${
                    riskAnalysis.risk_score >= 70
                      ? 'text-rose-400'
                      : riskAnalysis.risk_score >= 35
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {riskAnalysis.risk_score}/100
                </span>
                <span className="text-[10px] block font-bold text-slate-300">
                  {riskAnalysis.risk_level} RISK LEVEL
                </span>
              </div>
            </div>

            {/* Risk factors breakdown */}
            <div className="pt-3 border-t border-white/10">
              <span className="text-[11px] uppercase font-bold text-slate-300 block mb-2">
                Identified Quantitative Risk Factors ({riskAnalysis.factors.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {riskAnalysis.factors.map((f: any, fIdx: number) => (
                  <div key={fIdx} className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center font-semibold text-rose-300">
                      <span>{f.name}</span>
                      <span className="text-[11px] text-rose-400">+{f.score_impact} pts</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Return Requests (Reverse Logistics) Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">RMA Reverse Logistics & Return Requests</h3>
            <p className="text-xs text-slate-500">
              Agent evaluates purchase date eligibility, validates return window policy, and issues reverse carrier labels.
            </p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {returns.length} Total Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">RMA Number</th>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Return Reason</th>
                <th className="py-2.5 px-3">Refund Amount</th>
                <th className="py-2.5 px-3">Reverse Carrier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map(ret => {
                const isPending = ret.status === 'PENDING_REVIEW';
                const isApproved = ret.status === 'APPROVED' || ret.status === 'REFUNDED';
                const isRejected = ret.status === 'REJECTED';

                return (
                  <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{ret.return_id}</td>
                    <td className="py-2.5 px-3 font-mono text-indigo-700">{ret.order_id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{ret.customer_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{ret.product_name}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      ₹{(ret.refund_amount_inr || (ret as any).refund_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {ret.reverse_tracking_id ? (
                        <span className="text-indigo-600">{ret.reverse_carrier_name}: {ret.reverse_tracking_id}</span>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ret.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleProcessReturn(ret.id, 'APPROVE')}
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200"
                            title="Approve Return"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleProcessReturn(ret.id, 'REJECT', 'Exceeded standard policy return window')}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200"
                            title="Reject Return"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Processed</span>
                      )}
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
