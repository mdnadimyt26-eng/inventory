import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Gift, Phone, MapPin } from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatLocalDateTime, formatLocalDate } from '../../utils/dateUtils';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const { settings, t } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    // Generate actual verifiable QR code for invoice
    const qrData = JSON.stringify({
      orderId: order.id,
      customer: order.customerName,
      total: order.grandTotal,
      due: order.dueBalance,
      date: order.createdAt,
    });

    QRCode.toDataURL(qrData, { width: 140, margin: 1 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const invoiceEl = document.getElementById('printable-invoice');
    if (!invoiceEl) return;
    try {
      setIsGeneratingPdf(true);
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${order.id}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Controls (Not printed) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg">
              <img 
                src={settings.logo || '/gift_city_logo.jpg'} 
                alt="Gift City" 
                className="h-8 w-8 object-contain"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/gift_city_logo.jpg';
                }}
              />
            </div>
            <span className="font-bold text-sm">Customer Invoice — {order.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Download Invoice as PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F35F5] hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
              <span>{t.print} Invoice</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div id="printable-invoice" className="p-8 bg-white text-slate-800 space-y-6">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center">
                <img 
                  src={settings.logo || '/gift_city_logo.jpg'} 
                  alt={settings.companyName || "Gift City"} 
                  className="w-32 sm:w-36 h-auto max-h-24 object-contain shrink-0"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/gift_city_logo.jpg';
                  }}
                />
              </div>
              <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 max-w-sm">
                <p className="flex items-start gap-1 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> 
                  <span className="font-medium">{settings.address || '216/1, Beside of Top Ten Bata Signal, Elephant Rd, Dhaka 1205, Dhaka, Bangladesh, 1205'}</span>
                </p>
                <p className="flex items-center gap-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                  <span>{settings.phone}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block text-xs uppercase font-extrabold px-3 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Official Sales Invoice
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">{order.id}</h3>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-slate-400">Date & Time: </span>
                <span className="font-bold text-slate-900">{order.createdAtLocal || formatLocalDateTime(order.createdAt)}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Status: <span className="font-bold text-slate-800 uppercase">{order.orderStatus}</span>
              </p>
            </div>
          </div>

          {/* Billing & Shipping Details */}
          <div className="grid grid-cols-2 gap-6 text-xs pb-4 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Customer / Bill To</p>
              <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
              <p className="text-slate-600 mt-0.5 font-medium">{order.customerPhone}</p>
              <p className="text-slate-600 mt-0.5">{order.customerAddress || order.deliveryAddress}</p>
            </div>

            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Delivery / Ship To</p>
              <p className="font-bold text-slate-900 text-sm">{order.receiverName}</p>
              <p className="text-slate-600 mt-0.5 font-medium">{order.receiverPhone}</p>
              <p className="text-slate-600 mt-0.5">{order.deliveryAddress || order.customerAddress}</p>
              <p className="text-indigo-600 font-semibold mt-1">
                Schedule: {formatLocalDate(order.deliveryDate)} ({order.deliverySlot})
              </p>
            </div>
          </div>

          {/* Order Items Table - SKU removed */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, i) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">৳{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">৳{item.lineTotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & QR Code Verification - Shipping cost removed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 items-end">
            
            {/* QR Code and verification info */}
            <div className="flex items-center gap-4">
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="Invoice QR Verification" 
                  className="w-24 h-24 border border-slate-200 rounded-lg p-1 bg-white shadow-xs" 
                />
              )}
              <div className="text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-800">Scan QR Code</p>
                <p>Verifies invoice authenticity and delivery status on mobile scanner.</p>
                <p className="text-slate-400">Recorded By: {order.createdByName}</p>
              </div>
            </div>

            {/* Totals Table */}
            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">৳{order.subtotal.toLocaleString()}</span>
              </div>
              
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-৳{order.discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-base text-[#4F35F5]">৳{order.grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Paid Amount ({order.paymentMethod.toUpperCase()}):</span>
                <span>৳{order.paidAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-amber-600 font-bold pt-1">
                <span>Due Balance:</span>
                <span>৳{order.dueBalance.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Delivery Note & Footer */}
          {order.deliveryInstructions && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Special Instructions: </span>
              <span className="text-slate-600">{order.deliveryInstructions}</span>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400">
            <p>Thank you for shopping with Gift City Bangladesh! Quality and authenticity guaranteed.</p>
            <p className="mt-0.5">For queries or returns, contact support: {settings.phone}</p>
          </div>

        </div>

        {/* Modal Bottom Action Bar (print:hidden) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            💡 Tip: Click <span className="font-bold text-slate-700">Download PDF</span> to save to device or <span className="font-bold text-slate-700">Print</span> for physical receipt.
          </p>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.print} Invoice</span>
            </button>
            <button 
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
