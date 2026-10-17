import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { InventoryItem, Warehouse, Product } from '../types';
import {
  Warehouse as WarehouseIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Box,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');

  // Interactive Stock Checker tool
  const [testProdId, setTestProdId] = useState<string>('');
  const [testQty, setTestQty] = useState<number>(50);
  const [testResult, setTestResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [w, inv, p] = await Promise.all([
        api.getWarehouses(),
        api.getInventory(),
        api.getProducts(),
      ]);
      setWarehouses(w);
      setInventory(inv);
      setProducts(p);
      if (p.length > 0 && !testProdId) {
        setTestProdId(p[0].id);
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

  const handleRunStockCheck = async () => {
    if (!testProdId) return;
    setIsChecking(true);
    try {
      const res = await api.checkInventory(testProdId, testQty);
      setTestResult(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsChecking(false);
    }
  };

  const filteredInventory = inventory.filter(i => {
    const matchesWh = selectedWarehouseFilter === 'ALL' || i.warehouse_id === selectedWarehouseFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      i.product_name.toLowerCase().includes(q) ||
      i.product_sku.toLowerCase().includes(q) ||
      i.warehouse_name.toLowerCase().includes(q);
    return matchesWh && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-base text-slate-900">Inventory & Fulfillment Hubs</h2>
          <p className="text-xs text-slate-500">
            Real-time multi-warehouse stock availability, reservations, and split-fulfillment optimizer.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors self-end sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 5 Regional Fulfillment Centers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {warehouses.map(wh => {
          const isHighUtil = wh.utilization_pct > 85;
          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWarehouseFilter(wh.id === selectedWarehouseFilter ? 'ALL' : wh.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedWarehouseFilter === wh.id
                  ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              } shadow-2xs`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md">
                  {wh.code}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    wh.operational_status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {wh.operational_status}
                </span>
              </div>

              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{wh.name}</h4>
              <p className="text-[11px] text-slate-500">{wh.city}, {wh.state}</p>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Capacity</span>
                  <span className="font-semibold text-slate-800">{wh.utilization_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isHighUtil ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${wh.utilization_pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
                <span>Rate: ₹{wh.handling_cost_per_item}/item</span>
                <span>{Math.round(wh.capacity_sqft / 1000)}k sqft</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Inventory Agent Reasoning Simulator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm">Inventory Agent: Real-Time Availability & Routing Simulator</h3>
        </div>
        <p className="text-xs text-slate-300 mb-4 max-w-2xl">
          Test how the Inventory Agent reasons across 5 warehouses. Enter any SKU and requested quantity to evaluate single-hub fulfillment vs split-distribution logic.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Select Product</label>
            <select
              value={testProdId}
              onChange={e => setTestProdId(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {products.map(p => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Required Quantity</label>
            <input
              type="number"
              min="1"
              max="500"
              value={testQty}
              onChange={e => setTestQty(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunStockCheck}
              disabled={isChecking}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Run Stock Verification</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">{testResult.product_name}</span>
                <span className="text-slate-300 font-mono ml-2">({testResult.sku})</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  testResult.can_fulfill_single_warehouse
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : testResult.can_fulfill_across_warehouses
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {testResult.can_fulfill_single_warehouse
                  ? 'Fulfillable by Single Hub'
                  : testResult.can_fulfill_across_warehouses
                  ? 'Split-Fulfillment Required'
                  : 'Out of Stock Alert'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
              {testResult.breakdown.map((b: any, bIdx: number) => (
                <div key={bIdx} className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block text-[10px] truncate">{b.warehouse_name}</span>
                  <span className="font-bold text-white text-sm">{b.available}</span>
                  <span className="text-[10px] block text-slate-400">available</span>
                  <span
                    className={`text-[9px] font-semibold mt-1 block ${
                      b.can_fulfill_fully ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {b.can_fulfill_fully ? 'Full stock' : 'Partial'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inventory Search & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">SKU Inventory Distribution Ledger</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredInventory.length} records. Filtered by{' '}
              {selectedWarehouseFilter === 'ALL' ? 'All Hubs' : selectedWarehouseFilter}.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product or SKU..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Product Name & Category</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Fulfillment Center</th>
                <th className="py-2.5 px-3 text-center">Available Stock</th>
                <th className="py-2.5 px-3 text-center">Reserved Units</th>
                <th className="py-2.5 px-3 text-center">Incoming PO</th>
                <th className="py-2.5 px-3">Inventory Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.slice(0, 25).map(item => {
                const isLow = item.quantity_available <= item.reorder_point;
                const isZero = item.quantity_available === 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400">{item.product_category}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{item.product_sku}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{item.warehouse_name}</div>
                      <div className="text-[10px] text-slate-400">{item.warehouse_city}, {item.warehouse_state}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity_available}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity_reserved}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-medium">+{item.quantity_incoming}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isZero
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isZero ? 'Out of Stock' : isLow ? 'Reorder Alert' : 'Healthy'}
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
