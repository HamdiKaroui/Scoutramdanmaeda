
import React from 'react';
import { DeliveryPoint } from '../types';
import * as XLSX from 'xlsx';

interface DataTableProps {
  points: DeliveryPoint[];
  onRemove: (code: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ points, onRemove }) => {
  const downloadExcel = () => {
    // Prepare data for export with Arabic headers
    const exportData = points.map(p => ({
      'الكود': p.code,
      'اسم المستلم': p.name,
      'رقم الهاتف': p.phone,
      'الحالة / معين لـ': p.deliveryAssigned || 'غير معين',
      'العنوان': p.address,
      'خط العرض': p.latitude || 'غير متوفر',
      'خط الطول': p.longitude || 'غير متوفر'
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "سجل التوزيع");

    // Fix column widths for better readability
    const wscols = [
      { wch: 10 }, // الكود
      { wch: 25 }, // اسم المستلم
      { wch: 15 }, // رقم الهاتف
      { wch: 20 }, // الحالة
      { wch: 40 }, // العنوان
      { wch: 15 }, // خط العرض
      { wch: 15 }  // خط الطول
    ];
    worksheet['!cols'] = wscols;

    // Generate and download file
    XLSX.writeFile(workbook, `سجل_توزيع_رمضان_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`);
  };

  if (points.length === 0) return (
    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-database text-slate-300 text-2xl"></i>
      </div>
      <p className="text-slate-500 font-medium">لا توجد مواقع في السجل</p>
      <p className="text-slate-400 text-sm mt-1">قم برفع ملف Excel أو CSV للبدء.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-emerald-600"></i>
          سجل التوزيع ({points.length})
        </h3>
        <button 
          onClick={downloadExcel}
          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg border border-emerald-100 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-file-excel"></i>
          تحميل ملف Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-100/50 text-slate-500 uppercase text-xs font-bold">
              <th className="px-6 py-3">الكود</th>
              <th className="px-6 py-3">المستلم</th>
              <th className="px-6 py-3 text-center">الحالة</th>
              <th className="px-6 py-3">العنوان</th>
              <th className="px-6 py-3 text-left">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {points.map((p) => (
              <tr key={p.code} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-mono font-bold text-emerald-700">{p.code}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{p.name}</span>
                    {(p.latitude === undefined || p.longitude === undefined) && (
                      <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-bold whitespace-nowrap">
                        لا توجد احداثيات خريطة
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{p.phone}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {p.deliveryAssigned ? (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {p.deliveryAssigned}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      غير معين
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  <div className="truncate max-w-[200px]" title={p.address}>{p.address}</div>
                </td>
                <td className="px-6 py-4 text-left">
                  <button 
                    onClick={() => onRemove(p.code)}
                    className="text-slate-300 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
