import {
  Order,
  InventoryItem,
  Warehouse,
  Carrier,
  Shipment,
  ReturnRecord,
  Invoice,
  Incident,
  RecoveryPlan,
  AuditLog,
  NotificationItem,
  DashboardMetrics,
  Customer,
  Product,
  SystemSettings,
  WorkflowStep,
  A2AMessage,
  GuardrailCheck,
  TokenUsageMetric,
  AiEvaluationMetrics,
  FailureSimulationType,
  UserRole,
  WorkflowTiming,
  GroundingEvidence,
} from './types';

export const api = {
  // Metrics & Settings
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await fetch('/api/metrics');
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Orders
  async getOrders(filters?: { status?: string; search?: string; limit?: number }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    const res = await fetch(`/api/orders?${params.toString()}`);
    return res.json();
  },

  async getOrder(id: string): Promise<{ order: Order; shipment?: Shipment; invoice?: Invoice; incident?: Incident }> {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async createOrder(data: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return res.json();
  },

  async processOrder(orderId: string): Promise<{
    order_id: string;
    status: string;
    current_agent: string;
    steps: WorkflowStep[];
    success: boolean;
    message: string;
    timing?: WorkflowTiming;
    a2a_messages?: A2AMessage[];
    grounding_evidence?: GroundingEvidence;
    guardrail_status?: string;
  }> {
    const res = await fetch(`/api/orders/${orderId}/process`, {
      method: 'POST',
    });
    return res.json();
  },

  // Inventory & Warehouses
  async getInventory(productId?: string): Promise<InventoryItem[]> {
    const url = productId ? `/api/inventory?product_id=${productId}` : '/api/inventory';
    const res = await fetch(url);
    return res.json();
  },

  async checkInventory(productId: string, quantity: number): Promise<any> {
    const res = await fetch('/api/inventory/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    return res.json();
  },

  async getWarehouses(): Promise<Warehouse[]> {
    const res = await fetch('/api/warehouses');
    return res.json();
  },

  async getBestWarehouse(orderId: string): Promise<any> {
    const res = await fetch(`/api/warehouses/optimize/${orderId}`);
    return res.json();
  },

  // Carriers & Shipments
  async getCarriers(): Promise<Carrier[]> {
    const res = await fetch('/api/carriers');
    return res.json();
  },

  async compareCarriers(orderId: string): Promise<any> {
    const res = await fetch(`/api/carriers/compare/${orderId}`);
    return res.json();
  },

  async getShipments(): Promise<Shipment[]> {
    const res = await fetch('/api/shipments');
    return res.json();
  },

  async getShipment(id: string): Promise<Shipment> {
    const res = await fetch(`/api/shipments/${id}`);
    return res.json();
  },

  async simulateDelay(shipmentId: string, delayHours = 36, reason?: string): Promise<any> {
    const res = await fetch(`/api/shipments/${shipmentId}/simulate-delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay_hours: delayHours, reason }),
    });
    return res.json();
  },

  // Incidents & Self-Healing
  async getIncidents(): Promise<{
    incidents: Incident[];
    recovery_plans: RecoveryPlan[];
    delayed_orders: any[];
  }> {
    const res = await fetch('/api/incidents');
    return res.json();
  },

  async generateRecoveryPlan(incidentId: string): Promise<RecoveryPlan> {
    const res = await fetch(`/api/incidents/${incidentId}/recovery-plan`, {
      method: 'POST',
    });
    return res.json();
  },

  async executeRecoveryPlan(planId: string, approvedBy?: string): Promise<{ success: boolean; plan: RecoveryPlan }> {
    const res = await fetch(`/api/recovery-plans/${planId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by: approvedBy }),
    });
    return res.json();
  },

  // Risk & Returns
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    return res.json();
  },

  async getCustomerRisk(customerId: string, orderId?: string): Promise<any> {
    const url = orderId ? `/api/risk/${customerId}?order_id=${orderId}` : `/api/risk/${customerId}`;
    const res = await fetch(url);
    return res.json();
  },

  async getReturns(): Promise<ReturnRecord[]> {
    const res = await fetch('/api/returns');
    return res.json();
  },

  async createReturn(data: any): Promise<ReturnRecord> {
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async processReturn(returnId: string, decision: 'APPROVE' | 'REJECT', notes?: string): Promise<ReturnRecord> {
    const res = await fetch(`/api/returns/${returnId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    });
    return res.json();
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch('/api/invoices');
    return res.json();
  },

  async getInvoice(idOrNumber: string): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${idOrNumber}`);
    return res.json();
  },

  // Feedback & Learning
  async getFeedback(): Promise<{ feedback: any[]; carrier_offsets: Record<string, any> }> {
    const res = await fetch('/api/feedback');
    return res.json();
  },

  async recordFeedback(data: any): Promise<any> {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    return res.json();
  },

  // Audit Logs & Notifications
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch('/api/notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  // Full 21-Step Simulation Runner
  async runCompleteDemoScenario(): Promise<{
    steps: WorkflowStep[];
    order_id: string;
    incident_id: string;
    recovery_plan_id: string;
    summary: string;
    timing?: WorkflowTiming;
    a2a_messages?: A2AMessage[];
  }> {
    const res = await fetch('/api/scenario/run-complete-demo', {
      method: 'POST',
    });
    return res.json();
  },

  // Chat with Guardrail, Grounding Evidence, Model Routing & Token accounting
  async sendChatMessage(prompt: string, history: any[] = []): Promise<{
    text: string;
    toolsUsed: { name: string; args: any; result: any }[];
    activeAgent: string;
    groundingEvidence?: GroundingEvidence;
    guardrailStatus?: 'PASSED' | 'REFUSED';
    guardrailReason?: string;
    modelUsed?: string;
    tokensUsed?: { input: number; output: number; total: number; cost_inr: number };
    latency_sec?: number;
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });
    return res.json();
  },

  // Agent-to-Agent (A2A) Messaging
  async getA2AMessages(correlationId?: string): Promise<A2AMessage[]> {
    const url = correlationId ? `/api/a2a?correlation_id=${correlationId}` : '/api/a2a';
    const res = await fetch(url);
    return res.json();
  },

  // AI Safety Guardrails
  async getGuardrailChecks(): Promise<GuardrailCheck[]> {
    const res = await fetch('/api/guardrails');
    return res.json();
  },

  async checkGuardrail(inputText: string): Promise<GuardrailCheck> {
    const res = await fetch('/api/guardrails/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_text: inputText }),
    });
    return res.json();
  },

  // Token Economics
  async getTokenMetrics(): Promise<TokenUsageMetric[]> {
    const res = await fetch('/api/tokens');
    return res.json();
  },

  // AI Evaluation Metrics
  async getEvaluationMetrics(): Promise<AiEvaluationMetrics> {
    const res = await fetch('/api/evaluation');
    return res.json();
  },

  // Failure Simulation Mode (Demo / Test Mode)
  async simulateFailure(type: FailureSimulationType, targetId?: string): Promise<{
    success: boolean;
    type: FailureSimulationType;
    message: string;
    incident?: Incident;
    recovery_plan?: RecoveryPlan;
    resolution: string;
    recovery_action: string;
  }> {
    const res = await fetch('/api/simulation/failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, target_id: targetId }),
    });
    return res.json();
  },

  // Role-Based Access Control
  async getUserRole(): Promise<{ role: UserRole }> {
    const res = await fetch('/api/role');
    return res.json();
  },

  async setUserRole(role: UserRole): Promise<{ role: UserRole }> {
    const res = await fetch('/api/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

  // Multimodal PO Extractor
  async extractOrderFromDocument(data: {
    text_content?: string;
    image_base64?: string;
    mime_type?: string;
  }): Promise<any> {
    const res = await fetch('/api/multimodal/extract-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Reset DB
  async resetDatabase(): Promise<any> {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    return res.json();
  },
};
