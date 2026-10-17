import React from 'react';
import { Invoice } from '../types';
import jsPDF from 'jspdf';
import { Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<Props> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const downloadPdf = () => {
    const doc = new jsPDF();

    // Header Branding
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SMART LOGISTICS AGENT (INDIA)', 18, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Autonomous Multi-Agent Domestic Logistics Operations Network', 18, 25);
    doc.text(`GSTIN: ${invoice.gstin || '27AABCS9988Z1Z5'} • CIN: U74999MH2026PTC198421`, 18, 31);
    doc.text('Corporate Hub: Bhiwandi Mega Logistic Park, Maharashtra - 421302', 18, 37);

    // Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TAX INVOICE: ${invoice.invoice_number}`, 18, 54);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Reference: ${invoice.order_id}`, 18, 62);
    doc.text(`Invoice Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, 18, 68);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, 18, 74);
    doc.text(`Payment Status: ${invoice.status}`, 18, 80);

    // Billed To
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To (Consignee):', 115, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer_name, 115, 62);
    doc.text(`Customer ID: ${invoice.customer_id}`, 115, 68);
    if (invoice.customer_gstin) {
      doc.text(`Customer GSTIN: ${invoice.customer_gstin}`, 115, 74);
    }
    doc.text('Registered Office & Delivery Facility, India', 115, 80);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(18, 92, 174, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Item Description', 22, 97.5);
    doc.text('Qty', 112, 97.5);
    doc.text('Rate (INR)', 128, 97.5);
    doc.text('Amount (INR)', 162, 97.5);

    // Table Rows
    let y = 106;
    doc.setFont('helvetica', 'normal');
    invoice.items.forEach(item => {
      doc.text(item.product_name.slice(0, 38), 22, y);
      doc.text(String(item.quantity), 114, y);
      doc.text(`INR ${item.unit_price_inr.toLocaleString('en-IN')}`, 128, y);
      doc.text(`INR ${item.total_price_inr.toLocaleString('en-IN')}`, 162, y);
      y += 8;
    });

    // Divider
    doc.setDrawColor(203, 213, 225);
    doc.line(18, y + 2, 192, y + 2);
    y += 10;

    // Totals
    const rightColX = 125;
    const rightValX = 162;
    doc.text('Taxable Subtotal:', rightColX, y);
    doc.text(`INR ${invoice.subtotal_inr.toLocaleString('en-IN')}`, rightValX, y);
    y += 6;

    if (invoice.discount_inr > 0) {
      doc.text('Volume Discount:', rightColX, y);
      doc.text(`-INR ${invoice.discount_inr.toLocaleString('en-IN')}`, rightValX, y);
      y += 6;
    }

    if (invoice.igst_inr > 0) {
      doc.text('IGST (18% Interstate):', rightColX, y);
      doc.text(`INR ${invoice.igst_inr.toLocaleString('en-IN')}`, rightValX, y);
      y += 6;
    } else {
      doc.text('CGST (9%):', rightColX, y);
      doc.text(`INR ${invoice.cgst_inr.toLocaleString('en-IN')}`, rightValX, y);
      y += 6;
      doc.text('SGST (9%):', rightColX, y);
      doc.text(`INR ${invoice.sgst_inr.toLocaleString('en-IN')}`, rightValX, y);
      y += 6;
    }

    doc.text('Domestic Freight (India):', rightColX, y);
    doc.text(`INR ${invoice.shipping_inr.toLocaleString('en-IN')}`, rightValX, y);
    y += 8;

    doc.setFillColor(248, 250, 252);
    doc.rect(rightColX - 5, y - 5, 72, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Invoice Due:', rightColX, y + 2);
    doc.text(`INR ${invoice.total_inr.toLocaleString('en-IN')}`, rightValX, y + 2);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Computer generated GST Tax Invoice issued by Smart Logistics AI Agent. Subject to Mumbai Jurisdiction.',
      18,
      270
    );

    doc.save(`${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
              <p className="text-xs text-slate-400">Order: {invoice.order_id} • GSTIN: {invoice.gstin}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div>
              <span className="text-slate-500 text-xs uppercase font-medium">Billed To (Consignee)</span>
              <p className="font-semibold text-slate-800">{invoice.customer_name}</p>
              {invoice.customer_gstin && (
                <p className="text-slate-600 text-xs font-mono">GSTIN: {invoice.customer_gstin}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-xs uppercase font-medium">Payment & Tax Type</span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">{invoice.status}</span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {invoice.igst_inr > 0 ? 'Interstate (IGST 18%)' : 'Intrastate (CGST 9% + SGST 9%)'}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Itemized Products</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.product_name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">₹{it.unit_price_inr.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">₹{it.total_price_inr.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax breakdown */}
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal</span>
                <span>₹{invoice.subtotal_inr.toLocaleString('en-IN')}</span>
              </div>
              {invoice.discount_inr > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Volume Discount</span>
                  <span>-₹{invoice.discount_inr.toLocaleString('en-IN')}</span>
                </div>
              )}
              {invoice.igst_inr > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>IGST (18%)</span>
                  <span>₹{invoice.igst_inr.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%)</span>
                    <span>₹{invoice.cgst_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%)</span>
                    <span>₹{invoice.sgst_inr.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Domestic Shipping</span>
                <span>₹{invoice.shipping_inr.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount Due</span>
                <span>₹{invoice.total_inr.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            GST compliant tax invoice generated by Invoice Agent.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={downloadPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Download GST Invoice PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
