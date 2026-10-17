import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { api } from '../api';
import {
  Truck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  MapPin,
  X,
  Play,
  RefreshCw,
} from 'lucide-react';

interface Props {
  shipments: Shipment[];
  onRefreshShipments: () => void;
  onNavigateToIncidents: () => void;
}

export const ShipmentsView: React.FC<Props> = ({
  shipments,
  onRefreshShipments,
  onNavigateToIncidents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Delay simulation modal state
  const [delayShipmentTarget, setDelayShipmentTarget] = useState<Shipment | null>(null);
  const [delayHours, setDelayHours] = useState(36);
  const [delayReason, setDelayReason] = useState('Carrier regional terminal sorting malfunction and highway closure');

  const filtered = shipments.filter(s => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      s.tracking_id.toLowerCase().includes(q) ||
      s.order_id.toLowerCase().includes(q) ||
      s.carrier_name.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleTriggerDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayShipmentTarget) return;
    setIsSimulating(true);
    try {
      await api.simulateDelay(delayShipmentTarget.id, delayHours, delayReason);
      setDelayShipmentTarget(null);
      onRefreshShipments();
      // Re-fetch updated shipment details
      const updated = await api.getShipment(delayShipmentTarget.id);
      setSelectedShipment(updated);
      alert(`Carrier delay injected! Exception Agent has detected SLA breach and prepared a Self-Healing Recovery Plan.`);
    } catch (err: any) {
      alert(`Error injecting delay: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpdateStatus = async (shipmentId: string, nextStatus: ShipmentStatus) => {
    try {
      await fetch(`/api/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, description: `Manual carrier telemetry update: ${nextStatus}` }),
      });
      onRefreshShipments();
      const updated = await api.getShipment(shipmentId);
      setSelectedShipment(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-base text-slate-900">Shipments & Carrier Dispatch</h2>
          <p className="text-xs text-slate-500">
            Real-time package manifests, transit telemetry events, and carrier exception testing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {shipments.some(s => s.status === 'DELAYED') && (
            <button
              onClick={onNavigateToIncidents}
              className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Review Delayed Shipments in Self-Healing Engine →</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'READY_TO_DISPATCH'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search tracking, carrier, destination..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Shipments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const isDelayed = s.status === 'DELAYED';
          const isDelivered = s.status === 'DELIVERED';
          const isRecovered = s.is_recovered;

          return (
            <div
              key={s.id}
              onClick={() => setSelectedShipment(s)}
              className={`bg-white rounded-2xl border p-4.5 shadow-2xs space-y-3 cursor-pointer transition-all hover:shadow-md ${
                isDelayed
                  ? 'border-rose-300 bg-rose-50/30'
                  : isRecovered
                  ? 'border-purple-300 bg-purple-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{s.carrier_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Order: {s.order_id}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDelayed
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : isDelivered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {s.status}
                </span>
              </div>

              {/* Origin to Destination Route */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Origin</span>
                  <span className="font-medium text-slate-800">{s.origin}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Destination</span>
                  <span className="font-medium text-slate-800">{s.destination}</span>
                </div>
              </div>

              {/* Tracking ID and Delay info */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Tracking:</span>
                  <span className="font-semibold text-indigo-700">{s.tracking_id}</span>
                </div>

                {isDelayed && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Delay: +{s.delay_hours || 36}h ({s.delay_reason})</span>
                  </div>
                )}

                {isRecovered && (
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 text-[11px] font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span>Self-Healing Recovered (Reassigned to {s.carrier_name})</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedShipment(s);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Telemetry ({s.events.length}) →
                </button>

                {!isDelivered && !isDelayed && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDelayShipmentTarget(s);
                    }}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Simulate Delay
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shipment Details & Timeline Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedShipment.tracking_id}</h3>
                  <p className="text-xs text-slate-400">
                    Carrier: {selectedShipment.carrier_name} • Order: {selectedShipment.order_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Quick Status Bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedShipment.status}</div>
                </div>

                {/* State Advance Buttons for manual testing */}
                <div className="flex items-center gap-1.5">
                  {selectedShipment.status === 'READY_TO_DISPATCH' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'DISPATCHED')}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                    >
                      Dispatch Truck
                    </button>
                  )}
                  {selectedShipment.status === 'DISPATCHED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'IN_TRANSIT')}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                    >
                      Set In Transit
                    </button>
                  )}
                  {selectedShipment.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'OUT_FOR_DELIVERY')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Out for Delivery
                    </button>
                  )}
                  {selectedShipment.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'DELIVERED')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                    >
                      Confirm Delivery
                    </button>
                  )}
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">
                  Telemetry Event Trail
                </h4>
                <div className="relative pl-6 space-y-4 border-l-2 border-indigo-100 ml-2">
                  {selectedShipment.events.map((evt, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div className="flex items-center justify-between text-slate-500 text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-800">{evt.status}</span>
                        <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{evt.location}</span>
                        <span>• Agent: {evt.agent}</span>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {evt.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delay Injection Modal */}
      {delayShipmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">Simulate Carrier Delay Incident</h3>
              </div>
              <button
                onClick={() => setDelayShipmentTarget(null)}
                className="text-rose-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerDelay} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Simulating a delay on <strong>{delayShipmentTarget.tracking_id}</strong> will trigger the Exception & Recovery Agent to detect the impending SLA breach, compute alternatives, and prepare an immediate Self-Healing Recovery Plan.
              </p>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Delay Duration (Hours)</label>
                <select
                  value={delayHours}
                  onChange={e => setDelayHours(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value={24}>+24 Hours Delay</option>
                  <option value={36}>+36 Hours Delay (Standard SLA breach)</option>
                  <option value={48}>+48 Hours Delay (Critical)</option>
                  <option value={72}>+72 Hours Delay (Terminal grounded)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Root Cause Description</label>
                <textarea
                  value={delayReason}
                  onChange={e => setDelayReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDelayShipmentTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Inject Delay & Trigger Recovery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
