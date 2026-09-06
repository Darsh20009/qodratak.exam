import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface InvoiceProps {
  invoiceNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  planName: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  issueDate: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  status: string;
  onClose?: () => void;
}

export function Invoice({
  invoiceNumber,
  customerName,
  customerEmail,
  customerPhone,
  planName,
  amount,
  currency = 'SAR',
  paymentMethod,
  receiptUrl,
  issueDate,
  startDate,
  endDate,
  status,
  onClose
}: InvoiceProps) {
  const isPending = status === 'pending';
  const isActive = status === 'active';
  const isApprovedInvoice = isActive || status === 'expired';
  
  const documentTitle = isPending
    ? 'إيصال طلب اشتراك'
    : isApprovedInvoice
      ? 'فاتورة اشتراك'
      : 'مستند حالة طلب اشتراك';
  const documentNumber = invoiceNumber || `QDR-${new Date(issueDate).getFullYear()}-${new Date(issueDate).getTime().toString().slice(-6)}`;
  
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: arSA });
    } catch {
      return '-';
    }
  };

  return (
    <div className="bg-white text-gray-900 w-full max-w-3xl mx-auto rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:w-full">
      {/* Print Actions - Hidden in print */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between print:hidden rounded-t-xl" dir="rtl">
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
            <PrinterIcon className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500">
            إغلاق
          </Button>
        )}
      </div>

      {/* Invoice Content */}
      <div className="p-8 md:p-12" dir="rtl">
        {/* Header */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">{documentTitle}</h1>
            <div className="text-gray-500 space-y-1 text-sm font-medium">
              <p>رقم المرجع: <span className="text-gray-900">{documentNumber}</span></p>
              <p>تاريخ الإصدار: <span className="text-gray-900">{formatDate(issueDate)}</span></p>
            </div>
            <div className="mt-4">
              {isPending ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 text-xs">
                  قيد المراجعة
                </Badge>
              ) : isActive ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-xs">
                  مدفوع ومفعل
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1 text-xs">
                  {status === 'expired' ? 'منتهي' : status === 'cancelled' ? 'ملغي' : status}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <img src="/qodratak-logo-transparent.png" alt="قدراتك" className="h-16 w-auto object-contain mb-3" />
            <div className="text-left text-sm text-gray-500 font-medium">
              <p className="text-gray-900 font-bold text-base">منصة قدراتك التعليمية</p>
              <p>المملكة العربية السعودية</p>
              <p>qodratak.sa</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">معلومات العميل</h3>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="font-bold text-gray-900 text-lg mb-1">{customerName}</p>
            {(customerEmail || customerPhone) && (
              <div className="text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-2 mt-2">
                {customerEmail && <p>{customerEmail}</p>}
                {customerPhone && <p dir="ltr" className="text-right">{customerPhone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details Table */}
        <div className="mb-10 overflow-hidden border border-gray-200 rounded-xl">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">الوصف</th>
                <th className="px-6 py-4 font-bold">المدة</th>
                <th className="px-6 py-4 font-bold text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-5">
                  <p className="font-bold text-gray-900 text-base mb-1">اشتراك {planName}</p>
                  <p className="text-gray-500 text-xs">
                    وصول كامل لمحتوى المنصة والاختبارات والمزايا المتقدمة
                  </p>
                </td>
                <td className="px-6 py-5 text-gray-700 whitespace-nowrap">
                  {startDate && endDate ? (
                    <div className="space-y-1">
                      <p>من: {formatDate(startDate)}</p>
                      <p>إلى: {formatDate(endDate)}</p>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-5 text-left font-bold text-gray-900 whitespace-nowrap text-lg">
                  {amount} {currency}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-left font-bold text-gray-700">
                  الإجمالي
                </td>
                <td className="px-6 py-4 text-left font-black text-gray-900 text-xl whitespace-nowrap">
                  {amount} {currency}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {receiptUrl && (
          <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="mb-2 text-sm font-bold text-gray-900">سند التحويل</h3>
            <p className="mb-3 text-xs leading-5 text-gray-500">
              السند المرفق جزء من مستند طلب الاشتراك ويمكن الرجوع إليه عند المراجعة.
            </p>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-blue-700 underline underline-offset-4"
            >
              عرض سند التحويل المرفق
            </a>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 border-t border-gray-100 pt-6">
          <div className="space-y-1 mb-4 sm:mb-0">
            {paymentMethod && (
              <p>
                <span className="font-bold text-gray-700">طريقة الدفع:</span> {
                  paymentMethod === 'bank' ? 'حوالة بنكية' : 
                  paymentMethod === 'card' ? 'بطاقة ائتمانية' : 
                  paymentMethod === 'wallet' ? 'رصيد المحفظة' : 
                  paymentMethod === 'qodratak_pay' ? 'قدراتك باي' : 
                  paymentMethod
                }
              </p>
            )}
            <p>
              <span className="font-bold text-gray-700">حالة المستند:</span> {
               isPending
                 ? 'إيصال استلام طلب - بانتظار التأكيد'
                 : isApprovedInvoice
                   ? 'فاتورة اشتراك معتمدة'
                   : status === 'cancelled'
                     ? 'طلب ملغي'
                     : 'طلب غير معتمد'
              }
            </p>
          </div>
          
          <div className="text-center sm:text-left">
            <p className="font-bold text-gray-900 mb-1">شكراً لثقتكم بقدراتك</p>
            <p className="text-xs">qodratak.sa</p>
          </div>
        </div>
      </div>
      
      {/* Print Styles injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .qodratak-app-shell, .qodratak-page-surface {
            background: white !important;
          }
          .print\\:w-full {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:w-full * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
