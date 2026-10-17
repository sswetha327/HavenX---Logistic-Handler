import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getDb,
  saveDb,
  resetDbToSeed,
} from './server/db';
import {
  get_orders,
  get_order,
  create_order,
  update_order,
  get_inventory,
  check_inventory,
  reserve_inventory,
  get_warehouses,
  find_best_warehouse,
  get_carriers,
  compare_carriers,
  create_shipment,
  update_shipment_status,
  simulate_carrier_delay,
  detect_delayed_orders,
  generate_recovery_plan,
  execute_recovery_plan,
  calculate_risk_score,
  create_return,
  process_return,
  generate_invoice,
  get_invoice,
  record_feedback,
  get_historical_performance,
} from './server/tools';
import { LogisticsSupervisor } from './server/orchestrator';
import { handleLogisticsChat, extractOrderFromDocument } from './server/gemini';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize DB on boot
getDb();

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health & Dashboard Metrics
app.get('/api/health', (req, res) => {
  const db = getDb();
  res.json({
    status: 'ok',
    orders_count: db.orders.length,
    shipments_count: db.shipments.length,
    warehouses_count: db.warehouses.length,
    carriers_count: db.carriers.length,
    mode: db.settings.mode,
  });
});

app.get('/api/metrics', (req, res) => {
  try {
    const metrics = get_historical_performance();
    const db = getDb();
    res.json({
      ...metrics,
      active_shipments: db.shipments.filter(s => s.status !== 'DELIVERED').length,
      open_incidents: db.incidents.filter(i => i.status === 'OPEN').length,
      high_risk_customers: db.customers.filter(c => c.risk_level === 'HIGH').length,
      settings: db.settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Orders Endpoints
app.get('/api/orders', (req, res) => {
  const { status, search, limit } = req.query;
  const orders = get_orders({
    status: status as string,
    search: search as string,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = get_order(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const db = getDb();
  const shipment = db.shipments.find(s => s.order_id === order.id);
  const invoice = db.invoices.find(i => i.order_id === order.id);
  const incident = db.incidents.find(i => i.order_id === order.id && i.status === 'OPEN');
  res.json({ order, shipment, invoice, incident });
});

app.post('/api/orders', (req, res) => {
  try {
    const newOrder = create_order(req.body);
    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/orders/:id', (req, res) => {
  try {
    const updated = update_order(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Trigger Supervisor Workflow Pipeline for an order
app.post('/api/orders/:id/process', async (req, res) => {
  try {
    const result = await LogisticsSupervisor.processOrder(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Inventory & Warehouses
app.get('/api/inventory', (req, res) => {
  const { product_id } = req.query;
  const inv = get_inventory(product_id as string);
  res.json(inv);
});

app.post('/api/inventory/check', (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const result = check_inventory(product_id, quantity);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/inventory/reserve', (req, res) => {
  try {
    const { product_id, warehouse_id, quantity } = req.body;
    const result = reserve_inventory(product_id, warehouse_id, quantity);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/warehouses', (req, res) => {
  res.json(get_warehouses());
});

app.get('/api/warehouses/optimize/:orderId', (req, res) => {
  try {
    const result = find_best_warehouse(req.params.orderId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Carriers & Shipments
app.get('/api/carriers', (req, res) => {
  res.json(get_carriers());
});

app.get('/api/carriers/compare/:orderId', (req, res) => {
  try {
    const result = compare_carriers(req.params.orderId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/shipments', (req, res) => {
  const db = getDb();
  res.json(db.shipments);
});

app.get('/api/shipments/:id', (req, res) => {
  const db = getDb();
  const shipment = db.shipments.find(s => s.id === req.params.id || s.order_id === req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  res.json(shipment);
});

app.post('/api/shipments', (req, res) => {
  try {
    const { order_id, warehouse_id, carrier_id } = req.body;
    const shipment = create_shipment(order_id, warehouse_id, carrier_id);
    res.status(201).json(shipment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/shipments/:id/status', (req, res) => {
  try {
    const { status, location, description } = req.body;
    const shipment = update_shipment_status(req.params.id, status, location, description);
    res.json(shipment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/shipments/:id/simulate-delay', (req, res) => {
  try {
    const { delay_hours, reason } = req.body;
    const result = simulate_carrier_delay(req.params.id, delay_hours, reason);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Exception & Self-Healing Incidents
app.get('/api/incidents', (req, res) => {
  const db = getDb();
  res.json({
    incidents: db.incidents,
    recovery_plans: db.recovery_plans,
    delayed_orders: detect_delayed_orders(),
  });
});

app.post('/api/incidents/:id/recovery-plan', (req, res) => {
  try {
    const plan = generate_recovery_plan(req.params.id);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/recovery-plans/:id/execute', (req, res) => {
  try {
    const { approved_by } = req.body;
    const result = execute_recovery_plan(req.params.id, approved_by || 'Logistics Operations Manager');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Risk Scoring & Returns
app.get('/api/customers', (req, res) => {
  const db = getDb();
  res.json(db.customers);
});

app.get('/api/risk/:customerId', (req, res) => {
  try {
    const { order_id } = req.query;
    const risk = calculate_risk_score(req.params.customerId, order_id as string);
    res.json(risk);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/returns', (req, res) => {
  const db = getDb();
  res.json(db.returns);
});

app.post('/api/returns', (req, res) => {
  try {
    const newReturn = create_return(req.body);
    res.status(201).json(newReturn);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/returns/:id/process', (req, res) => {
  try {
    const { decision, notes } = req.body;
    const ret = process_return(req.params.id, decision, notes);
    res.json(ret);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Invoices
app.get('/api/invoices', (req, res) => {
  const db = getDb();
  res.json(db.invoices);
});

app.get('/api/invoices/:query', (req, res) => {
  const invoice = get_invoice(req.params.query);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

app.post('/api/invoices/generate/:orderId', (req, res) => {
  try {
    const invoice = generate_invoice(req.params.orderId);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Feedback & Historical Learning
app.get('/api/feedback', (req, res) => {
  const db = getDb();
  res.json({
    feedback: db.feedback,
    carrier_offsets: db.carrier_learned_offsets,
  });
});

app.post('/api/feedback', (req, res) => {
  try {
    const record = record_feedback(req.body);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Products & Catalog
app.get('/api/products', (req, res) => {
  const db = getDb();
  res.json(db.products);
});

// 10. Audit Logs & Notifications
app.get('/api/audit-logs', (req, res) => {
  const db = getDb();
  res.json(db.audit_logs);
});

app.get('/api/notifications', (req, res) => {
  const db = getDb();
  res.json(db.notifications);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const db = getDb();
  const n = db.notifications.find(x => x.id === req.params.id);
  if (n) {
    n.read = true;
    saveDb();
  }
  res.json({ success: true });
});

// 11. System Settings (Assisted vs Autonomous Mode)
app.get('/api/settings', (req, res) => {
  const db = getDb();
  res.json(db.settings);
});

app.patch('/api/settings', (req, res) => {
  const db = getDb();
  Object.assign(db.settings, req.body);
  saveDb();
  res.json(db.settings);
});

// 12. Full 21-Step Simulation Runner
app.post('/api/scenario/run-complete-demo', async (req, res) => {
  try {
    const result = await LogisticsSupervisor.runCompleteDemoScenario();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Conversational AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const response = await handleLogisticsChat(prompt, history);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Multimodal PO Document Extraction
app.post('/api/multimodal/extract-order', async (req, res) => {
  try {
    const { text_content, image_base64, mime_type } = req.body;
    const extracted = await extractOrderFromDocument({
      text_content,
      image_base64,
      mime_type,
    });
    res.json(extracted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Database Reset
app.post('/api/db/reset', (req, res) => {
  const fresh = resetDbToSeed();
  res.json({ success: true, orders_count: fresh.orders.length });
});

// ----------------------------------------------------
// VITE INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Logistics Handler Agent server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
