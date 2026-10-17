import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FeedbackRecord, Order, Carrier } from '../types';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  CheckCircle2,
  XCircle,
  Truck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface Props {
  orders: Order[];
  onRefreshData?: () => void;
}

export const FeedbackView: React.FC<Props> = ({ orders, onRefreshData }) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [carrierOffsets, setCarrierOffsets] = useState<Record<string, any>>({});
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(false);

  // New feedback form state
  const [targetOrderId, setTargetOrderId] = useState<string>(orders[0]?.id || 'ORD-1001');
  const [ratingType, setRatingType] = useState<FeedbackRecord['rating_type']>('GOOD');
  const [category, setCategory] = useState<FeedbackRecord['category']>('CARRIER_PERFORMANCE');
  const [comment, setComment] = useState('');
  const [humanCorrection, setHumanCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fData, cData] = await Promise.all([api.getFeedback(), api.getCarriers()]);
      setFeedbackList(fData.feedback);
      setCarrierOffsets(fData.carrier_offsets);
      setCarriers(cData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await api.recordFeedback({
        order_id: targetOrderId,
        rating_type: ratingType,
        category,
        comment,
        human_correction: humanCorrection || undefined,
      });
      setComment('');
      setHumanCorrection('');
      fetchData();
      if (onRefreshData) onRefreshData();
      alert(`Feedback recorded! Carrier scoring weight has been dynamically recalibrated.`);
    } catch (err: any) {
      alert(`Error submitting feedback: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 text-white border border-amber-900/40 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Closed-Loop Adaptation & Dynamic Learned Scoring</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Continuous Operational Learning Engine (Agent 6)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Rather than claiming the LLM itself is retrained, we implement real-world feedback-driven adaptation: post-delivery satisfaction, carrier delays, and manager human corrections directly adjust carrier reliability weights and route preference offsets in the relational database.
          </p>
        </div>
      </div>

      {/* Dynamic Learned Carrier Reliability Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Dynamic Learned Carrier Weights & Performance</h3>
            <p className="text-xs text-slate-500">
              The Fulfillment Agent incorporates these dynamically updated reliability weights on future route selections.
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Carrier Name</th>
                <th className="py-2.5 px-3">Service Tier</th>
                <th className="py-2.5 px-3 text-center">Baseline Score</th>
                <th className="py-2.5 px-3 text-center">Learned Delta</th>
                <th className="py-2.5 px-3 text-center">Adjusted Score</th>
                <th className="py-2.5 px-3">Learning Adaptation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carriers.map(c => {
                const offset = carrierOffsets[c.id];
                const delta = offset ? offset.delta : 0;
                const finalScore = c.adjusted_reliability || c.reliability_score;
                const isPositive = delta > 0;
                const isNegative = delta < 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.code}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {c.service_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                      {c.reliability_score}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          isPositive
                            ? 'text-emerald-600'
                            : isNegative
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {isPositive ? `+${delta.toFixed(1)}` : delta !== 0 ? delta.toFixed(1) : '0.0'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-black text-sm ${
                          finalScore >= 95
                            ? 'text-emerald-700'
                            : finalScore >= 85
                            ? 'text-indigo-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {finalScore}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-md">
                      {c.learning_notes || 'Standard baseline initialized.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Record New Feedback & Recent Feedback Audit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Record Feedback Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Record Human Correction & Feedback</h3>
            <p className="text-xs text-slate-500">Manager feedback immediately updates scoring weights.</p>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Select Order Ref</label>
              <select
                value={targetOrderId}
                onChange={e => setTargetOrderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {orders.slice(0, 20).map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.customer_name} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Feedback Rating Type</label>
              <select
                value={ratingType}
                onChange={e => setRatingType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="GOOD">GOOD (+1.5 score weight)</option>
                <option value="ACCEPTED">ACCEPTED (+1.0 score weight)</option>
                <option value="MODIFIED">MODIFIED (-1.5 score weight, with human correction)</option>
                <option value="INCORRECT">INCORRECT (-2.5 score weight)</option>
                <option value="BAD">BAD (-4.0 score weight)</option>
                <option value="REJECTED">REJECTED (-3.0 score weight)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Manager Comment</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="e.g. Carrier delivered 4 hours early with zero damage..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Human Correction Rule (Optional)</label>
              <input
                type="text"
                value={humanCorrection}
                onChange={e => setHumanCorrection(e.target.value)}
                placeholder="e.g. Always prefer Apex Express for URGENT tier orders over $1500"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Record Feedback & Tune Weights</span>
            </button>
          </form>
        </div>

        {/* Feedback History Ledger */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Historical Decisions & Feedback Trail</h3>
              <p className="text-xs text-slate-500">{feedbackList.length} recorded feedback evaluations.</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
            {feedbackList.map(f => (
              <div
                key={f.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{f.order_id}</span>
                    {f.carrier_name && (
                      <span className="text-slate-500 font-medium">({f.carrier_name})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        f.rating_type === 'GOOD' || f.rating_type === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : f.rating_type === 'MODIFIED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.rating_type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Delta: {f.applied_weight_delta > 0 ? `+${f.applied_weight_delta}` : f.applied_weight_delta}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed">{f.comment}</p>

                {f.human_correction && (
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 font-medium text-[11px] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span><strong>Human Rule:</strong> {f.human_correction}</span>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Logged: {new Date(f.recorded_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
