# Smart Logistics Handler Agent 🇮🇳

An autonomous, multi-agent AI logistics management system that simulates, orchestrates, and automates the complete order-to-delivery lifecycle for e-commerce and supply-chain operations across India.

Rather than a simple chatbot or static dashboard, the **Smart Logistics Handler Agent** connects specialized AI agents through a central supervisor orchestrator, integrates directly with a persistent relational database, performs real carrier routing, handles exceptions via a self-healing loop, and continually adapts through operational feedback.

---

## 🏗️ Multi-Agent Architecture

```
                       ┌──────────────────────────────┐
                       │  Supervisor / Orchestrator   │
                       │           Agent              │
                       └──────────────┬───────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼──────┐                ┌──────▼──────┐                ┌──────▼──────┐
│Order Handler│                │  Inventory  │                │Risk / Return│
│    Agent    │───────►────────│    Agent    │───────►────────│    Agent    │
└─────────────┘                └─────────────┘                └──────┬──────┘
                                                                     │
┌─────────────┐                ┌─────────────┐                ┌──────▼──────┐
│  Feedback & │                │   Invoice   │                │Fulfillment &│
│  Learning   │◄───────◄───────│    Agent    │◄───────◄───────│  Shipment   │
└─────────────┘                └─────────────┘                └─────────────┘
       ▲                                                             │
       │               ┌──────────────────────────────┐              │
       └───────────────┤ Exception & Recovery Agent   │◄─────────────┘
                       │     (Self-Healing Loop)      │
                       └──────────────────────────────┘
```

The system coordinates 7 specialized agents under a central authoritative supervisor:

1. **Supervisor / Orchestrator Agent**:
   - Central state-machine coordinator.
   - Monitors state transitions (`ORDER_RECEIVED` ➔ `VALIDATED` ➔ `STOCK_CHECKED` ➔ `WAREHOUSE_ASSIGNED` ➔ `CARRIER_ASSIGNED` ➔ `DISPATCHED` ➔ `IN_TRANSIT` ➔ `DELIVERED`).
   - Ensures orders progress deterministically, detects delays, and maintains a timestamped audit trail.

2. **Order Handler Agent**:
   - Ingests customer purchase orders.
   - Validates shipping addresses, 6-digit Indian PIN codes, customer verification, and GSTINs.
   - Computes order totals and transitions state to `VALIDATED`.

3. **Inventory Agent**:
   - Checks real-time stock across 5 strategic regional fulfillment hubs.
   - Performs atomic reservations, releases stock upon cancellation, and computes single-hub vs. split-fulfillment logic.
   - Detects low-stock and out-of-stock scenarios, preventing overselling.

4. **Risk / Return Agent**:
   - Calculates a multi-factor behavioral risk score (0–100) using return frequency, disputes, and failed delivery history.
   - Strictly objective scoring without defamatory labeling.
   - Manages Return Merchandise Authorization (RMA) workflows, policy window verification, and reverse logistics label generation.

5. **Fulfillment & Shipment Agent**:
   - Chooses the optimal regional hub based on proximity, stock level, and handling costs.
   - Evaluates and selects from 10 top Indian logistics carriers (Blue Dart, Delhivery, DTDC, Shadowfax, etc.) balancing transit SLA, weight-based rates, and reliability.
   - Generates tracking manifests and logs telemetry milestones.

6. **Invoice Agent**:
   - Issues itemized commercial tax invoices following the Indian Goods & Services Tax (GST) structure:
     - **Intrastate**: CGST (9%) + SGST (9%)
     - **Interstate**: IGST (18%)
   - Generates and downloads official certified PDF invoices with barcodes and company credentials.

7. **Exception & Recovery Agent (Self-Healing Loop)**:
   - Continuously monitors active shipment telemetry.
   - Detects delays (e.g., highway bottlenecks, vehicle breakdowns) before contractual SLA breach.
   - Formulates structured recovery plans (root cause, quantitative evidence, carrier alternatives comparison).
   - Reassigns shipments to expedited options (e.g., intercepting ground transit and reassigning to Blue Dart Air).

8. **Feedback / Learning Agent**:
   - Closes the operational loop post-delivery.
   - Captures delivery satisfaction, on-time variances, and human operator corrections.
   - Dynamically updates carrier reliability weights and route preference offsets in the database for subsequent orders.

---

## 🇮🇳 Pan-India Logistics Infrastructure

The system operates exclusively within India's domestic supply-chain ecosystem:

### 1. Strategic Regional Fulfillment Hubs
- **North Hub**: Delhi-NCR (Gurugram Mega Depository, Haryana)
- **West Hub**: Mumbai (Bhiwandi Logistics Bay, Maharashtra)
- **South Hub**: Bengaluru (Hosur Highway Terminal, Karnataka)
- **East Hub**: Kolkata (Dankuni Industrial Park, West Bengal)
- **Central Hub**: Hyderabad (Shamshabad Cargo Bay, Telangana)

### 2. Major Consumer Delivery Nodes
- Mumbai, Bengaluru, New Delhi, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Noida, Chandigarh, Coimbatore, Nagpur, Indore, and Thiruvananthapuram.

### 3. Integrated Logistics Carriers
- **Blue Dart Apex Priority Air** (Air express, next-morning delivery)
- **Delhivery Expedited Express** (Fast-track inter-state road network)
- **Delhivery Surface Ground** (Standard surface linehaul)
- **DTDC Express Prime Gold** (Air priority transit)
- **Shadowfax City Sprint & Intra-State** (Hyperlocal & intra-state green EV fleet)
- **Ecom Express E-Fulfilment** (E-commerce delivery network)
- **Xpressbees Priority FastTrack** (Express delivery network)
- **Safexpress Heavy Cargo** (Supply chain & bulk linehaul)
- **Gati-KWE Express Surface** (Intermodal road/rail freight)
- **Ekart Logistics NextDay Air** (Next-day air linehaul)

---

## 🚀 Key Features & Capabilities

- **Interactive Pan-India Geographic Map**: Visual SVG network displaying the 5 fulfillment hubs, consumer cities, active linehaul routes, and real-time highway bottleneck alerts (e.g., NH48 Pune landslide).
- **Interactive 21-Step Simulation Player**: One-click end-to-end simulation executing the complete order lifecycle:
  1. Customer order placement in Bengaluru
  2. Order Handler validation & GST check
  3. Inventory availability across hubs
  4. Stock reservation in Mumbai depot
  5. Carrier assignment (Delhivery Surface)
  6. GST Tax Invoice creation
  7. In-transit departure from Mumbai
  8. **Delay injection** on NH48 highway corridor
  9. **Exception Agent** detects 36-hour SLA breach
  10. **Recovery Plan** generated comparing alternative carriers
  11. Carrier reassigned to **Blue Dart Apex Priority Air**
  12. Next-morning delivery completed
  13. Customer feedback logged & carrier reliability score adapted
- **Ground Truth Relational Database**: Real database tools for orders, inventory, carriers, shipments, invoices, and incidents (no invented quantities or IDs).
- **Natural Language Logistics AI Drawer**: Gemini-powered conversational assistant with registered tool declarations (`get_orders`, `check_inventory`, `find_best_warehouse`, `compare_carriers`, `detect_delayed_orders`, `generate_recovery_plan`, `get_invoice`).
- **GST Invoice PDF Engine**: Client-side certified PDF generation using `jspdf` containing full HSN codes, GSTINs, and CGST/SGST/IGST breakdowns.
- **Multimodal Purchase Order Ingestion**: Ingest raw text or scanned invoice/PO documents to extract customer details, items, addresses, and PIN codes.
- **Assisted vs. Autonomous Mode Switcher**:
  - *Assisted Mode*: High-impact carrier switches require operator approval.
  - *Autonomous Mode*: AI auto-executes low- and medium-risk recovery actions.

---

## 🛠️ Technology Stack

- **Runtime & Full-Stack Server**: Node.js, Express, TypeScript, `tsx`
- **Frontend Framework**: React 19, Vite, Tailwind CSS v4
- **Generative AI & Tools**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`)
- **PDF Generation**: `jspdf`
- **Icons & Animation**: `lucide-react`, `motion`
- **Data Persistence**: Local JSON relational database with seed data generation and reset capabilities.

---

## 🏃 Getting Started

### Prerequisites
- Node.js (version 20+ recommended)
- npm or bun

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. Run the development server (runs full-stack Express + Vite dev server on port 3000):
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status, database entity counts, and current mode |
| `GET` | `/api/orders` | Fetch orders with status, zone, and search filters |
| `POST` | `/api/orders` | Create a new purchase order with domestic PIN validation |
| `POST` | `/api/orders/:id/process` | Run supervisor pipeline for an order |
| `GET` | `/api/inventory` | Multi-warehouse inventory records |
| `POST` | `/api/inventory/check` | Test SKU availability across all 5 Indian hubs |
| `GET` | `/api/warehouses` | List of regional fulfillment hubs and utilization stats |
| `GET` | `/api/carriers` | Top Indian carriers with baseline and learned reliability |
| `GET` | `/api/shipments` | Active and historical package manifests and telemetry |
| `POST` | `/api/shipments/:id/delay` | Simulate highway/terminal delay on an active shipment |
| `GET` | `/api/incidents` | List of detected incidents and recovery plans |
| `POST` | `/api/recovery-plans/:id/execute` | Approve and execute carrier reassignment recovery |
| `GET` | `/api/invoices/:orderId` | Retrieve GST commercial invoice for an order |
| `POST` | `/api/feedback` | Record post-delivery feedback and adapt carrier weights |
| `POST` | `/api/demo/run-scenario` | Execute full 21-step autonomous self-healing scenario |
| `POST` | `/api/chat` | Natural language tool-calling interface with Gemini |
| `POST` | `/api/system/reset` | Reset database to clean Indian seed state |

---

## 📄 License
Apache-2.0
