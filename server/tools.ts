import {
  getDb,
  saveDb,
  Order,
  OrderItem,
  OrderStatus,
  Shipment,
  ShipmentEvent,
  ShipmentStatus,
  ReturnRecord,
  Invoice,
  Incident,
  RecoveryPlan,
  AuditLog,
  NotificationItem,
  FeedbackRecord,
  Carrier,
  Warehouse,
  Customer,
} from './db';

export { getDb, saveDb };
export type { Order, OrderStatus };

// Helper for unique ID generation
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}

// ----------------------------------------------------
// AUDIT LOG & NOTIFICATIONS
// ----------------------------------------------------
export function addAuditLog(
  agent_name: AuditLog['agent_name'],
  action: string,
  target_type: AuditLog['target_type'],
  target_id: string,
  details: string,
  status: AuditLog['status'] = 'SUCCESS'
): AuditLog {
  const db = getDb();
  const entry: AuditLog = {
    id: generateId('AUD-IN'),
    timestamp: new Date().toISOString(),
    agent_name,
    action,
    target_type,
    target_id,
    details,
    status,
  };
  db.audit_logs.unshift(entry);
  if (db.audit_logs.length > 500) db.audit_logs.pop();
  saveDb();
  return entry;
}

export function sendNotification(
  title: string,
  message: string,
  type: NotificationItem['type'],
  severity: NotificationItem['severity'] = 'info',
  order_id?: string
): NotificationItem {
  const db = getDb();
  const notif: NotificationItem = {
    id: generateId('NOTIF-IN'),
    title,
    message,
    type,
    severity,
    order_id,
    read: false,
    created_at: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 100) db.notifications.pop();
  saveDb();
  return notif;
}

// ----------------------------------------------------
// ORDERS TOOLKIT (INDIA LOCATIONS & INR)
// ----------------------------------------------------
export function get_orders(filters?: { status?: string; search?: string; limit?: number }) {
  const db = getDb();
  let list = [...db.orders];
  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter(o => o.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      o =>
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.delivery_city.toLowerCase().includes(q) ||
        o.delivery_state.toLowerCase().includes(q) ||
        (o.delivery_pincode && o.delivery_pincode.includes(q)) ||
        (o.tracking_id && o.tracking_id.toLowerCase().includes(q))
    );
  }
  list.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }
  return list;
}

export function get_order(order_id: string): Order | null {
  const db = getDb();
  const found = db.orders.find(o => o.id.toLowerCase() === order_id.toLowerCase());
  return found || null;
}

export function create_order(params: {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
  requested_delivery_date?: string;
  priority?: 'STANDARD' | 'EXPEDITED' | 'URGENT';
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_pincode?: string;
  notes?: string;
}): Order {
  const db = getDb();
  const customer = db.customers.find(c => c.id === params.customer_id);
  if (!customer) {
    throw new Error(`Customer with ID ${params.customer_id} not found in Indian customer database.`);
  }

  const orderNum = 1000 + db.orders.length + 1;
  const orderId = `ORD-${orderNum}`;
  const orderDate = new Date().toISOString();
  const reqDate =
    params.requested_delivery_date ||
    new Date(Date.now() + 3 * 86400000).toISOString();

  let subtotal = 0;
  const orderItems: OrderItem[] = [];

  for (let i = 0; i < params.items.length; i++) {
    const it = params.items[i];
    const prod = db.products.find(p => p.id === it.product_id);
    if (!prod) {
      throw new Error(`Product ${it.product_id} not found in catalog.`);
    }
    const totalPrice = prod.price_inr * it.quantity;
    subtotal += totalPrice;
    orderItems.push({
      id: `ITEM-${orderId}-${i + 1}`,
      order_id: orderId,
      product_id: prod.id,
      product_name: prod.name,
      quantity: it.quantity,
      unit_price_inr: prod.price_inr,
      total_price_inr: totalPrice,
    });
  }

  const shippingCost = params.priority === 'URGENT' ? 750 : params.priority === 'EXPEDITED' ? 450 : 250;
  const taxAmount = Math.round(subtotal * 0.18); // 18% GST in India
  const totalAmount = subtotal + shippingCost + taxAmount;

  const newOrder: Order = {
    id: orderId,
    customer_id: customer.id,
    customer_name: customer.name,
    order_date: orderDate,
    requested_delivery_date: reqDate,
    status: 'ORDER_RECEIVED',
    priority: params.priority || 'STANDARD',
    payment_status: 'PAID',
    subtotal_inr: subtotal,
    shipping_cost_inr: shippingCost,
    tax_inr: taxAmount,
    total_amount_inr: totalAmount,
    delivery_address: params.delivery_address || customer.address,
    delivery_city: params.delivery_city || customer.city,
    delivery_state: params.delivery_state || customer.state,
    delivery_pincode: params.delivery_pincode || customer.pincode,
    items: orderItems,
    notes: params.notes,
    risk_score: customer.risk_score,
    risk_level: customer.risk_level,
  };

  db.orders.unshift(newOrder);
  customer.order_count += 1;

  addAuditLog(
    'Order Handler Agent',
    'ORDER_CREATED',
    'ORDER',
    orderId,
    `New order registered for ${customer.name} (${customer.city}, ${customer.state}). Amount: ₹${totalAmount.toLocaleString('en-IN')}. Initial status: ORDER_RECEIVED.`,
    'SUCCESS'
  );

  sendNotification(
    `Order Created: ${orderId}`,
    `Order for ${customer.name} received (${orderItems.length} items, ₹${totalAmount.toLocaleString('en-IN')}).`,
    'ORDER',
    'info',
    orderId
  );

  saveDb();
  return newOrder;
}

export function update_order(order_id: string, updates: Partial<Order>): Order {
  const db = getDb();
  const order = db.orders.find(o => o.id === order_id);
  if (!order) throw new Error(`Order ${order_id} not found.`);

  const oldStatus = order.status;
  Object.assign(order, updates);

  if (updates.status && updates.status !== oldStatus) {
    addAuditLog(
      'Supervisor Agent',
      'ORDER_STATUS_CHANGED',
      'ORDER',
      order_id,
      `State machine transition: ${oldStatus} → ${updates.status}`,
      'SUCCESS'
    );
  }

  saveDb();
  return order;
}

// ----------------------------------------------------
// INVENTORY TOOLKIT (5 INDIAN REGIONAL HUBS)
// ----------------------------------------------------
export function get_inventory(product_id?: string) {
  const db = getDb();
  let list = db.inventory;
  if (product_id) {
    list = list.filter(inv => inv.product_id === product_id);
  }
  return list.map(inv => {
    const prod = db.products.find(p => p.id === inv.product_id);
    const wh = db.warehouses.find(w => w.id === inv.warehouse_id);
    return {
      ...inv,
      product_name: prod?.name || inv.product_id,
      product_sku: prod?.sku || '',
      product_category: prod?.category || '',
      reorder_point: prod?.reorder_point || 10,
      warehouse_name: wh?.name || inv.warehouse_id,
      warehouse_city: wh?.city || '',
      warehouse_state: wh?.state || '',
      warehouse_zone: wh?.zone || '',
    };
  });
}

export function check_inventory(product_id: string, quantity: number) {
  const db = getDb();
  const prod = db.products.find(p => p.id === product_id);
  if (!prod) throw new Error(`Product ${product_id} not found.`);

  const whRecords = db.inventory.filter(i => i.product_id === product_id);
  const totalAvailable = whRecords.reduce((sum, r) => sum + r.quantity_available, 0);
  const totalReserved = whRecords.reduce((sum, r) => sum + r.quantity_reserved, 0);
  const totalIncoming = whRecords.reduce((sum, r) => sum + r.quantity_incoming, 0);

  const breakdown = whRecords.map(r => {
    const wh = db.warehouses.find(w => w.id === r.warehouse_id);
    return {
      warehouse_id: r.warehouse_id,
      warehouse_name: wh?.name || r.warehouse_id,
      city: wh?.city || '',
      state: wh?.state || '',
      zone: wh?.zone || '',
      available: r.quantity_available,
      reserved: r.quantity_reserved,
      can_fulfill_fully: r.quantity_available >= quantity,
    };
  });

  const canFulfillSingle = breakdown.some(b => b.can_fulfill_fully);
  const canFulfillTotal = totalAvailable >= quantity;

  return {
    product_id,
    product_name: prod.name,
    sku: prod.sku,
    requested_quantity: quantity,
    total_available: totalAvailable,
    total_reserved: totalReserved,
    total_incoming: totalIncoming,
    can_fulfill_single_warehouse: canFulfillSingle,
    can_fulfill_across_warehouses: canFulfillTotal,
    is_out_of_stock: totalAvailable === 0,
    breakdown,
  };
}

export function reserve_inventory(product_id: string, warehouse_id: string, quantity: number) {
  const db = getDb();
  const record = db.inventory.find(i => i.product_id === product_id && i.warehouse_id === warehouse_id);
  if (!record) {
    throw new Error(`No inventory record found for product ${product_id} at hub ${warehouse_id}`);
  }
  if (record.quantity_available < quantity) {
    throw new Error(
      `Insufficient available stock at hub ${warehouse_id}. Requested: ${quantity}, Available: ${record.quantity_available}`
    );
  }

  record.quantity_available -= quantity;
  record.quantity_reserved += quantity;

  addAuditLog(
    'Inventory Agent',
    'STOCK_RESERVED',
    'INVENTORY',
    product_id,
    `Reserved ${quantity} units at Indian hub ${warehouse_id}. Available pool now: ${record.quantity_available}`,
    'SUCCESS'
  );

  saveDb();
  return record;
}

export function release_inventory(product_id: string, warehouse_id: string, quantity: number) {
  const db = getDb();
  const record = db.inventory.find(i => i.product_id === product_id && i.warehouse_id === warehouse_id);
  if (!record) throw new Error('Inventory record not found.');

  const releaseQty = Math.min(record.quantity_reserved, quantity);
  record.quantity_reserved -= releaseQty;
  record.quantity_available += releaseQty;

  addAuditLog(
    'Inventory Agent',
    'STOCK_RELEASED',
    'INVENTORY',
    product_id,
    `Released ${releaseQty} units back to available pool at hub ${warehouse_id}.`,
    'SUCCESS'
  );

  saveDb();
  return record;
}

// ----------------------------------------------------
// INDIAN WAREHOUSES & CARRIER OPTIMIZATION
// ----------------------------------------------------
export function get_warehouses() {
  const db = getDb();
  return db.warehouses;
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Coordinates for Indian States & Major Regions
const INDIA_STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  Maharashtra: { lat: 19.0760, lng: 72.8777 },
  Karnataka: { lat: 12.9716, lng: 77.5946 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Haryana: { lat: 28.4595, lng: 77.0266 },
  'Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
  Telangana: { lat: 17.3850, lng: 78.4867 },
  'West Bengal': { lat: 22.5726, lng: 88.3639 },
  Gujarat: { lat: 23.0225, lng: 72.5714 },
  Rajasthan: { lat: 26.9124, lng: 75.7873 },
  Kerala: { lat: 8.5241, lng: 76.9366 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Madhya Pradesh': { lat: 22.7196, lng: 75.8577 },
  Punjab: { lat: 30.7333, lng: 76.7794 },
  Bihar: { lat: 25.5941, lng: 85.1376 },
  Odisha: { lat: 20.2961, lng: 85.8245 },
  AndhraPradesh: { lat: 17.6868, lng: 83.2185 },
};

export function find_best_warehouse(order_id: string) {
  const db = getDb();
  const order = db.orders.find(o => o.id === order_id);
  if (!order) throw new Error(`Order ${order_id} not found.`);

  const destCoords =
    INDIA_STATE_COORDS[order.delivery_state] || { lat: 20.5937, lng: 78.9629 };

  const scoredWarehouses = db.warehouses.map(wh => {
    let canFulfillAll = true;
    let totalAvail = 0;
    let totalReq = 0;

    for (const item of order.items) {
      totalReq += item.quantity;
      const inv = db.inventory.find(i => i.warehouse_id === wh.id && i.product_id === item.product_id);
      const avail = inv ? inv.quantity_available : 0;
      totalAvail += avail;
      if (avail < item.quantity) {
        canFulfillAll = false;
      }
    }

    const distKm = calcDistance(wh.lat, wh.lng, destCoords.lat, destCoords.lng);
    const capacityScore = Math.max(0, 100 - wh.utilization_pct);
    const statusScore = wh.operational_status === 'ACTIVE' ? 100 : wh.operational_status === 'LIMITED' ? 50 : 0;

    // Weighting: Stock availability 40%, Distance in India 35%, Capacity 15%, Operational 10%
    const distFactor = Math.max(0, 100 - distKm / 25); // ~2500km max domestic span
    const availFactor = canFulfillAll ? 100 : (totalAvail / Math.max(1, totalReq)) * 60;

    const overallScore = Math.round(
      availFactor * 0.40 + distFactor * 0.35 + capacityScore * 0.15 + statusScore * 0.10
    );

    return {
      warehouse: wh,
      distance_km: distKm,
      can_fulfill_all: canFulfillAll,
      available_units: totalAvail,
      required_units: totalReq,
      composite_score: overallScore,
      handling_cost_inr: wh.handling_cost_per_item,
      estimated_processing_hours: wh.utilization_pct > 80 ? 6 : 3,
    };
  });

  scoredWarehouses.sort((a, b) => b.composite_score - a.composite_score);
  const best = scoredWarehouses[0];

  return {
    order_id,
    recommended_warehouse: best.warehouse,
    recommendation_reasons: [
      best.can_fulfill_all
        ? `100% in-stock availability for all ${best.required_units} item(s) in Indian hub inventory`
        : `Partial stock match (${best.available_units}/${best.required_units} available)`,
      `Optimal geographic proximity in India (${best.distance_km} km to ${order.delivery_city}, ${order.delivery_state})`,
      `Facility utilization at ${best.warehouse.utilization_pct}% (${best.warehouse.capacity_sqft.toLocaleString()} sqft)`,
      `Indian hub handling fee: ₹${best.warehouse.handling_cost_per_item}/item`,
    ],
    confidence: best.can_fulfill_all ? 96 : 70,
    all_evaluated: scoredWarehouses,
  };
}

export function get_carriers() {
  const db = getDb();
  return db.carriers.map(c => {
    const learned = db.carrier_learned_offsets[c.id];
    const offset = learned ? learned.delta : 0;
    const finalReliability = Math.max(50, Math.min(100, Math.round((c.reliability_score + offset) * 10) / 10));
    return {
      ...c,
      adjusted_reliability: finalReliability,
      learning_notes: learned?.notes || 'Standard Indian corridor baseline',
    };
  });
}

export function compare_carriers(order_id: string) {
  const db = getDb();
  const order = db.orders.find(o => o.id === order_id);
  if (!order) throw new Error(`Order ${order_id} not found.`);

  const carriers = get_carriers();
  const totalWeight = order.items.reduce((sum, it) => {
    const prod = db.products.find(p => p.id === it.product_id);
    return sum + (prod ? prod.weight_kg * it.quantity : 1);
  }, 0);

  const evaluated = carriers.map(c => {
    const calculatedCost = Math.round(c.base_cost_inr + c.cost_per_kg_inr * totalWeight);
    let slaScore = 80;
    if (order.priority === 'URGENT') {
      slaScore = c.avg_delivery_days <= 1.5 ? 100 : c.avg_delivery_days <= 2.5 ? 60 : 30;
    } else if (order.priority === 'EXPEDITED') {
      slaScore = c.avg_delivery_days <= 2.5 ? 100 : 70;
    } else {
      slaScore = 90;
    }

    const reliability = c.adjusted_reliability || c.reliability_score;
    const statusMultiplier = c.operational_status === 'ACTIVE' ? 1.0 : c.operational_status === 'DELAYED' ? 0.6 : 0.2;

    const costScore = Math.max(20, 100 - (calculatedCost / 1200) * 50);
    const overallScore = Math.round((reliability * 0.40 + slaScore * 0.35 + costScore * 0.25) * statusMultiplier);

    return {
      carrier: c,
      calculated_cost_inr: calculatedCost,
      estimated_days: c.avg_delivery_days,
      reliability,
      sla_match: slaScore,
      composite_score: overallScore,
      operational_status: c.operational_status,
    };
  });

  evaluated.sort((a, b) => b.composite_score - a.composite_score);
  const best = evaluated[0];

  return {
    order_id,
    order_priority: order.priority,
    total_weight_kg: Math.round(totalWeight * 10) / 10,
    recommended_carrier: best.carrier,
    cost_inr: best.calculated_cost_inr,
    eta_days: best.estimated_days,
    confidence: best.composite_score,
    reasons: [
      `Meets ${order.priority} SLA in India with estimated ${best.estimated_days} day(s) transit`,
      `Adjusted historical reliability of ${best.reliability}% across domestic Indian lanes`,
      `Calculated shipping cost ₹${best.calculated_cost_inr} matches budget allocation`,
      best.carrier.operational_status === 'ACTIVE' ? 'Carrier operational network is active across Indian states' : 'Carrier network active',
    ],
    all_evaluated: evaluated,
  };
}

// ----------------------------------------------------
// SHIPMENT TOOLKIT (DOMESTIC INDIAN TRANSIT)
// ----------------------------------------------------
export function create_shipment(order_id: string, warehouse_id?: string, carrier_id?: string): Shipment {
  const db = getDb();
  const order = db.orders.find(o => o.id === order_id);
  if (!order) throw new Error(`Order ${order_id} not found.`);

  const whId = warehouse_id || order.assigned_warehouse_id || find_best_warehouse(order_id).recommended_warehouse.id;
  const carrierId = carrier_id || order.assigned_carrier_id || compare_carriers(order_id).recommended_carrier.id;

  const warehouse = db.warehouses.find(w => w.id === whId);
  const carrier = db.carriers.find(c => c.id === carrierId);

  if (!warehouse || !carrier) throw new Error('Invalid warehouse or carrier selection.');

  const shipmentId = `SHP-${order.id.replace('ORD-', '')}`;
  const trackingId = `TRK-${carrier.code}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date();

  const newShipment: Shipment = {
    id: shipmentId,
    order_id: order.id,
    warehouse_id: warehouse.id,
    warehouse_name: warehouse.name,
    carrier_id: carrier.id,
    carrier_name: carrier.name,
    tracking_id: trackingId,
    origin: `${warehouse.city}, ${warehouse.state}`,
    destination: `${order.delivery_city}, ${order.delivery_state}`,
    dispatch_date: now.toISOString(),
    expected_delivery: order.requested_delivery_date,
    status: 'READY_TO_DISPATCH',
    events: [
      {
        id: generateId('EVT'),
        shipment_id: shipmentId,
        timestamp: now.toISOString(),
        status: 'READY_TO_DISPATCH',
        location: `${warehouse.city}, ${warehouse.state}`,
        description: `Order verified, packed and sealed at ${warehouse.name} with e-way bill.`,
        agent: 'Fulfillment & Shipment Agent',
      },
    ],
  };

  db.shipments = db.shipments.filter(s => s.order_id !== order.id);
  db.shipments.unshift(newShipment);

  order.assigned_warehouse_id = warehouse.id;
  order.assigned_warehouse_name = warehouse.name;
  order.assigned_carrier_id = carrier.id;
  order.assigned_carrier_name = carrier.name;
  order.tracking_id = trackingId;
  order.shipment_id = shipmentId;
  order.status = 'READY_TO_DISPATCH';

  addAuditLog(
    'Fulfillment & Shipment Agent',
    'SHIPMENT_CREATED',
    'SHIPMENT',
    shipmentId,
    `Created Indian consignment for ${order.id}. Hub: ${warehouse.name}, Carrier: ${carrier.name}, Tracking: ${trackingId}`,
    'SUCCESS'
  );

  sendNotification(
    `Shipment Ready: ${trackingId}`,
    `Order ${order.id} is packed and ready for dispatch via ${carrier.name}.`,
    'SHIPMENT',
    'info',
    order.id
  );

  saveDb();
  return newShipment;
}

export function update_shipment_status(shipment_id: string, new_status: ShipmentStatus, location?: string, description?: string) {
  const db = getDb();
  const shipment = db.shipments.find(s => s.id === shipment_id);
  if (!shipment) throw new Error(`Shipment ${shipment_id} not found.`);

  const oldStatus = shipment.status;
  shipment.status = new_status;

  const event: ShipmentEvent = {
    id: generateId('EVT'),
    shipment_id: shipment.id,
    timestamp: new Date().toISOString(),
    status: new_status,
    location: location || shipment.origin,
    description: description || `Status updated from ${oldStatus} to ${new_status}.`,
    agent: 'Fulfillment & Shipment Agent',
  };
  shipment.events.push(event);

  const order = db.orders.find(o => o.id === shipment.order_id);
  if (order) {
    if (new_status === 'DELIVERED') {
      order.status = 'DELIVERED';
      shipment.actual_delivery = new Date().toISOString();
    } else if (new_status === 'OUT_FOR_DELIVERY') {
      order.status = 'OUT_FOR_DELIVERY';
    } else if (new_status === 'IN_TRANSIT') {
      order.status = 'IN_TRANSIT';
    } else if (new_status === 'DISPATCHED') {
      order.status = 'DISPATCHED';
    } else if (new_status === 'DELAYED') {
      order.status = 'DELAYED';
    }
  }

  addAuditLog(
    'Fulfillment & Shipment Agent',
    'SHIPMENT_STATUS_UPDATED',
    'SHIPMENT',
    shipment.id,
    `Shipment status moved to ${new_status}. Location: ${location || 'In Domestic Indian Transit'}`,
    'SUCCESS'
  );

  saveDb();
  return shipment;
}

export function simulate_carrier_delay(shipment_id: string, delay_hours = 36, reason?: string) {
  const db = getDb();
  const shipment = db.shipments.find(s => s.id === shipment_id);
  if (!shipment) throw new Error(`Shipment ${shipment_id} not found.`);

  const delayReason = reason || 'Highway congestion on NH48 and carrier sorting terminal equipment failure';
  shipment.status = 'DELAYED';
  shipment.delay_hours = delay_hours;
  shipment.delay_reason = delayReason;

  const event: ShipmentEvent = {
    id: generateId('EVT'),
    shipment_id: shipment.id,
    timestamp: new Date().toISOString(),
    status: 'DELAYED',
    location: 'Pune-NH48 Tollgate Hub',
    description: `DELAY DETECTED: +${delay_hours}h estimated delay. Cause: ${delayReason}`,
    agent: 'Exception & Recovery Agent',
  };
  shipment.events.push(event);

  const order = db.orders.find(o => o.id === shipment.order_id);
  if (order) {
    order.status = 'DELAYED';
  }

  const incident: Incident = {
    id: generateId('INC-IN'),
    incident_type: 'DELIVERY_DELAY',
    order_id: shipment.order_id,
    shipment_id: shipment.id,
    severity: 'HIGH',
    description: `Shipment ${shipment.tracking_id} (${shipment.carrier_name}) delayed by +${delay_hours} hours. Guaranteed delivery deadline to ${order?.delivery_city || 'destination'} is in jeopardy.`,
    status: 'OPEN',
    created_at: new Date().toISOString(),
  };
  db.incidents.unshift(incident);

  addAuditLog(
    'Exception & Recovery Agent',
    'DELAY_DETECTED',
    'INCIDENT',
    incident.id,
    `Simulated delay on domestic shipment ${shipment.tracking_id}. Incident flagged to Self-Healing monitor.`,
    'WARNING'
  );

  sendNotification(
    `Delay Incident Alert: ${order ? order.id : shipment.tracking_id}`,
    `Shipment ${shipment.tracking_id} delayed by +${delay_hours}h. Self-healing recovery triggered.`,
    'EXCEPTION',
    'warning',
    order?.id
  );

  const plan = generate_recovery_plan(incident.id);
  saveDb();
  return { shipment, incident, plan };
}

// ----------------------------------------------------
// EXCEPTION & RECOVERY (SELF-HEALING)
// ----------------------------------------------------
export function detect_delayed_orders() {
  const db = getDb();
  const now = Date.now();
  const delayed: { order: Order; shipment?: Shipment; is_late: boolean; delta_hours: number }[] = [];

  for (const order of db.orders) {
    const shipment = db.shipments.find(s => s.order_id === order.id);
    const promisedTime = new Date(order.requested_delivery_date).getTime();
    const isPastPromise = now > promisedTime && order.status !== 'DELIVERED' && order.status !== 'COMPLETED';

    if (order.status === 'DELAYED' || shipment?.status === 'DELAYED' || isPastPromise) {
      const deltaHours = Math.round((now - promisedTime) / 3600000);
      delayed.push({
        order,
        shipment,
        is_late: isPastPromise,
        delta_hours: deltaHours,
      });
    }
  }

  return delayed;
}

export function generate_recovery_plan(incident_id: string): RecoveryPlan {
  const db = getDb();
  const incident = db.incidents.find(i => i.id === incident_id);
  if (!incident) throw new Error(`Incident ${incident_id} not found.`);

  const order = db.orders.find(o => o.id === incident.order_id);
  const shipment = db.shipments.find(s => s.id === incident.shipment_id || s.order_id === incident.order_id);

  const currentCarrierId = shipment?.carrier_id;
  const carriers = get_carriers().filter(c => c.id !== currentCarrierId && c.operational_status === 'ACTIVE');

  // Top Indian air/express alternatives
  const bestAir = carriers.find(c => c.code === 'BLUEDART-AIR') || carriers.find(c => c.service_type === 'OVERNIGHT_AIR') || carriers[0];
  const secondChoice = carriers.find(c => c.code === 'DTDC-PRIME' || c.id !== bestAir.id) || carriers[1];

  const planId = generateId('REC-PLAN-IN');
  const plan: RecoveryPlan = {
    id: planId,
    incident_id: incident.id,
    order_id: incident.order_id,
    shipment_id: shipment?.id,
    problem_summary: incident.description,
    root_cause: shipment?.delay_reason || 'Carrier highway congestion and terminal equipment breakdown.',
    action_type: 'CARRIER_EXPEDITE_REASSIGNMENT',
    recommendation: `Intercept transit consignment and reassign to ${bestAir.name} (Direct Overnight Air Cargo)`,
    confidence: 96,
    reasons: [
      `${bestAir.name} guarantees next-morning air arrival, recovering ${shipment?.delay_hours || 36} lost hours`,
      `Verified carrier reliability score of ${bestAir.adjusted_reliability || bestAir.reliability_score}% across domestic Indian metro lanes`,
      `Order ${order?.id} priority is ${order?.priority || 'URGENT'} with contractual SLA penalty risk`,
    ],
    evidence: [
      `Original ETA missed by ~${shipment?.delay_hours || 24} hours`,
      `New expedited ETA with ${bestAir.name}: within 20 hours of airport handoff`,
      `Incremental carrier cost: +₹${Math.round(bestAir.base_cost_inr * 0.65)} (covered under contingency)`,
    ],
    alternatives: [
      {
        title: `Plan A (Recommended): ${bestAir.name}`,
        cost_inr: bestAir.base_cost_inr + 80,
        eta_days: bestAir.avg_delivery_days,
        reliability: bestAir.adjusted_reliability || bestAir.reliability_score,
        risk: 'Minimal; high probability of beating contractual SLA deadline',
      },
      {
        title: `Plan B: ${secondChoice.name}`,
        cost_inr: secondChoice.base_cost_inr + 40,
        eta_days: secondChoice.avg_delivery_days,
        reliability: secondChoice.adjusted_reliability || secondChoice.reliability_score,
        risk: 'Tighter buffer; subject to airport cargo congestion',
      },
      {
        title: 'Plan C: Maintain Current Carrier (No-action)',
        cost_inr: 0,
        eta_days: 3.5,
        reliability: 72,
        risk: 'Guaranteed customer SLA breach and risk of cancellation',
      },
    ],
    cost_delta_inr: Math.round(bestAir.base_cost_inr * 0.65),
    eta_improvement_hours: shipment?.delay_hours ? shipment.delay_hours - 8 : 26,
    status: 'PENDING_APPROVAL',
    created_at: new Date().toISOString(),
  };

  db.recovery_plans.unshift(plan);
  incident.recovery_plan_id = plan.id;

  addAuditLog(
    'Exception & Recovery Agent',
    'RECOVERY_PLAN_GENERATED',
    'INCIDENT',
    incident.id,
    `Self-Healing proposal generated: ${plan.recommendation}. Plan ID: ${plan.id}`,
    'SUCCESS'
  );

  if (db.settings.mode === 'AUTONOMOUS' && plan.confidence >= 85 && plan.cost_delta_inr <= db.settings.autoApproveRiskThreshold) {
    execute_recovery_plan(plan.id, 'Autonomous Self-Healing Loop');
  }

  saveDb();
  return plan;
}

export function execute_recovery_plan(plan_id: string, approved_by: string): { success: boolean; plan: RecoveryPlan } {
  const db = getDb();
  const plan = db.recovery_plans.find(p => p.id === plan_id);
  if (!plan) throw new Error(`Recovery plan ${plan_id} not found.`);

  const incident = db.incidents.find(i => i.id === plan.incident_id);
  const order = db.orders.find(o => o.id === plan.order_id);
  const shipment = db.shipments.find(s => s.id === plan.shipment_id || s.order_id === plan.order_id);

  const matchCarrier = db.carriers.find(c => plan.recommendation.includes(c.name)) || db.carriers[0];

  if (shipment) {
    const oldCarrierName = shipment.carrier_name;
    shipment.carrier_id = matchCarrier.id;
    shipment.carrier_name = matchCarrier.name;
    shipment.tracking_id = `TRK-${matchCarrier.code}-REC${Math.floor(1000 + Math.random() * 9000)}`;
    shipment.status = 'IN_TRANSIT';
    shipment.is_recovered = true;
    shipment.recovery_plan_id = plan.id;

    shipment.events.push({
      id: generateId('EVT'),
      shipment_id: shipment.id,
      timestamp: new Date().toISOString(),
      status: 'IN_TRANSIT',
      location: 'Pune Airport Cargo Intercept Terminal',
      description: `SELF-HEALING EXECUTED: Reassigned from ${oldCarrierName} to ${matchCarrier.name}. New Tracking: ${shipment.tracking_id}. ETA accelerated by ${plan.eta_improvement_hours}h.`,
      agent: 'Exception & Recovery Agent',
    });
  }

  if (order) {
    order.status = 'IN_TRANSIT';
    order.assigned_carrier_id = matchCarrier.id;
    order.assigned_carrier_name = matchCarrier.name;
    if (shipment) order.tracking_id = shipment.tracking_id;
  }

  if (incident) {
    incident.status = 'RESOLVED';
    incident.resolved_at = new Date().toISOString();
  }

  plan.status = approved_by.includes('Autonomous') ? 'AUTO_EXECUTED' : 'APPROVED';
  plan.executed_at = new Date().toISOString();

  addAuditLog(
    'Exception & Recovery Agent',
    'RECOVERY_PLAN_EXECUTED',
    'SHIPMENT',
    shipment ? shipment.id : plan.order_id,
    `Recovery Plan ${plan.id} executed by ${approved_by}. Carrier shifted to ${matchCarrier.name}. Incident marked RESOLVED.`,
    'RECOVERED'
  );

  sendNotification(
    `Order Recovered: ${order?.id}`,
    `Self-healing complete. Reassigned to ${matchCarrier.name}. Order back on schedule!`,
    'EXCEPTION',
    'success',
    order?.id
  );

  saveDb();
  return { success: true, plan };
}

// ----------------------------------------------------
// RISK & RETURN AGENT
// ----------------------------------------------------
export function calculate_risk_score(customer_id: string, order_id?: string) {
  const db = getDb();
  const customer = db.customers.find(c => c.id === customer_id);
  if (!customer) throw new Error(`Customer ${customer_id} not found.`);

  const order = order_id ? db.orders.find(o => o.id === order_id) : null;

  const factors: { name: string; score_impact: number; explanation: string }[] = [];
  let score = 5;

  const returnRate = customer.order_count > 0 ? customer.return_count / customer.order_count : 0;
  if (returnRate > 0.5 && customer.return_count >= 3) {
    factors.push({
      name: 'Abnormal Return Frequency',
      score_impact: 35,
      explanation: `${customer.return_count} returns out of ${customer.order_count} orders (${Math.round(returnRate * 100)}% return rate). Exceeds domestic e-commerce threshold of 20%.`,
    });
    score += 35;
  } else if (returnRate > 0.25) {
    factors.push({
      name: 'Moderate Return History',
      score_impact: 15,
      explanation: `${customer.return_count} returns out of ${customer.order_count} orders.`,
    });
    score += 15;
  }

  if (customer.dispute_count > 0) {
    const impact = customer.dispute_count * 18;
    factors.push({
      name: 'Historical Payment Disputes',
      score_impact: impact,
      explanation: `${customer.dispute_count} chargeback/payment dispute flag(s) on previous orders.`,
    });
    score += impact;
  }

  if (customer.failed_delivery_count > 0) {
    const impact = customer.failed_delivery_count * 12;
    factors.push({
      name: 'Failed Courier Deliveries',
      score_impact: impact,
      explanation: `${customer.failed_delivery_count} previous delivery attempts failed due to address discrepancies or COD refusals.`,
    });
    score += impact;
  }

  if (order && order.total_amount_inr > 200000) {
    factors.push({
      name: 'High-Value Consignment Threshold',
      score_impact: 10,
      explanation: `Current order total is ₹${order.total_amount_inr.toLocaleString('en-IN')}, requiring e-way bill and manager validation.`,
    });
    score += 10;
  }

  score = Math.min(100, score);
  const level: 'LOW' | 'MEDIUM' | 'HIGH' = score >= 70 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';

  customer.risk_score = score;
  customer.risk_level = level;

  if (order) {
    order.risk_score = score;
    order.risk_level = level;
  }

  addAuditLog(
    'Risk / Return Agent',
    'RISK_EVALUATED',
    'ORDER',
    order?.id || customer.id,
    `Calculated risk score: ${score}/100 (${level} Risk). ${factors.length} active risk factor(s) identified for ${customer.name}.`,
    level === 'HIGH' ? 'WARNING' : 'SUCCESS'
  );

  saveDb();
  return {
    customer_id,
    customer_name: customer.name,
    order_id: order?.id,
    risk_score: score,
    risk_level: level,
    recommendation:
      level === 'HIGH'
        ? 'Manual supervisor sign-off recommended before dispatch. Verify Indian PIN code and GSTIN credentials.'
        : level === 'MEDIUM'
        ? 'Proceed with standard carrier tracking and mandatory OTP verification on delivery.'
        : 'Approved for automated straight-through fulfillment.',
    factors,
  };
}

export function create_return(params: {
  order_id: string;
  product_id: string;
  quantity: number;
  return_reason: string;
}): ReturnRecord {
  const db = getDb();
  const order = db.orders.find(o => o.id === params.order_id);
  if (!order) throw new Error(`Order ${params.order_id} not found.`);

  const item = order.items.find(i => i.product_id === params.product_id);
  if (!item) throw new Error(`Product ${params.product_id} not in order.`);

  const returnNum = 8000 + db.returns.length + 1;
  const newReturn: ReturnRecord = {
    id: generateId('RET-IN'),
    return_id: `RMA-IN-${returnNum}`,
    order_id: order.id,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: params.quantity,
    return_reason: params.return_reason,
    request_date: new Date().toISOString(),
    status: 'PENDING_REVIEW',
    refund_amount_inr: item.unit_price_inr * params.quantity,
  };

  db.returns.unshift(newReturn);

  addAuditLog(
    'Risk / Return Agent',
    'RETURN_REQUESTED',
    'RETURN',
    newReturn.return_id,
    `Return request ${newReturn.return_id} filed for ${order.id} (${item.product_name}). Pending eligibility evaluation.`,
    'SUCCESS'
  );

  sendNotification(
    `Return Request: ${newReturn.return_id}`,
    `Return filed by ${order.customer_name} for order ${order.id}.`,
    'RETURN',
    'info',
    order.id
  );

  saveDb();
  return newReturn;
}

export function process_return(return_id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
  const db = getDb();
  const ret = db.returns.find(r => r.id === return_id || r.return_id === return_id);
  if (!ret) throw new Error(`Return record ${return_id} not found.`);

  if (decision === 'APPROVE') {
    ret.status = 'APPROVED';
    ret.reverse_carrier_name = 'Blue Dart Apex Priority Air';
    ret.reverse_tracking_id = `R-TRK-BLUEDART-${Math.floor(100000 + Math.random() * 900000)}`;

    addAuditLog(
      'Risk / Return Agent',
      'RETURN_APPROVED',
      'RETURN',
      ret.return_id,
      `Return approved. Reverse logistics label generated (${ret.reverse_tracking_id}). Reverse carrier assigned.`,
      'SUCCESS'
    );
  } else {
    ret.status = 'REJECTED';
    ret.rejection_reason = notes || 'Does not comply with 30-day return window or item condition requirements.';

    addAuditLog(
      'Risk / Return Agent',
      'RETURN_REJECTED',
      'RETURN',
      ret.return_id,
      `Return rejected. Reason: ${ret.rejection_reason}`,
      'WARNING'
    );
  }

  saveDb();
  return ret;
}

// ----------------------------------------------------
// INVOICE TOOLKIT (INDIAN GST INVOICE)
// ----------------------------------------------------
export function generate_invoice(order_id: string): Invoice {
  const db = getDb();
  const order = db.orders.find(o => o.id === order_id);
  if (!order) throw new Error(`Order ${order_id} not found.`);

  const existing = db.invoices.find(i => i.order_id === order_id);
  if (existing) return existing;

  const orderNum = order.id.replace('ORD-', '');
  const assignedWh = db.warehouses.find(w => w.id === order.assigned_warehouse_id) || db.warehouses[0];
  const isInterstate = assignedWh.state !== order.delivery_state;

  const invoice: Invoice = {
    id: generateId('INV-IN'),
    invoice_number: `INV-GST-2026-${orderNum}`,
    gstin: '27AABCS9988Z1Z5',
    order_id: order.id,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    date: new Date().toISOString(),
    due_date: order.requested_delivery_date,
    subtotal_inr: order.subtotal_inr,
    discount_inr: 0,
    cgst_inr: isInterstate ? 0 : Math.round(order.subtotal_inr * 0.09),
    sgst_inr: isInterstate ? 0 : Math.round(order.subtotal_inr * 0.09),
    igst_inr: isInterstate ? Math.round(order.subtotal_inr * 0.18) : 0,
    shipping_inr: order.shipping_cost_inr,
    total_inr: order.total_amount_inr,
    status: 'PAID',
    items: order.items,
  };

  db.invoices.unshift(invoice);

  addAuditLog(
    'Invoice Agent',
    'INVOICE_GENERATED',
    'INVOICE',
    invoice.invoice_number,
    `Generated Tax Invoice ${invoice.invoice_number} for ${order.id}. Total: ₹${invoice.total_inr.toLocaleString('en-IN')}`,
    'SUCCESS'
  );

  saveDb();
  return invoice;
}

export function get_invoice(query: string): Invoice | null {
  const db = getDb();
  const q = query.toLowerCase();
  const invoice = db.invoices.find(
    i => i.invoice_number.toLowerCase() === q || i.order_id.toLowerCase() === q || i.id.toLowerCase() === q
  );
  return invoice || null;
}

// ----------------------------------------------------
// FEEDBACK & LEARNING AGENT
// ----------------------------------------------------
export function record_feedback(params: {
  order_id: string;
  rating_type: FeedbackRecord['rating_type'];
  category: FeedbackRecord['category'];
  comment: string;
  carrier_id?: string;
  warehouse_id?: string;
  human_correction?: string;
}): FeedbackRecord {
  const db = getDb();
  const order = db.orders.find(o => o.id === params.order_id);
  const shipment = db.shipments.find(s => s.order_id === params.order_id);

  const carrierId = params.carrier_id || shipment?.carrier_id || order?.assigned_carrier_id;
  const carrier = carrierId ? db.carriers.find(c => c.id === carrierId) : undefined;

  let weightDelta = 0;
  if (params.rating_type === 'GOOD' || params.rating_type === 'ACCEPTED') {
    weightDelta = 1.5;
  } else if (params.rating_type === 'BAD') {
    weightDelta = -4.0;
  } else if (params.rating_type === 'REJECTED') {
    weightDelta = -3.0;
  } else if (params.rating_type === 'MODIFIED') {
    weightDelta = -1.5;
  }

  const record: FeedbackRecord = {
    id: generateId('FDBK-IN'),
    order_id: params.order_id,
    shipment_id: shipment?.id,
    carrier_id: carrierId,
    carrier_name: carrier?.name,
    warehouse_id: params.warehouse_id || order?.assigned_warehouse_id,
    rating_type: params.rating_type,
    category: params.category,
    comment: params.comment,
    human_correction: params.human_correction,
    recorded_at: new Date().toISOString(),
    applied_weight_delta: weightDelta,
  };

  db.feedback.unshift(record);

  if (carrierId) {
    if (!db.carrier_learned_offsets[carrierId]) {
      db.carrier_learned_offsets[carrierId] = { delta: 0, notes: '' };
    }
    db.carrier_learned_offsets[carrierId].delta += weightDelta;
    db.carrier_learned_offsets[carrierId].notes = `Updated from feedback (${params.rating_type}): ${params.comment.slice(0, 80)}`;
  }

  addAuditLog(
    'Feedback / Learning Agent',
    'FEEDBACK_RECORDED',
    'CARRIER',
    carrierId || params.order_id,
    `Recorded ${params.rating_type} feedback. Learning weight adjusted by ${weightDelta > 0 ? '+' : ''}${weightDelta}. Future Indian routing calibrated.`,
    'SUCCESS'
  );

  saveDb();
  return record;
}

export function get_historical_performance() {
  const db = getDb();
  const carriersWithLearning = get_carriers();
  const totalOrders = db.orders.length;
  const deliveredOrders = db.orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
  const delayedOrders = db.orders.filter(o => o.status === 'DELAYED').length;
  const totalFeedback = db.feedback.length;
  const positiveFeedback = db.feedback.filter(f => f.rating_type === 'GOOD' || f.rating_type === 'ACCEPTED').length;

  return {
    total_orders: totalOrders,
    delivered_orders: deliveredOrders,
    delayed_orders: delayedOrders,
    on_time_rate: Math.round(((totalOrders - delayedOrders) / Math.max(1, totalOrders)) * 1000) / 10,
    carrier_performance: carriersWithLearning.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      base_reliability: c.reliability_score,
      adjusted_reliability: c.adjusted_reliability,
      on_time_rate: c.on_time_rate,
      learning_notes: c.learning_notes,
    })),
    warehouse_utilization: db.warehouses.map(w => ({
      id: w.id,
      name: w.name,
      city: w.city,
      state: w.state,
      zone: w.zone,
      utilization_pct: w.utilization_pct,
      status: w.operational_status,
    })),
    feedback_satisfaction_rate: Math.round((positiveFeedback / Math.max(1, totalFeedback)) * 100),
    learning_active: true,
  };
}
