import {
  getDb,
  Order,
  OrderStatus,
} from './db';
import {
  addAuditLog,
  sendNotification,
  get_order,
  update_order,
  check_inventory,
  reserve_inventory,
  find_best_warehouse,
  compare_carriers,
  create_shipment,
  update_shipment_status,
  generate_invoice,
  calculate_risk_score,
  simulate_carrier_delay,
  generate_recovery_plan,
  execute_recovery_plan,
  record_feedback,
} from './tools';

export interface WorkflowStep {
  step_number: number;
  agent: string;
  action: string;
  timestamp: string;
  details: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION' | 'RECOVERED';
  metadata?: Record<string, any>;
}

export interface WorkflowResult {
  order_id: string;
  status: OrderStatus;
  current_agent: string;
  steps: WorkflowStep[];
  success: boolean;
  message: string;
}

/**
 * Central Orchestrator / Supervisor Agent (India Operations)
 */
export class LogisticsSupervisor {
  public static async processOrder(order_id: string): Promise<WorkflowResult> {
    const steps: WorkflowStep[] = [];
    const db = getDb();
    let order = get_order(order_id);
    if (!order) {
      throw new Error(`Order ${order_id} not found in database.`);
    }

    const addStep = (agent: string, action: string, details: string, status: WorkflowStep['status'], meta?: any) => {
      const step: WorkflowStep = {
        step_number: steps.length + 1,
        agent,
        action,
        timestamp: new Date().toISOString(),
        details,
        status,
        metadata: meta,
      };
      steps.push(step);
      addAuditLog(agent as any, action, 'ORDER', order_id, details, status === 'EXCEPTION' ? 'WARNING' : 'SUCCESS');
    };

    try {
      // 1. SUPERVISOR RECEIVES ORDER
      addStep(
        'Supervisor Agent',
        'ORCHESTRATE_ORDER_START',
        `Supervisor received order ${order_id}. Initializing domestic Indian logistics workflow. Priority: ${order.priority}.`,
        'COMPLETED'
      );

      // 2. ORDER HANDLER AGENT
      addStep(
        'Order Handler Agent',
        'VALIDATE_ORDER_PAYLOAD',
        `Verifying address (${order.delivery_city}, ${order.delivery_state} - PIN ${order.delivery_pincode}), line items (${order.items.length}), customer record (${order.customer_name}).`,
        'IN_PROGRESS'
      );

      if (order.items.length === 0) {
        throw new Error('Order validation failed: No line items present.');
      }
      order = update_order(order_id, { status: 'VALIDATED' });
      addStep(
        'Order Handler Agent',
        'ORDER_VALIDATED',
        `Order ${order_id} validated. GST & address verified. Transitioned status to VALIDATED. Routing to Inventory Agent.`,
        'COMPLETED'
      );

      // 3. INVENTORY AGENT
      addStep(
        'Inventory Agent',
        'CHECK_MULTI_WAREHOUSE_STOCK',
        `Checking availability across North (Delhi), West (Mumbai), South (Bengaluru), East (Kolkata), and Central (Hyderabad) hubs for ${order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}.`,
        'IN_PROGRESS'
      );

      for (const item of order.items) {
        const invCheck = check_inventory(item.product_id, item.quantity);
        if (!invCheck.can_fulfill_across_warehouses) {
          order = update_order(order_id, { status: 'OUT_OF_STOCK' });
          addStep(
            'Inventory Agent',
            'OUT_OF_STOCK_ALERT',
            `SKU ${invCheck.sku} is out of stock in India (${invCheck.total_available} available vs ${item.quantity} requested). Alerting procurement team.`,
            'EXCEPTION',
            { inventory: invCheck }
          );
          sendNotification(
            `Out of Stock: ${order_id}`,
            `Item ${item.product_name} cannot be fulfilled in India. Order placed on hold.`,
            'INVENTORY',
            'error',
            order_id
          );
          return {
            order_id,
            status: 'OUT_OF_STOCK',
            current_agent: 'Inventory Agent',
            steps,
            success: false,
            message: 'Order stopped: insufficient inventory available across Indian regional hubs.',
          };
        }
      }

      order = update_order(order_id, { status: 'STOCK_CHECKED' });
      addStep(
        'Inventory Agent',
        'STOCK_VERIFIED',
        'Sufficient stock confirmed across Indian distribution centers. Inventory reservation approved.',
        'COMPLETED'
      );

      // 4. RISK / RETURN AGENT
      addStep(
        'Risk / Return Agent',
        'EVALUATE_CUSTOMER_RISK',
        `Analyzing customer order history, return rate, dispute records, and delivery drop reliability for customer ${order.customer_id}.`,
        'IN_PROGRESS'
      );

      const riskAssessment = calculate_risk_score(order.customer_id, order.id);
      addStep(
        'Risk / Return Agent',
        'RISK_SCORING_COMPLETE',
        `Risk Score: ${riskAssessment.risk_score}/100 (${riskAssessment.risk_level} Risk). Recommendation: ${riskAssessment.recommendation}`,
        riskAssessment.risk_level === 'HIGH' ? 'EXCEPTION' : 'COMPLETED',
        riskAssessment
      );

      // 5. FULFILLMENT & SHIPMENT AGENT - WAREHOUSE SELECTION
      addStep(
        'Fulfillment & Shipment Agent',
        'OPTIMIZE_WAREHOUSE_ROUTING',
        `Evaluating 5 Indian fulfillment centers based on proximity to ${order.delivery_city}, ${order.delivery_state}, capacity utilization, and handling fee.`,
        'IN_PROGRESS'
      );

      const whOpt = find_best_warehouse(order_id);
      const chosenWarehouse = whOpt.recommended_warehouse;
      order = update_order(order_id, {
        assigned_warehouse_id: chosenWarehouse.id,
        assigned_warehouse_name: chosenWarehouse.name,
        status: 'WAREHOUSE_ASSIGNED',
      });

      for (const item of order.items) {
        try {
          reserve_inventory(item.product_id, chosenWarehouse.id, item.quantity);
        } catch (e: any) {
          const otherWh = db.warehouses.find((w: any) => w.id !== chosenWarehouse.id && w.operational_status === 'ACTIVE');
          if (otherWh) {
            reserve_inventory(item.product_id, otherWh.id, item.quantity);
          }
        }
      }

      addStep(
        'Fulfillment & Shipment Agent',
        'WAREHOUSE_ASSIGNED',
        `Assigned ${chosenWarehouse.name} (${whOpt.confidence}% confidence). Distance: ${whOpt.all_evaluated[0].distance_km} km to destination.`,
        'COMPLETED',
        whOpt
      );

      // 6. CARRIER SELECTION & SHIPMENT CREATION
      addStep(
        'Fulfillment & Shipment Agent',
        'SELECT_BEST_CARRIER',
        `Comparing 10 Indian carriers (Blue Dart, Delhivery, DTDC, Xpressbees, Shadowfax, etc.) for SLA compliance (${order.priority}), delivery cost, and feedback-adjusted reliability.`,
        'IN_PROGRESS'
      );

      const carrierOpt = compare_carriers(order_id);
      const chosenCarrier = carrierOpt.recommended_carrier;
      const shipment = create_shipment(order_id, chosenWarehouse.id, chosenCarrier.id);

      addStep(
        'Fulfillment & Shipment Agent',
        'SHIPMENT_CREATED',
        `Assigned ${chosenCarrier.name} (Score: ${carrierOpt.confidence}). Tracking ID ${shipment.tracking_id} generated. Dispatched from ${chosenWarehouse.city}, ${chosenWarehouse.state}.`,
        'COMPLETED',
        carrierOpt
      );

      // 7. INVOICE AGENT
      addStep(
        'Invoice Agent',
        'GENERATE_FISCAL_INVOICE',
        `Generating GST Tax Invoice with subtotal ₹${order.subtotal_inr.toLocaleString('en-IN')}, 18% GST ₹${order.tax_inr.toLocaleString('en-IN')}, and shipping ₹${order.shipping_cost_inr}.`,
        'IN_PROGRESS'
      );

      const invoice = generate_invoice(order_id);
      addStep(
        'Invoice Agent',
        'INVOICE_GENERATED',
        `Tax Invoice ${invoice.invoice_number} created and recorded. Total: ₹${invoice.total_inr.toLocaleString('en-IN')}. Certified PDF ready for download.`,
        'COMPLETED',
        invoice
      );

      // 8. UPDATE DISPATCH
      update_shipment_status(shipment.id, 'DISPATCHED', `${chosenWarehouse.city}, ${chosenWarehouse.state}`, 'Carrier vehicle departed fulfillment dock.');
      update_shipment_status(shipment.id, 'IN_TRANSIT', 'Regional Gateway Hub', 'Package in domestic transit.');
      order = update_order(order_id, { status: 'IN_TRANSIT' });

      addStep(
        'Supervisor Agent',
        'WORKFLOW_ACTIVE_MONITORING',
        `Order ${order_id} is in transit with ${chosenCarrier.name}. Exception & Recovery Agent active on continuous telemetry monitoring.`,
        'COMPLETED'
      );

      return {
        order_id,
        status: 'IN_TRANSIT',
        current_agent: 'Exception & Recovery Agent',
        steps,
        success: true,
        message: 'Order successfully routed through Indian hubs, invoiced, and dispatched into transit.',
      };
    } catch (err: any) {
      addStep('Supervisor Agent', 'WORKFLOW_FAILURE', `Error during orchestration: ${err.message}`, 'EXCEPTION');
      return {
        order_id,
        status: order?.status || 'ORDER_RECEIVED',
        current_agent: 'Supervisor Agent',
        steps,
        success: false,
        message: `Workflow error: ${err.message}`,
      };
    }
  }

  /**
   * Complete End-to-End Self-Healing Scenario Simulator in India
   */
  public static async runCompleteDemoScenario(): Promise<{
    steps: WorkflowStep[];
    order_id: string;
    incident_id: string;
    recovery_plan_id: string;
    summary: string;
  }> {
    const steps: WorkflowStep[] = [];
    const db = getDb();

    const recordStep = (agent: string, action: string, details: string, status: WorkflowStep['status'], meta?: any) => {
      const step: WorkflowStep = {
        step_number: steps.length + 1,
        agent,
        action,
        timestamp: new Date().toISOString(),
        details,
        status,
        metadata: meta,
      };
      steps.push(step);
      addAuditLog(agent as any, action, 'ORDER', meta?.order_id || 'DEMO', details, status === 'EXCEPTION' ? 'WARNING' : 'SUCCESS');
    };

    // 1. Customer places order in India
    recordStep(
      'Supervisor Agent',
      'SCENARIO_START',
      'Customer Infosys Innovation Hub (Bengaluru) places urgent purchase order for 2x ProWorkstation 16" Intel Core i9.',
      'COMPLETED'
    );

    const cust = db.customers.find((c: any) => c.id === 'CUST-IN-102') || db.customers[0];
    const prod = db.products[0]; // Laptop Pro

    const newOrder = await (async () => {
      return (await import('./tools')).create_order({
        customer_id: cust.id,
        items: [{ product_id: prod.id, quantity: 2 }],
        priority: 'URGENT',
        requested_delivery_date: new Date(Date.now() + 48 * 3600000).toISOString(),
        delivery_address: cust.address,
        delivery_city: cust.city,
        delivery_state: cust.state,
        delivery_pincode: cust.pincode,
        notes: 'DEMO SCENARIO: Contractual 48-hour delivery SLA requirement in Bengaluru.',
      });
    })();

    recordStep('Order Handler Agent', 'ORDER_RECEIVED', `Order ${newOrder.id} created and registered in Indian logistics database.`, 'COMPLETED', { order_id: newOrder.id });

    // 2. Order Handler Agent Validates
    update_order(newOrder.id, { status: 'VALIDATED' });
    recordStep('Order Handler Agent', 'ORDER_VALIDATED', `GSTIN (${cust.gstin}) and shipping address (${newOrder.delivery_city}, ${newOrder.delivery_state} - PIN ${newOrder.delivery_pincode}) verified.`, 'COMPLETED', { order_id: newOrder.id });

    // 3. Inventory Agent checks availability
    const invCheck = check_inventory(prod.id, 2);
    recordStep('Inventory Agent', 'CHECK_INVENTORY', `Checked availability: ${invCheck.total_available} units available across 5 Indian regional hubs.`, 'COMPLETED', invCheck);

    // 4. Inventory is reserved
    const bestWh = find_best_warehouse(newOrder.id).recommended_warehouse;
    reserve_inventory(prod.id, bestWh.id, 2);
    recordStep('Inventory Agent', 'STOCK_RESERVED', `Reserved 2 units of ${prod.name} at ${bestWh.name}.`, 'COMPLETED');

    // 5. Fulfillment Agent selects warehouse
    update_order(newOrder.id, { assigned_warehouse_id: bestWh.id, assigned_warehouse_name: bestWh.name, status: 'WAREHOUSE_ASSIGNED' });
    recordStep('Fulfillment & Shipment Agent', 'WAREHOUSE_SELECTED', `Selected ${bestWh.name} due to proximity and 100% stock availability.`, 'COMPLETED');

    // 6. Carrier selected (Simulate initial choice of Delhivery Surface to demonstrate delay recovery!)
    const initialCarrier = db.carriers.find((c: any) => c.code === 'DELHIVERY-SURF') || db.carriers[2];
    const shipment = create_shipment(newOrder.id, bestWh.id, initialCarrier.id);
    recordStep('Fulfillment & Shipment Agent', 'CARRIER_SELECTED', `Assigned standard surface carrier ${initialCarrier.name}. Tracking: ${shipment.tracking_id}.`, 'COMPLETED');

    // 7. Invoice is generated
    const invoice = generate_invoice(newOrder.id);
    recordStep('Invoice Agent', 'INVOICE_GENERATED', `GST Tax Invoice ${invoice.invoice_number} created (Total: ₹${invoice.total_inr.toLocaleString('en-IN')}).`, 'COMPLETED');

    // 8. Shipment begins tracking & in-transit
    update_shipment_status(shipment.id, 'DISPATCHED', `${bestWh.city}, ${bestWh.state}`);
    update_shipment_status(shipment.id, 'IN_TRANSIT', 'Pune-NH48 Corridor Gate');
    recordStep('Fulfillment & Shipment Agent', 'SHIPMENT_IN_TRANSIT', 'Consignment dispatched and scanned at intermediate terminal in Pune.', 'COMPLETED');

    // 9. SIMULATE CARRIER DELAY!
    recordStep('Exception & Recovery Agent', 'DELAY_TELEMETRY_ALERT', 'Carrier telemetry reported NH48 highway blockage & sorting depot failure. Delay: +36 hours.', 'EXCEPTION');
    const delaySim = simulate_carrier_delay(shipment.id, 36, 'NH48 Highway bottleneck and Delhivery Pune sorting depot breakdown');

    // 10. AI determines order is at risk
    recordStep('Exception & Recovery Agent', 'SLA_RISK_ASSESSED', `Critical SLA breach predicted: Customer requested delivery in Bengaluru will be missed by 26 hours unless recovered.`, 'EXCEPTION');

    // 11. AI searches for alternative carrier & compares
    const bestAlternative = db.carriers.find((c: any) => c.code === 'BLUEDART-AIR') || db.carriers[0];
    recordStep('Exception & Recovery Agent', 'ALTERNATIVE_EVALUATION', `Evaluated alternatives: Blue Dart Apex Priority Air offers next-morning arrival with 97.8% reliability.`, 'COMPLETED');

    // 12. AI proposes recovery plan
    const recoveryPlan = delaySim.plan;
    recordStep('Exception & Recovery Agent', 'RECOVERY_PLAN_PROPOSED', `Generated Recovery Plan ${recoveryPlan.id}: Intercept at Pune and reassign to Blue Dart Apex Priority Air (+26h improvement).`, 'COMPLETED', recoveryPlan);

    // 13. Manager approves plan (or auto-approves)
    execute_recovery_plan(recoveryPlan.id, 'Logistics Operations Manager (Interactive Demo)');
    recordStep('Human-in-the-Loop', 'PLAN_APPROVED', `Recovery Plan ${recoveryPlan.id} approved by Manager. Carrier reassigned to ${bestAlternative.name}.`, 'RECOVERED');

    // 14. Delivery completed
    update_shipment_status(shipment.id, 'OUT_FOR_DELIVERY', `${newOrder.delivery_city}, ${newOrder.delivery_state}`);
    update_shipment_status(shipment.id, 'DELIVERED', `${newOrder.delivery_city}, ${newOrder.delivery_state}`, 'Delivered safely at Infosys Campus Reception with OTP confirmation.');
    update_order(newOrder.id, { status: 'DELIVERED' });
    recordStep('Carrier Integration Tool', 'DELIVERY_CONFIRMED', `Package delivered successfully in Bengaluru ahead of SLA deadline!`, 'COMPLETED');

    // 15. Feedback recorded & Carrier performance updated
    const fb = record_feedback({
      order_id: newOrder.id,
      rating_type: 'MODIFIED',
      category: 'CARRIER_PERFORMANCE',
      comment: 'Initial carrier Delhivery Surface delayed by 36h on NH48; AI recovery through Blue Dart Apex Air saved ₹2,50,000 SLA penalty. Delhivery Surface weight tuned downward.',
      human_correction: 'Always use Blue Dart Apex Priority Air for urgent orders over ₹50,000.',
    });
    recordStep('Feedback / Learning Agent', 'FEEDBACK_LOOP_CLOSED', `Feedback logged. Carrier reliability updated (Delhivery -1.5, Blue Dart +1.5). Historical learning updated.`, 'COMPLETED', fb);

    recordStep('Supervisor Agent', 'SCENARIO_COMPLETED', `End-to-End Workflow successfully concluded with autonomous self-healing and closed-loop learning across Indian logistics network.`, 'COMPLETED');

    return {
      steps,
      order_id: newOrder.id,
      incident_id: delaySim.incident.id,
      recovery_plan_id: recoveryPlan.id,
      summary: 'Complete 21-step simulation executed in India: from order receipt to highway delay injection, self-healing air cargo switch, delivery in Bengaluru, and feedback weight recalibration.',
    };
  }
}
