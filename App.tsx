
import React, { useState, useMemo } from 'react';
import Layout from './components/Layout';
import DataTable from './components/DataTable';
import { DeliveryPoint, OptimizedRoute, AppState, AppStats } from './types';
import { parseAssignmentCommand, generateRouteExplanation } from './services/geminiService';
import { optimizeRoute, generateGoogleMapsLink } from './utils/routeLogic';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const SAMPLE_DATA: DeliveryPoint[] = [
  { code: 'B1', name: 'مجتمع مسجد النور', address: '123 شارع السلام، وسط المدينة', phone: '555-0101', latitude: 25.276987, longitude: 55.296249 },
  { code: 'B2', name: 'مركز زايد للأيتام', address: '45 طريق التراث، المدينة القديمة', phone: '555-0102', latitude: 25.263158, longitude: 55.297451 },
  { code: 'C1', name: 'دار فاطمة بنت مبارك', address: '78 شارع السكينة', phone: '555-0103', latitude: 25.251234, longitude: 55.312345 },
  { code: 'C2', name: 'سكن طلاب خليفة', address: 'المدينة الجامعية، بلوك 4', phone: '555-0104', latitude: 25.245678, longitude: 55.323456 },
  { code: 'D1', name: 'مأوى إبراهيم الخليل', address: 'المنطقة الصناعية 3، بوابة 9', phone: '555-0105', latitude: 25.289012, longitude: 55.345678 },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    points: [],
    assignments: {},
    isProcessing: false,
  });

  const [command, setCommand] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<string | null>(null);

  const stats = useMemo<AppStats>(() => {
    const totalPoints = state.points.length;
    const assignedPoints = state.points.filter(p => p.deliveryAssigned).length;
    const totalEstimatedTime = assignedPoints * 5;
    return { totalPoints, assignedPoints, totalEstimatedTime };
  }, [state.points]);

  const handleCopyLink = (name: string, link: string) => {
    if (!link) {
      alert("لا يمكن إنشاء رابط لخرائط جوجل لعدم وجود إحداثيات.");
      return;
    }
    navigator.clipboard.writeText(link);
    setCopiedId(name);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = async (name: string) => {
    const element = document.getElementById(`route-card-${name}`);
    if (!element) return;

    setIsCapturing(name);
    try {
      // Small delay to ensure any layout shifts are settled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `مسار_${name}_رمضان.png`;
      link.click();
    } catch (err) {
      console.error("Failed to capture image:", err);
      alert("فشل تحميل الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsCapturing(null);
    }
  };

  const processWorkbook = (workbook: XLSX.WorkBook): DeliveryPoint[] => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    
    if (data.length === 0) return [];

    const headers = data[0].map((h: any) => String(h || '').toLowerCase().trim());
    const findIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

    const idx = {
      code: findIndex(['code', 'id', 'ref', 'كود']),
      name: findIndex(['name', 'recipient', 'contact', 'الاسم', 'المستلم']),
      address: findIndex(['address', 'loc', 'street', 'العنوان']),
      phone: findIndex(['phone', 'tel', 'mobile', 'هاتف', 'جوال']),
      lat: findIndex(['lat', 'latitude', 'y', 'عرض']),
      lng: findIndex(['lng', 'long', 'longitude', 'x', 'طول']),
      assigned: findIndex(['assigned', 'delivery', 'driver', 'معين', 'سائق'])
    };

    return data.slice(1).map((row: any[]) => {
      const getVal = (i: number) => (i >= 0 && row[i] !== undefined ? String(row[i]).trim() : '');
      const latVal = getVal(idx.lat);
      const lngVal = getVal(idx.lng);
      const latitude = latVal ? parseFloat(latVal) : undefined;
      const longitude = lngVal ? parseFloat(lngVal) : undefined;
      const code = getVal(idx.code);
      const name = getVal(idx.name);
      if (!code && !name) return null;

      return {
        code: code || `P${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: name || 'مستلم غير مسمى',
        address: getVal(idx.address) || 'لم يتم تقديم عنوان',
        phone: getVal(idx.phone) || 'غير متوفر',
        latitude: isNaN(latitude as any) ? undefined : latitude,
        longitude: isNaN(longitude as any) ? undefined : longitude,
        deliveryAssigned: getVal(idx.assigned) || undefined,
      } as DeliveryPoint;
    }).filter((p): p is DeliveryPoint => p !== null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const newPoints = processWorkbook(workbook);

        if (newPoints.length > 0) {
          setState(prev => ({ 
            ...prev, 
            points: [...prev.points, ...newPoints],
            error: undefined 
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            error: "تعذر العثور على بيانات صالحة في الملف المرفوع." 
          }));
        }
      } catch (err) {
        setState(prev => ({ ...prev, error: "حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف Excel أو CSV صالح." }));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const loadSampleData = () => {
    setState(prev => ({ ...prev, points: [...prev.points, ...SAMPLE_DATA] }));
  };

  const processCommand = async () => {
    if (!command.trim()) return;
    setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

    try {
      const parsed = await parseAssignmentCommand(command);
      const selectedPoints = state.points.filter(p => 
        parsed.codes.some(c => c.trim().toUpperCase() === p.code.trim().toUpperCase())
      );

      if (selectedPoints.length === 0) {
        throw new Error(`أكواد المواقع [${parsed.codes.join(', ')}] غير موجودة في السجل.`);
      }

      const { ordered, distance } = optimizeRoute(selectedPoints);
      const estimatedTime = ordered.length * 5;

      const explanation = await generateRouteExplanation(ordered, parsed.deliveryName, estimatedTime);
      const googleMapsLink = generateGoogleMapsLink(ordered);

      const route: OptimizedRoute = {
        orderedPoints: ordered,
        totalDistance: distance,
        googleMapsLink,
        explanation,
        estimatedTime
      };

      setState(prev => ({
        ...prev,
        isProcessing: false,
        points: prev.points.map(p => 
          parsed.codes.some(c => c.trim().toUpperCase() === p.code.trim().toUpperCase())
          ? { ...p, deliveryAssigned: parsed.deliveryName }
          : p
        ),
        assignments: {
          ...prev.assignments,
          [parsed.deliveryName]: route
        }
      }));
      setCommand('');

    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "فشل معالجة الأمر. جرب: 'قم بتعيين B1 و B2 للسائق عمر'" 
      }));
    }
  };

  const removePoint = (code: string) => {
    setState(prev => ({
      ...prev,
      points: prev.points.filter(p => p.code !== code)
    }));
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <i className="fa-solid fa-location-dot text-emerald-600 text-xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي النقاط</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalPoints}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl">
            <i className="fa-solid fa-truck-ramp-box text-amber-600 text-xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">تم التعيين</p>
            <p className="text-2xl font-bold text-slate-800">{stats.assignedPoints}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <i className="fa-solid fa-clock text-blue-600 text-xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">الوقت الكلي المقدر</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalEstimatedTime} دقيقة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-file-import text-emerald-600"></i>
                استيراد البيانات
              </h2>
              <button 
                onClick={loadSampleData}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                جرب العينة
              </button>
            </div>
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-slate-200 group-hover:border-emerald-500 bg-slate-50 p-6 rounded-xl text-center transition-all">
                <i className="fa-solid fa-file-excel text-2xl text-slate-300 group-hover:text-emerald-500 mb-2"></i>
                <p className="text-sm font-medium text-slate-600">اضغط لرفع ملف Excel أو CSV</p>
                <p className="text-[10px] text-slate-400 mt-1">يدعم ملفات .xlsx و .xls و .csv بكل اللغات</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-emerald-600"></i>
              التعيين الذكي
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="مثال: قم بتعيين النقاط B1 و B2 للسائق عمر"
                  className="w-full h-28 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm bg-slate-50/50"
                />
              </div>
              {state.error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-100 flex items-start gap-2 animate-pulse">
                  <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                  <span>{state.error}</span>
                </div>
              )}
              <button
                onClick={processCommand}
                disabled={state.isProcessing || !command.trim() || state.points.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex items-center justify-center gap-2"
              >
                {state.isProcessing ? (
                  <><i className="fa-solid fa-spinner animate-spin"></i> جاري التحسين...</>
                ) : (
                  <><i className="fa-solid fa-route"></i> إنشاء المسار</>
                )}
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {Object.keys(state.assignments).length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">خطة التوزيع المحسنة</h2>
                <button 
                  onClick={() => setState(prev => ({ ...prev, assignments: {} }))}
                  className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                >
                  <i className="fa-solid fa-rotate-left"></i> إعادة ضبط المسارات
                </button>
              </div>
              
              {(Object.entries(state.assignments) as [string, OptimizedRoute][]).map(([name, route]) => (
                <div key={name} id={`route-card-${name}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-emerald-800 p-5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-400 text-emerald-900 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
                        {name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{name}</h3>
                        <p className="text-emerald-200 text-[10px] uppercase tracking-widest font-bold">
                          {route.orderedPoints.length} محطات • {route.estimatedTime} دقيقة مقدرة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadImage(name)}
                        disabled={isCapturing === name}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/20 transition-all flex items-center gap-2"
                        title="تحميل كصورة"
                      >
                        {isCapturing === name ? (
                          <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                          <i className="fa-solid fa-image"></i>
                        )}
                        تحميل
                      </button>
                      <button
                        onClick={() => handleCopyLink(name, route.googleMapsLink)}
                        disabled={!route.googleMapsLink}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-sm ${
                          copiedId === name 
                          ? 'bg-amber-400 text-emerald-900 scale-95' 
                          : route.googleMapsLink ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {copiedId === name ? (
                          <><i className="fa-solid fa-check"></i> تم النسخ!</>
                        ) : (
                          <><i className="fa-solid fa-copy"></i> نسخ الرابط</>
                        )}
                      </button>
                      {route.googleMapsLink && (
                        <a 
                          href={route.googleMapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/20 transition-all flex items-center gap-2"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          عرض
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-6 text-right">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border-r-4 border-emerald-500 mb-6">
                      <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
                        {route.explanation}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {route.orderedPoints.map((p, i) => (
                        <div key={p.code} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <div className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-grow text-right">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 text-sm">
                                {p.code}: {p.name}
                                {(p.latitude === undefined || p.longitude === undefined) && (
                                  <span className="mr-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">لا توجد احداثيات خريطة</span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{p.phone}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{p.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
             <DataTable points={state.points} onRemove={removePoint} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
