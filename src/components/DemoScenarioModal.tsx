import React, { useState } from 'react';
import { api } from '../api';
import { WorkflowStep } from '../types';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Bot,
  Truck,
  Box,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const DemoScenarioModal: React.FC<Props> = ({ isOpen, onClose, onCompleted }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [summary, setSummary] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const runDemo = async () => {
    setIsRunning(true);
    setSteps([]);
    setCurrentStepIndex(0);
    setSummary(null);
    setOrderId(null);

    try {
      const res = await api.runCompleteDemoScenario();
      setOrderId(res.order_id);
      setSummary(res.summary);

      // Play back steps progressively for vivid animation
      for (let i = 0; i < res.steps.length; i++) {
        setSteps(prev => [...prev, res.steps[i]]);
        setCurrentStepIndex(i);
        await new Promise(r => setTimeout(r, 280)); // 280ms per step
      }
      if (onCompleted) onCompleted();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'Supervisor Agent':
        return <Bot className="w-4 h-4 text-purple-600" />;
      case 'Order Handler Agent':
        return <Box className="w-4 h-4 text-blue-600" />;
      case 'Inventory Agent':
        return <Box className="w-4 h-4 text-emerald-600" />;
      case 'Risk / Return Agent':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'Fulfillment & Shipment Agent':
        return <Truck className="w-4 h-4 text-cyan-600" />;
      case 'Invoice Agent':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'Exception & Recovery Agent':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'Feedback / Learning Agent':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Zap className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/30 text-indigo-300 rounded-xl border border-indigo-400/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl">21-Step End-to-End Autonomous Simulation</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Full Self-Healing Loop
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Order Placement → Validation → Stock Check → Fulfillment → Carrier Delay Injection → Self-Healing Recovery → Delivery → Feedback Learning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={runDemo}
              disabled={isRunning}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all ${
                isRunning
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Orchestrating AI Agents ({steps.length}/21)...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {steps.length === 0 ? 'Start Live Simulation' : 'Run Again'}
                </>
              )}
            </button>

            {orderId && (
              <span className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                Active Demo Order: <strong className="text-slate-900">{orderId}</strong>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Real database mutations & carrier re-routing</span>
          </div>
        </div>

        {/* Stepper Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {steps.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Experience the Full Autonomous Lifecycle</h4>
              <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1 mb-6">
                Click <strong>"Start Live Simulation"</strong> above to watch our multi-agent supervisor orchestrate the order, reserve real warehouse stock, inject a live carrier delay, trigger the Exception Agent's self-healing recovery, and close the feedback learning loop.
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto text-left text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-800">1. Ingestion & Stock</span>
                  <p className="text-slate-500">Order Handler validates and Inventory Agent allocates 5 regional hubs.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-rose-700">2. Delay & Recovery</span>
                  <p className="text-slate-500">Carrier delay detected; AI compares alternatives and reassigns route.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-emerald-700">3. Dynamic Learning</span>
                  <p className="text-slate-500">Feedback adjusts carrier weights for future optimization.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {steps.map((st, idx) => {
                const isException = st.status === 'EXCEPTION';
                const isRecovered = st.status === 'RECOVERED';
                const isCurrent = idx === currentStepIndex && isRunning;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all text-sm ${
                      isException
                        ? 'bg-rose-50/80 border-rose-200'
                        : isRecovered
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${isCurrent ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-2xs'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {st.step_number}
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                          {getAgentIcon(st.agent)}
                          <span>{st.agent}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {st.action}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          isException
                            ? 'bg-rose-100 text-rose-700'
                            : isRecovered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.status}
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs leading-relaxed ml-7">{st.details}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {summary && (
          <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-900 font-medium">{summary}</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              Done & Explore App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
