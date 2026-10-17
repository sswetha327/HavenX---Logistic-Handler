import React, { useState } from 'react';
import { Order, OrderStatus, Product, Customer } from '../types';
import { api } from '../api';
import {
  Package,
  Search,
  Plus,
  Play,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Warehouse,
  ShieldAlert,
  ArrowRight,
  X,
  RefreshCw,
  MapPin,
  Building2,
} from 'lucide-react';

interface Props {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  onRefreshOrders: () => void;
  onOpenInvoice: (orderId: string) => void;
  onNavigateToShipment?: (orderId: string) => void;
}

export const OrdersView: React.FC<Props> = ({
  orders,
  products,
  customers,
  onRefreshOrders,
  onOpenInvoice,
  onNavigateToShipment,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New order form state
  const [newCustId, setNewCustId] = useState(customers[0]?.id || 'CUST-IN-101');
  const [newProdId, setNewProdId] = useState(products[0]?.id || 'PROD-01');
  const [newQty, setNewQty] = useState(2);
  const [newPriority, setNewPriority] = useState<'STANDARD' | 'EXPEDITED' | 'URGENT'>('STANDARD');
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [customCity, setCustomCity] = useState('Bengaluru');
  const [customState, setCustomState] = useState('Karnataka');
  const [customPincode, setCustomPincode] = useState('560100');
  const [customAddress, setCustomAddress] = useState('Plot 42, Electronic City Phase 1');

  const indianCities = [
    { city: 'Bengaluru', state: 'Karnataka', pin: '560100', zone: 'South' },
    { city: 'Mumbai', state: 'Maharashtra', pin: '400051', zone: 'West' },
    { city: 'New Delhi', state: 'Delhi', pin: '110001', zone: 'North' },
    { city: 'Hyderabad', state: 'Telangana', pin: '500081', zone: 'Central' },
    { city: 'Chennai', state: 'Tamil Nadu', pin: '600006', zone: 'South' },
    { city: 'Kolkata', state: 'West Bengal', pin: '700071', zone: 'East' },
    { city: 'Pune', state: 'Maharashtra', pin: '411028', zone: 'West' },
    { city: 'Ahmedabad', state: 'Gujarat', pin: '380054', zone: 'West' },
    { city: 'Jaipur', state: 'Rajasthan', pin: '302015', zone: 'North' },
    { city: 'Gurugram', state: 'Haryana', pin: '122002', zone: 'North' },
    { city: 'Noida', state: 'Uttar Pradesh', pin: '201303', zone: 'North' },
    { city: 'Coimbatore', state: 'Tamil Nadu', pin: '641021', zone: 'South' },
    { city: 'Nagpur', state: 'Maharashtra', pin: '440010', zone: 'Central' },
    { city: 'Indore', state: 'Madhya Pradesh', pin: '454775', zone: 'Central' },
    { city: 'Chandigarh', state: 'Punjab', pin: '160101', zone: 'North' },
    { city: 'Thiruvananthapuram', state: 'Kerala', pin: '695014', zone: 'South' },
  ];

  const getOrderZone = (state: string): string => {
    if (['Delhi', 'Haryana', 'Punjab', 'Rajasthan', 'Uttar Pradesh'].includes(state)) return 'North';
    if (['Maharashtra', 'Gujarat', 'Goa'].includes(state)) return 'West';
    if (['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh'].includes(state)) return 'South';
    if (['West Bengal', 'Odisha', 'Bihar', 'Assam'].includes(state)) return 'East';
    if (['Telangana', 'Madhya Pradesh', 'Chhattisgarh'].includes(state)) return 'Central';
    return 'Other';
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const orderZone = getOrderZone(o.delivery_state);
    const matchesZone = zoneFilter === 'ALL' || orderZone === zoneFilter;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.delivery_city.toLowerCase().includes(q) ||
      o.delivery_state.toLowerCase().includes(q) ||
      (o.delivery_pincode && o.delivery_pincode.includes(q)) ||
      (o.tracking_id && o.tracking_id.toLowerCase().includes(q));
    return matchesStatus && matchesZone && matchesSearch;
  });

  const handleProcessOrder = async (orderId: string) => {
    setIsProcessing(true);
    setProcessingResult(null);
    try {
      const res = await api.processOrder(orderId);
      setProcessingResult(res);
      onRefreshOrders();
      const updated = await api.getOrder(orderId);
      setSelectedOrder(updated.order);
    } catch (err: any) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        customer_id: newCustId,
        items: [{ product_id: newProdId, quantity: Number(newQty) }],
        priority: newPriority,
      };

      if (useCustomLocation) {
        payload.delivery_city = customCity;
        payload.delivery_state = customState;
        payload.delivery_pincode = customPincode;
        payload.delivery_address = customAddress;
      }

      const created = await api.createOrder(payload);
      setShowCreateModal(false);
      onRefreshOrders();
      setSelectedOrder(created);
    } catch (err: any) {
      alert(`Failed to create order: ${err.message}`);
    }
  };

  const statusCategories: { label: string; value: string }[] = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Received / Intake', value: 'ORDER_RECEIVED' },
    { label: 'Validated', value: 'VALIDATED' },
    { label: 'Warehouse Assigned', value: 'WAREHOUSE_ASSIGNED' },
    { label: 'In Transit', value: 'IN_TRANSIT' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Delayed (Bottleneck)', value: 'DELAYED' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
  ];

  const zoneCategories = ['ALL', 'North', 'West', 'South', 'East', 'Central'];

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <h2 className="font-bold text-base text-slate-900">Domestic Orders Management</h2>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              India Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer purchase orders with GST validation, multi-hub inventory allocation, and real-time transit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Place New Indian Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Status Pills */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {statusCategories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setStatusFilter(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === cat.value
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by city, customer, PIN..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Regional Zone Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            Filter by India Zone:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {zoneCategories.map(zone => (
              <button
                key={zone}
                onClick={() => setZoneFilter(zone)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  zoneFilter === zone
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {zone === 'ALL' ? 'All Regions' : `${zone} India`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination (India)</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Fulfillment Hub & Carrier</th>
                <th className="py-3 px-4">Total Amount (INR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isDelayed = order.status === 'DELAYED';
                  const isDelivered = order.status === 'DELIVERED';
                  const isReceived = order.status === 'ORDER_RECEIVED' || order.status === 'VALIDATED';
                  const totalAmt = order.total_amount_inr || (order as any).total_amount || 0;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedOrder?.id === order.id ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">{order.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{order.items.length} item(s)</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{order.delivery_city}, {order.delivery_state}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          PIN {order.delivery_pincode || (order as any).delivery_zip || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-slate-600">
                        <div>{order.assigned_warehouse_name || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {order.assigned_carrier_name || 'No carrier'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            isDelayed
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isReceived
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-mono">{selectedOrder.id}</h3>
                  <p className="text-xs text-slate-400">
                    Customer: {selectedOrder.customer_name} • Placed:{' '}
                    {new Date(selectedOrder.order_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Status and Action banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Workflow Stage
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">{selectedOrder.status}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      (Priority: {selectedOrder.priority})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleProcessOrder(selectedOrder.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running Multi-Agent Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Agent Orchestration</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenInvoice(selectedOrder.id)}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>GST Invoice PDF</span>
                  </button>
                </div>
              </div>

              {/* Step-by-step pipeline results if recently processed */}
              {processingResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{processingResult.message}</span>
                  </div>
                  <div className="space-y-1 text-xs text-emerald-800">
                    {processingResult.steps.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">{s.agent}:</strong> {s.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line items */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                  Line Items & Domestic Pricing
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, idx) => {
                        const unitRate = item.unit_price_inr || (item as any).unit_price || 0;
                        const lineTotal = item.total_price_inr || (item as any).total_price || 0;
                        return (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{item.product_name}</td>
                            <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">₹{unitRate.toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery and logistics details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Delivery Destination (India)
                  </span>
                  <p className="font-semibold text-slate-800">{selectedOrder.customer_name}</p>
                  <p className="text-slate-600">{selectedOrder.delivery_address}</p>
                  <p className="text-slate-700 font-medium">
                    {selectedOrder.delivery_city}, {selectedOrder.delivery_state} - PIN {selectedOrder.delivery_pincode || (selectedOrder as any).delivery_zip}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    Assigned Logistics Hub & Carrier
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedOrder.assigned_warehouse_name || 'Pending warehouse assignment'}
                  </p>
                  <p className="text-slate-600 font-mono text-[11px]">
                    Carrier: {selectedOrder.assigned_carrier_name || 'Pending routing'}
                  </p>
                  {selectedOrder.tracking_id && (
                    <p className="text-indigo-600 font-mono font-bold">
                      Tracking: {selectedOrder.tracking_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Tax & Grand Total */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div className="space-y-0.5 text-slate-500">
                  <div>Tax: 18% GST (CGST + SGST or IGST)</div>
                  <div>Domestic Freight: ₹{selectedOrder.shipping_cost_inr || 350}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payable</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{(selectedOrder.total_amount_inr || (selectedOrder as any).total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Risk Score */}
              {selectedOrder.risk_score !== undefined && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Customer Behavioral Risk Vector
                    </span>
                    <span className="font-semibold text-slate-800">
                      Score: {selectedOrder.risk_score}/100 ({selectedOrder.risk_level || 'LOW'} Risk Level)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      selectedOrder.risk_level === 'HIGH'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedOrder.risk_level === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedOrder.risk_level || 'LOW'} RISK
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place New Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🇮🇳</span>
                <h3 className="font-bold text-base">Create Domestic Indian Purchase Order</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Enterprise Customer</label>
                <select
                  value={newCustId}
                  onChange={e => {
                    setNewCustId(e.target.value);
                    const selected = customers.find(c => c.id === e.target.value);
                    if (selected) {
                      setCustomCity(selected.city);
                      setCustomState(selected.state);
                      setCustomPincode(selected.pincode);
                      setCustomAddress(selected.address);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city}, {c.state}) - PIN {c.pincode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Destination Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Specify Custom Indian City / PIN</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomLocation}
                      onChange={e => setUseCustomLocation(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {useCustomLocation && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Pick Destination Metro</label>
                      <select
                        value={customCity}
                        onChange={e => {
                          const item = indianCities.find(ic => ic.city === e.target.value);
                          if (item) {
                            setCustomCity(item.city);
                            setCustomState(item.state);
                            setCustomPincode(item.pin);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                      >
                        {indianCities.map(ic => (
                          <option key={ic.city} value={ic.city}>
                            {ic.city}, {ic.state} (PIN {ic.pin}) - {ic.zone} Zone
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">State</label>
                        <input
                          type="text"
                          value={customState}
                          onChange={e => setCustomState(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">6-Digit Pincode</label>
                        <input
                          type="text"
                          value={customPincode}
                          onChange={e => setCustomPincode(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Street Address</label>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={e => setCustomAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Product</label>
                <select
                  value={newProdId}
                  onChange={e => setNewProdId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{(p.price_inr || (p as any).price || 0).toLocaleString('en-IN')} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newQty}
                    onChange={e => setNewQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Priority SLA</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="STANDARD">STANDARD (Surface Ground)</option>
                    <option value="EXPEDITED">EXPEDITED (FastTrack Linehaul)</option>
                    <option value="URGENT">URGENT (Blue Dart Air Apex)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Confirm & Route to Agents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
