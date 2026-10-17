import React, { useState } from 'react';
import { Warehouse, Shipment, Order } from '../types';
import {
  MapPin,
  Truck,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface Props {
  warehouses: Warehouse[];
  shipments: Shipment[];
  orders: Order[];
  onSelectRegion?: (zone: string) => void;
  onNavigateToShipments?: () => void;
}

interface CityNode {
  name: string;
  state: string;
  zone: 'North' | 'West' | 'South' | 'East' | 'Central';
  x: number; // percentage in SVG (0 to 100)
  y: number; // percentage in SVG (0 to 100)
  isHub?: boolean;
  hubId?: string;
}

export const IndiaLogisticsMap: React.FC<Props> = ({
  warehouses,
  shipments,
  orders,
  onSelectRegion,
  onNavigateToShipments,
}) => {
  const [selectedNode, setSelectedNode] = useState<CityNode | null>(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>('ALL');

  // Strategic nodes positioned across India
  const nodes: CityNode[] = [
    // 5 Mega Regional Fulfillment Hubs
    { name: 'Delhi-NCR (Gurugram)', state: 'Haryana', zone: 'North', x: 38, y: 28, isHub: true, hubId: 'WH-DEL-01' },
    { name: 'Mumbai (Bhiwandi)', state: 'Maharashtra', zone: 'West', x: 26, y: 55, isHub: true, hubId: 'WH-BOM-02' },
    { name: 'Bengaluru (Hosur)', state: 'Karnataka', zone: 'South', x: 42, y: 77, isHub: true, hubId: 'WH-BLR-03' },
    { name: 'Kolkata (Dankuni)', state: 'West Bengal', zone: 'East', x: 74, y: 46, isHub: true, hubId: 'WH-CCU-04' },
    { name: 'Hyderabad (Shamshabad)', state: 'Telangana', zone: 'Central', x: 45, y: 62, isHub: true, hubId: 'WH-HYD-05' },

    // Major Delivery Metro & Industrial Clusters
    { name: 'New Delhi', state: 'Delhi', zone: 'North', x: 39, y: 26 },
    { name: 'Noida', state: 'Uttar Pradesh', zone: 'North', x: 42, y: 27 },
    { name: 'Chandigarh', state: 'Punjab', zone: 'North', x: 37, y: 20 },
    { name: 'Jaipur', state: 'Rajasthan', zone: 'North', x: 34, y: 32 },
    { name: 'Pune', state: 'Maharashtra', zone: 'West', x: 28, y: 58 },
    { name: 'Ahmedabad', state: 'Gujarat', zone: 'West', x: 23, y: 43 },
    { name: 'Nagpur', state: 'Maharashtra', zone: 'Central', x: 46, y: 50 },
    { name: 'Indore', state: 'Madhya Pradesh', zone: 'Central', x: 36, y: 46 },
    { name: 'Chennai', state: 'Tamil Nadu', zone: 'South', x: 50, y: 76 },
    { name: 'Coimbatore', state: 'Tamil Nadu', zone: 'South', x: 41, y: 83 },
    { name: 'Thiruvananthapuram', state: 'Kerala', zone: 'South', x: 39, y: 92 },
  ];

  // Active transit routes between Hubs and Delivery points
  const corridorRoutes = [
    { from: 'Mumbai (Bhiwandi)', to: 'Pune', hasBottleneck: true, bottleneckDesc: 'NH48 Landslide & Surface Vehicle Break (Delayed)' },
    { from: 'Mumbai (Bhiwandi)', to: 'Ahmedabad', hasBottleneck: false },
    { from: 'Mumbai (Bhiwandi)', to: 'Bengaluru (Hosur)', hasBottleneck: false },
    { from: 'Delhi-NCR (Gurugram)', to: 'Jaipur', hasBottleneck: false },
    { from: 'Delhi-NCR (Gurugram)', to: 'Chandigarh', hasBottleneck: false },
    { from: 'Delhi-NCR (Gurugram)', to: 'Noida', hasBottleneck: false },
    { from: 'Hyderabad (Shamshabad)', to: 'Bengaluru (Hosur)', hasBottleneck: false },
    { from: 'Bengaluru (Hosur)', to: 'Chennai', hasBottleneck: false },
    { from: 'Bengaluru (Hosur)', to: 'Coimbatore', hasBottleneck: false },
    { from: 'Kolkata (Dankuni)', to: 'Hyderabad (Shamshabad)', hasBottleneck: false },
    { from: 'Hyderabad (Shamshabad)', to: 'Nagpur', hasBottleneck: false },
  ];

  const filteredNodes = activeZoneFilter === 'ALL'
    ? nodes
    : nodes.filter(n => n.zone === activeZoneFilter);

  const selectedWh = selectedNode?.isHub
    ? warehouses.find(w => w.id === selectedNode.hubId)
    : null;

  const nodeOrders = selectedNode
    ? orders.filter(o => o.delivery_city.toLowerCase().includes(selectedNode.name.split(' ')[0].toLowerCase()))
    : [];

  const delayedShipmentsCount = shipments.filter(s => s.status === 'DELAYED').length;

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-5 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🇮🇳</span>
            <h3 className="font-bold text-base text-white">
              Pan-India Autonomous Logistics Routing Network
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
              Live Regional Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            5 Regional Mega Depots • Inter-State GST Transit Corridors • Real-Time Bottleneck Detection
          </p>
        </div>

        {/* Zone Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'North', 'West', 'South', 'East', 'Central'].map(zone => (
            <button
              key={zone}
              onClick={() => {
                setActiveZoneFilter(zone);
                if (onSelectRegion && zone !== 'ALL') onSelectRegion(zone);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeZoneFilter === zone
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {zone === 'ALL' ? 'All India' : `${zone} Zone`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map & Node Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SVG Interactive Map (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 relative min-h-[380px] flex items-center justify-center overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />

          {/* Map Graphic Canvas */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full max-h-[360px] relative z-10 select-none"
          >
            {/* Soft Outline of India subcontinent geometry */}
            <path
              d="M 37 12 L 44 16 L 40 23 L 47 24 L 56 30 L 72 35 L 82 35 L 85 41 L 76 45 L 72 52 L 60 55 L 53 74 L 46 88 L 38 94 L 35 83 L 30 68 L 22 55 L 18 42 L 24 35 L 29 25 L 35 15 Z"
              fill="rgba(30, 41, 59, 0.45)"
              stroke="#334155"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />

            {/* Connecting Corridor Lines */}
            {corridorRoutes.map((cr, idx) => {
              const fromNode = nodes.find(n => n.name === cr.from);
              const toNode = nodes.find(n => n.name === cr.to);
              if (!fromNode || !toNode) return null;

              return (
                <g key={idx}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={cr.hasBottleneck ? '#f43f5e' : '#6366f1'}
                    strokeWidth={cr.hasBottleneck ? '1.5' : '0.9'}
                    strokeDasharray={cr.hasBottleneck ? '2,2' : 'none'}
                    opacity={cr.hasBottleneck ? 0.9 : 0.45}
                  />
                  {cr.hasBottleneck && (
                    <circle
                      cx={(fromNode.x + toNode.x) / 2}
                      cy={(fromNode.y + toNode.y) / 2}
                      r="2"
                      fill="#f43f5e"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.name === node.name;
              const isDelayedTarget = node.name.includes('Pune');

              return (
                <g
                  key={node.name}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse for Hubs */}
                  {node.isHub && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? '6' : '4.5'}
                      fill="rgba(99, 102, 241, 0.2)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.isHub ? '3' : '2'}
                    fill={
                      isDelayedTarget
                        ? '#f43f5e'
                        : node.isHub
                        ? '#818cf8'
                        : isSelected
                        ? '#38bdf8'
                        : '#94a3b8'
                    }
                    stroke={isSelected ? '#ffffff' : '#0f172a'}
                    strokeWidth="0.8"
                  />

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y - (node.isHub ? 4.5 : 3)}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : node.isHub ? '#c7d2fe' : '#94a3b8'}
                    fontSize={node.isHub ? '3.2' : '2.6'}
                    fontWeight={node.isHub ? 'bold' : 'normal'}
                    className="transition-all"
                  >
                    {node.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Floating Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-800 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              <span>5 Strategic Mega Depots (Hubs)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span>Consumer Delivery Metros</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>NH48 Bottleneck (Pune Corridor)</span>
            </div>
          </div>
        </div>

        {/* Selected Hub / City Details (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/60 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 tracking-wider">
                  {selectedNode?.zone || 'National'} Zone Telemetry
                </span>
                <h4 className="font-bold text-lg text-white">
                  {selectedNode ? selectedNode.name : 'Select Any Hub or City'}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedNode
                    ? `${selectedNode.state}, India • ${selectedNode.isHub ? 'Regional Mega Depository' : 'Consumer Node'}`
                    : 'Click any node on the India map to inspect warehouse capacity, delivery SLA, and active linehaul trucks.'}
                </p>
              </div>

              {selectedNode?.isHub && (
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Warehouse stats if Hub is selected */}
            {selectedWh ? (
              <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Hub Code</span>
                  <span className="font-mono font-bold text-indigo-300">{selectedWh.code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Capacity Utilization</span>
                  <span className="font-bold text-emerald-400">{selectedWh.utilization_pct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                    style={{ width: `${selectedWh.utilization_pct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>Warehouse Area: {Math.round(selectedWh.capacity_sqft / 1000)}k sq.ft</span>
                  <span>Handling: ₹{selectedWh.handling_cost_per_item}/item</span>
                </div>
              </div>
            ) : selectedNode ? (
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Navigation className="w-4 h-4 text-indigo-400" />
                  <span>Consumer Delivery Destination</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Fulfillment routed automatically from nearest regional depot based on stock availability and lowest transit cost.
                </p>
                <div className="text-slate-300 font-medium">
                  {nodeOrders.length} active customer order(s) routed to this city.
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500 space-y-2">
                <Truck className="w-6 h-6 text-slate-600 mx-auto" />
                <p>Click on Delhi-NCR, Mumbai, Bengaluru, Kolkata, or Hyderabad to inspect agent allocations.</p>
              </div>
            )}

            {/* Bottleneck Warning */}
            {selectedNode?.name.includes('Pune') && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>NH48 Bottleneck Detected (+36h Delay)</span>
                </div>
                <p className="text-[11px] text-rose-300">
                  Surface freight transport halted. Self-Healing Exception Agent has prepared recovery plan reassigning parcel to Blue Dart Air.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs mt-3">
            <span className="text-slate-400 text-[11px]">
              {delayedShipmentsCount > 0 ? `${delayedShipmentsCount} delayed consignment(s)` : 'All carriers on schedule'}
            </span>
            {onNavigateToShipments && (
              <button
                onClick={onNavigateToShipments}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Track Shipments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
