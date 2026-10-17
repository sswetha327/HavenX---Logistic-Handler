import React, { useState } from 'react';
import { api } from '../api';
import { FailureSimulationType } from '../types';
import {
  X,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Bug,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const FailureSimulationModal: React.FC<Props> = ({ isOpen, onClose, onCompleted }) => {
  const [running, setRunning] = useState(false);
  const [selectedType, setSelectedType] = useState<FailureSimulationType | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const scenarios: {
    type: FailureSimulationType;
    title: string;
    description: string;
    category: 'Inventory' | 'Carrier' | 'API' | 'Address' | 'Delivery' | 'Agent' | 'Guardrail';
    badgeColor: string;
  }[] = [
    {
      type: 'OUT_OF_STOCK',
      title: 'Simulate Out of Stock',
      description: 'Depletes stock of ProWorkstation in Bengaluru Hub to 0. Tests multi-hub rerouting to Mumbai West Hub.',
      category: 'Inventory',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      type: 'CARRIER_DELAY',
      title: 'Simulate Carrier Delay',
      description: 'Injects +36h highway landslide bottleneck on NH48. Tests autonomous air cargo switch to Blue Dart Apex.',
      category: 'Carrier',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      type: 'API_TIMEOUT',
      title: 'Simulate API Failure',
      description: 'Forces 5000ms timeout on Delhivery API. Tests graceful retry, local cache benchmarks, and DTDC fallback.',
      category: 'API',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      type: 'INVALID_ADDRESS',
      title: 'Simulate Invalid Address',
      description: 'Injects postal mismatch (PIN 110099 vs Maharashtra). Tests India Post normalization and OTP prompt.',
      category: 'Address',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      type: 'FAILED_DELIVERY',
      title: 'Simulate Failed Delivery',
      description: 'Simulates locked premises and unreachable consignee phone. Tests automated WhatsApp rescheduling window.',
      category: 'Delivery',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      type: 'AGENT_FAILURE',
      title: 'Simulate Agent Failure',
      description: 'Simulates 503 crash on Risk & Return Agent microservice. Tests Supervisor fault isolation & offline fallback.',
      category: 'Agent',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      type: 'HALLUCINATION',
      title: 'Simulate Hallucinated Response',
      description: 'Tests post-flight Grounding Guardrail detecting disparity between claimed 99% SLA and actual 80.5% DB facts.',
      category: 'Guardrail',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  const handleRunSimulation = async (type: FailureSimulationType) => {
    setSelectedType(type);
    setRunning(true);
    setLastResult(null);

    try {
      const res = await api.simulateFailure(type);
      setLastResult(res);
      if (onCompleted) onCompleted();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Failure & Self-Healing Simulation Suite</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Demo / Test Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trigger real edge-case failures to demonstrate autonomous AI detection, guardrails, and self-healing recovery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Instructions Box */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">How Self-Healing Evaluation Works:</p>
              <p className="text-blue-800 leading-relaxed">
                Click any failure scenario below. The multi-agent orchestrator will inject the fault, pass structured A2A alerts,
                engage guardrail verifications, and execute an alternative mitigation strategy (rerouting, cached fallback, or air expediting).
              </p>
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {scenarios.map(sc => {
              const isSelected = selectedType === sc.type;
              return (
                <div
                  key={sc.type}
                  className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${sc.badgeColor}`}>
                        {sc.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">ID: {sc.type}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1">{sc.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{sc.description}</p>
                  </div>

                  <button
                    onClick={() => handleRunSimulation(sc.type)}
                    disabled={running}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected && running
                        ? 'bg-indigo-400 text-white cursor-wait'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-2xs'
                    }`}
                  >
                    {isSelected && running ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Simulating & Healing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Simulate {sc.category} Failure</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Simulation Output Card */}
          {lastResult && (
            <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-emerald-950">
                    Self-Healing Mitigation Completed for {lastResult.type}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Status: HEALED & RECORDED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    1. Injected Fault Telemetry
                  </span>
                  <p className="font-semibold text-slate-800">{lastResult.message}</p>
                  {lastResult.incident && (
                    <p className="text-slate-600 font-mono text-[11px]">
                      Incident Logged: {lastResult.incident.id} • Severity: {lastResult.incident.severity}
                    </p>
                  )}
                </div>

                <div className="bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                    2. AI Autonomous Recovery Action
                  </span>
                  <p className="font-semibold text-emerald-950">{lastResult.recovery_action}</p>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">{lastResult.resolution}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Active Operator Role: <strong>Logistics Manager (Admin)</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close Suite
          </button>
        </div>
      </div>
    </div>
  );
};
