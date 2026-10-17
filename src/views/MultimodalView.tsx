import React, { useState } from 'react';
import { api } from '../api';
import { Product, Customer } from '../types';
import {
  FileUp,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Send,
  Edit2,
} from 'lucide-react';

interface Props {
  products: Product[];
  customers: Customer[];
  onOrderCreated: (orderId: string) => void;
}

export const MultimodalView: React.FC<Props> = ({ products, customers, onOrderCreated }) => {
  const [textContent, setTextContent] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const samplePOs = [
    {
      title: 'PO #8812 - Tata Consultancy & Systems (Urgent)',
      text: `PURCHASE ORDER\nPO Number: PO-IN-2026-8812\nBuyer: Tata Consultancy & Systems Ltd\nGSTIN: 27AABCT3518Q1Z8\nEmail: procurement@tatacs.in\nShipping Address: Bandra Kurla Complex, Plot C-28, Mumbai, Maharashtra 400051\nPriority: URGENT\nRequested Delivery Date: 2026-10-20\nLine Items:\n1. ProWorkstation 16" Intel Core i9 Ultra | Qty: 2 | Unit Price: INR 124,999.00\nSpecial Instructions: Guaranteed 48h delivery SLA to Mumbai BKC. Expedite via Blue Dart Air if possible.`,
    },
    {
      title: 'PO #4321 - Serum Labs Biotech (Standard)',
      text: `PURCHASE ORDER\nPO Number: PO-IN-2026-4321\nBuyer: Serum Labs Biotech\nGSTIN: 27AABCS1234F1Z1\nEmail: receiving@serumlabs.in\nShipping Address: 212/2 Hadapsar Commercial Enclave, Pune, Maharashtra 411028\nPriority: STANDARD\nRequested Delivery Date: 2026-10-25\nLine Items:\n1. Clinical Infrared High-Speed Thermometer | Qty: 10 | Unit Price: INR 3,499.00\n2. Portable Clinical Pulse Oximeter Kit | Qty: 5 | Unit Price: INR 4,999.00`,
    },
    {
      title: 'PO #9910 - Infosys Innovation Hub (Expedited)',
      text: `PURCHASE ORDER\nPO Number: PO-IN-2026-9910\nBuyer: Infosys Innovation Hub\nGSTIN: 29AAACI4321A1ZP\nEmail: hardware@infosyshub.in\nShipping Address: 44 Electronics City, Hosur Road, Bengaluru, Karnataka 560100\nPriority: EXPEDITED\nRequested Delivery Date: 2026-10-22\nLine Items:\n1. Industrial Solid-State LiDAR 3D Scanner | Qty: 2 | Unit Price: INR 74,500.00\n2. Cobot 6-Axis Robotic Pick & Place Arm | Qty: 1 | Unit Price: INR 285,000.00`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
        setTextContent(`[Image File Uploaded: ${file.name}]`);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setTextContent(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleRunExtraction = async () => {
    if (!textContent && !imageBase64) return;
    setIsExtracting(true);
    setExtractedData(null);
    try {
      const res = await api.extractOrderFromDocument({
        text_content: textContent,
        image_base64: imageBase64 || undefined,
      });
      setExtractedData(res);
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmAndCreate = async () => {
    if (!extractedData) return;
    setIsSubmitting(true);
    try {
      // Find matching customer
      const cust =
        customers.find(c => c.name.toLowerCase().includes(extractedData.customer_name.toLowerCase())) ||
        customers[0];

      const created = await api.createOrder({
        customer_id: cust.id,
        items: extractedData.items.map((i: any) => ({
          product_id: i.product_id || products[0].id,
          quantity: i.quantity || 1,
        })),
        priority: extractedData.priority || 'STANDARD',
        requested_delivery_date: extractedData.requested_delivery_date,
        delivery_address: extractedData.delivery_address,
        delivery_city: extractedData.delivery_city,
        delivery_state: extractedData.delivery_state,
        delivery_pincode: extractedData.delivery_pincode || extractedData.delivery_zip || '560100',
        notes: `Extracted via Multimodal Vision Agent. ${extractedData.notes || ''}`,
      });

      alert(`Purchase Order validated! Created order ${created.id}. Now routing to Order Handler Agent.`);
      onOrderCreated(created.id);
    } catch (err: any) {
      alert(`Failed to create order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multimodal Vision & Document Ingestion (OCR & Entity Extraction)</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Automated Purchase Order & Invoice Ingestion
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ingest unstructured purchase orders, paper manifests, and invoice PDFs. The multimodal agent extracts buyers, line item quantities, delivery deadlines, and destination coordinates with human-in-the-loop validation before committing into the system.
          </p>
        </div>
      </div>

      {/* Two Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Document Pane */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Upload or Paste Document</h3>
            <span className="text-[11px] text-slate-400">PDFs, PNG, JPG, or Text</span>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              1-Click Sample Purchase Orders
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePOs.map((po, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTextContent(po.text);
                    setImageBase64(null);
                  }}
                  className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  {po.title}
                </button>
              ))}
            </div>
          </div>

          {/* File drag / upload input */}
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center transition-colors">
            <input
              type="file"
              accept="image/*,.pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-1 block">
              <FileUp className="w-8 h-8 text-indigo-500 mx-auto" />
              <span className="text-xs font-semibold text-slate-700 block">
                Click to upload PO image or PDF invoice
              </span>
              <span className="text-[10px] text-slate-400 block">
                Supports scans, camera photos, or plain text receipts
              </span>
            </label>
          </div>

          {/* Preview Image if selected */}
          {imageBase64 && (
            <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 relative">
              <img
                src={imageBase64}
                alt="Uploaded PO preview"
                className="max-h-48 rounded-lg mx-auto object-contain"
              />
              <button
                onClick={() => setImageBase64(null)}
                className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md"
              >
                Remove
              </button>
            </div>
          )}

          {/* Raw Text Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Document Text Representation
            </label>
            <textarea
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              rows={8}
              placeholder="Paste raw PO text or email order content here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleRunExtraction}
            disabled={isExtracting || (!textContent && !imageBase64)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Multimodal Agent Extracting Fields...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Multimodal Vision Extraction</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Extracted & Validated Order Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Structured Entity Extraction Form</h3>
            {extractedData && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Confidence: {extractedData.confidence}%
              </span>
            )}
          </div>

          {!extractedData ? (
            <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>No document extracted yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload a document or pick a sample PO on the left to extract structured entities.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Entities extracted! You can verify and edit any fields below before sending to Order Handler Agent.
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer / Organization Name</label>
                <input
                  type="text"
                  value={extractedData.customer_name}
                  onChange={e => setExtractedData({ ...extractedData, customer_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={extractedData.customer_email}
                    onChange={e => setExtractedData({ ...extractedData, customer_email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Priority</label>
                  <select
                    value={extractedData.priority}
                    onChange={e => setExtractedData({ ...extractedData, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold"
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="EXPEDITED">EXPEDITED</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Shipping Destination</label>
                <input
                  type="text"
                  value={extractedData.delivery_address}
                  onChange={e => setExtractedData({ ...extractedData, delivery_address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={extractedData.delivery_city}
                    onChange={e => setExtractedData({ ...extractedData, delivery_city: e.target.value })}
                    placeholder="City"
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                  />
                  <input
                    type="text"
                    value={extractedData.delivery_state}
                    onChange={e => setExtractedData({ ...extractedData, delivery_state: e.target.value })}
                    placeholder="State"
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                  />
                  <input
                    type="text"
                    value={extractedData.delivery_pincode || extractedData.delivery_zip}
                    onChange={e => setExtractedData({ ...extractedData, delivery_pincode: e.target.value, delivery_zip: e.target.value })}
                    placeholder="PIN Code"
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Extracted line items */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Extracted Line Items</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {extractedData.items.map((it: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{it.product_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono">Qty: {it.quantity}</span>
                        <span className="font-bold text-slate-900">₹{(it.unit_price || 0).toLocaleString('en-IN')} ea</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirmAndCreate}
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Validate & Ingest into Order Handler Agent</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
