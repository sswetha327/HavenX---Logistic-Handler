import React, { useState, useEffect } from 'react';
import { api } from './api';
import {
  Order,
  Shipment,
  Incident,
  Product,
  Customer,
  Warehouse,
  Invoice,
  DashboardMetrics,
  SystemSettings,
} from './types';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { DemoScenarioModal } from './components/DemoScenarioModal';
import { AiChatDrawer } from './components/AiChatDrawer';
import { InvoicePdfModal } from './components/InvoicePdfModal';

// Views
import { DashboardView } from './views/DashboardView';
import { AgentGraphView } from './views/AgentGraphView';
import { OrdersView } from './views/OrdersView';
import { InventoryView } from './views/InventoryView';
import { ShipmentsView } from './views/ShipmentsView';
import { SelfHealingView } from './views/SelfHealingView';
import { RiskReturnsView } from './views/RiskReturnsView';
import { InvoicesView } from './views/InvoicesView';
import { FeedbackView } from './views/FeedbackView';
import { MultimodalView } from './views/MultimodalView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Modals
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pdfInvoiceTarget, setPdfInvoiceTarget] = useState<Invoice | null>(null);

  const fetchCoreData = async () => {
    try {
      const [m, ords, shps, incData, prods, custs, whs, sett] = await Promise.all([
        api.getMetrics(),
        api.getOrders(),
        api.getShipments(),
        api.getIncidents(),
        api.getProducts(),
        api.getCustomers(),
        api.getWarehouses(),
        api.getSettings(),
      ]);
      setMetrics(m);
      setOrders(ords);
      setShipments(shps);
      setIncidents(incData.incidents);
      setProducts(prods);
      setCustomers(custs);
      setWarehouses(whs);
      setSettings(sett);
    } catch (err) {
      console.error('Failed to load initial logistics data:', err);
    }
  };

  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(fetchCoreData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInvoiceById = async (orderId: string) => {
    try {
      const inv = await api.getInvoice(orderId);
      if (inv) {
        setPdfInvoiceTarget(inv);
      } else {
        alert(`No invoice generated yet for ${orderId}. Processing the order will generate an invoice.`);
      }
    } catch (e: any) {
      alert(`Invoice lookup failed: ${e.message}`);
    }
  };

  const openIncidentsCount = incidents.filter(i => i.status === 'OPEN').length;
  const delayedOrdersCount = orders.filter(o => o.status === 'DELAYED').length;
  const highRiskCount = customers.filter(c => c.risk_level === 'HIGH').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onRefreshData={fetchCoreData}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          openIncidentsCount={openIncidentsCount}
          delayedOrdersCount={delayedOrdersCount}
          highRiskCount={highRiskCount}
        />

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                recentOrders={orders}
                shipments={shipments}
                incidents={incidents}
                warehouses={warehouses}
                onOpenDemo={() => setIsDemoOpen(true)}
                onNavigateToTab={setActiveTab}
                onSimulateDelay={() => setActiveTab('shipments')}
              />
            )}

            {activeTab === 'agents' && <AgentGraphView />}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                products={products}
                customers={customers}
                onRefreshOrders={fetchCoreData}
                onOpenInvoice={handleOpenInvoiceById}
                onNavigateToShipment={() => setActiveTab('shipments')}
              />
            )}

            {activeTab === 'inventory' && <InventoryView />}

            {activeTab === 'shipments' && (
              <ShipmentsView
                shipments={shipments}
                onRefreshShipments={fetchCoreData}
                onNavigateToIncidents={() => setActiveTab('incidents')}
              />
            )}

            {activeTab === 'incidents' && (
              <SelfHealingView
                onRefreshData={fetchCoreData}
                settings={settings}
              />
            )}

            {activeTab === 'risk' && <RiskReturnsView />}

            {activeTab === 'invoices' && (
              <InvoicesView onOpenPdfModal={setPdfInvoiceTarget} />
            )}

            {activeTab === 'feedback' && (
              <FeedbackView orders={orders} onRefreshData={fetchCoreData} />
            )}

            {activeTab === 'multimodal' && (
              <MultimodalView
                products={products}
                customers={customers}
                onOrderCreated={() => {
                  fetchCoreData();
                  setActiveTab('orders');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* 21-Step Simulation Player Modal */}
      <DemoScenarioModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onCompleted={fetchCoreData}
      />

      {/* Conversational AI Drawer */}
      <AiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNavigateToTab={(tab: string) => setActiveTab(tab as TabId)}
      />

      {/* Downloadable PDF Invoice Modal */}
      <InvoicePdfModal
        invoice={pdfInvoiceTarget}
        onClose={() => setPdfInvoiceTarget(null)}
      />
    </div>
  );
}
