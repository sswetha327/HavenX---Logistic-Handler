export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  order_count: number;
  return_count: number;
  dispute_count: number;
  failed_delivery_count: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  hsn_code: string;
  price_inr: number;
  weight_kg: number;
  reorder_point: number;
  supplier_id: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  zone: 'North' | 'West' | 'South' | 'East' | 'Central';
  lat: number;
  lng: number;
  capacity_sqft: number;
  utilization_pct: number;
  handling_cost_per_item: number;
  operational_status: 'ACTIVE' | 'LIMITED' | 'OFFLINE';
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_category: string;
  reorder_point: number;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_city: string;
  warehouse_state: string;
  warehouse_zone: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_incoming: number;
  last_restocked: string;
}

export interface Carrier {
  id: string;
  code: string;
  name: string;
  service_type: 'OVERNIGHT_AIR' | 'EXPEDITED_GROUND' | 'STANDARD_SURFACE' | 'EXPRESS_CARGO' | 'GREEN_EV';
  base_cost_inr: number;
  cost_per_kg_inr: number;
  avg_delivery_days: number;
  reliability_score: number;
  on_time_rate: number;
  active_shipments_count: number;
  max_capacity: number;
  operational_status: 'ACTIVE' | 'DELAYED' | 'GROUNDED';
  adjusted_reliability?: number;
  learning_notes?: string;
}

export type OrderStatus =
  | 'ORDER_RECEIVED'
  | 'VALIDATED'
  | 'STOCK_CHECKED'
  | 'WAREHOUSE_ASSIGNED'
  | 'READY_TO_DISPATCH'
  | 'CARRIER_ASSIGNED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OUT_OF_STOCK'
  | 'DELAYED'
  | 'FAILED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_inr: number;
  total_price_inr: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  requested_delivery_date: string;
  status: OrderStatus;
  priority: 'STANDARD' | 'EXPEDITED' | 'URGENT';
  payment_status: 'PAID' | 'PENDING' | 'REFUNDED';
  subtotal_inr: number;
  shipping_cost_inr: number;
  tax_inr: number;
  total_amount_inr: number;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  assigned_warehouse_id?: string;
  assigned_warehouse_name?: string;
  assigned_carrier_id?: string;
  assigned_carrier_name?: string;
  tracking_id?: string;
  shipment_id?: string;
  items: OrderItem[];
  notes?: string;
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type ShipmentStatus =
  | 'READY_TO_DISPATCH'
  | 'CARRIER_ASSIGNED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELAYED'
  | 'FAILED';

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  timestamp: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  agent: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  warehouse_id: string;
  warehouse_name: string;
  carrier_id: string;
  carrier_name: string;
  tracking_id: string;
  origin: string;
  destination: string;
  dispatch_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  status: ShipmentStatus;
  delay_reason?: string;
  delay_hours?: number;
  is_recovered?: boolean;
  recovery_plan_id?: string;
  events: ShipmentEvent[];
}

export interface ReturnRecord {
  id: string;
  return_id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  return_reason: string;
  request_date: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVERSE_DISPATCHED' | 'IN_INSPECTION' | 'RESTOCKED' | 'REFUNDED';
  refund_amount_inr: number;
  rejection_reason?: string;
  reverse_carrier_name?: string;
  reverse_tracking_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  gstin: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_gstin?: string;
  date: string;
  due_date: string;
  subtotal_inr: number;
  discount_inr: number;
  cgst_inr: number;
  sgst_inr: number;
  igst_inr: number;
  shipping_inr: number;
  total_inr: number;
  status: 'PAID' | 'SENT' | 'VOID';
  items: OrderItem[];
}

export interface FeedbackRecord {
  id: string;
  order_id: string;
  shipment_id?: string;
  carrier_id?: string;
  carrier_name?: string;
  warehouse_id?: string;
  rating_type: 'GOOD' | 'BAD' | 'INCORRECT' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
  category: 'CARRIER_PERFORMANCE' | 'WAREHOUSE_FULFILLMENT' | 'AI_RECOMMENDATION' | 'DELIVERY_TIME';
  comment: string;
  human_correction?: string;
  recorded_at: string;
  applied_weight_delta: number;
}

export interface Incident {
  id: string;
  incident_type:
    | 'DELIVERY_DELAY'
    | 'OUT_OF_STOCK'
    | 'INVALID_ADDRESS'
    | 'FAILED_DELIVERY'
    | 'CARRIER_UNAVAILABLE'
    | 'WAREHOUSE_UNAVAILABLE'
    | 'RETURN_REQUEST';
  order_id: string;
  shipment_id?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'MITIGATING' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
  recovery_plan_id?: string;
}

export interface RecoveryPlan {
  id: string;
  incident_id: string;
  order_id: string;
  shipment_id?: string;
  problem_summary: string;
  root_cause: string;
  action_type: 'CARRIER_EXPEDITE_REASSIGNMENT' | 'WAREHOUSE_SPLIT_TRANSFER' | 'ADDRESS_REVALIDATE' | 'SUPPLIER_EMERGENCY_DROP';
  recommendation: string;
  confidence: number;
  reasons: string[];
  evidence: string[];
  alternatives: {
    title: string;
    cost_inr: number;
    eta_days: number;
    reliability: number;
    risk: string;
  }[];
  cost_delta_inr: number;
  eta_improvement_hours: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'AUTO_EXECUTED';
  created_at: string;
  executed_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  agent_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'RECOVERED';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'INVENTORY' | 'SHIPMENT' | 'RETURN' | 'RISK' | 'EXCEPTION' | 'SYSTEM';
  severity: 'info' | 'warning' | 'error' | 'success';
  order_id?: string;
  read: boolean;
  created_at: string;
}

export interface SystemSettings {
  mode: 'ASSISTED' | 'AUTONOMOUS';
  autoApproveRiskThreshold: number;
  strictInventoryHold: boolean;
}

export interface DashboardMetrics {
  total_orders: number;
  delivered_orders: number;
  delayed_orders: number;
  active_shipments: number;
  open_incidents: number;
  high_risk_customers: number;
  on_time_rate: number;
  feedback_satisfaction_rate: number;
  carrier_performance: any[];
  warehouse_utilization: any[];
  settings: SystemSettings;
}

export interface WorkflowStep {
  step_number: number;
  agent: string;
  action: string;
  timestamp: string;
  details: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION' | 'RECOVERED';
  metadata?: Record<string, any>;
}
