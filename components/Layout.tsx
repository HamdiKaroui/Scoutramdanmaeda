
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header-bg text-white shadow-xl sticky top-0 z-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
           <i className="fa-solid fa-star absolute top-4 right-10 text-xs"></i>
           <i className="fa-solid fa-star absolute top-12 right-24 text-[8px]"></i>
           <i className="fa-solid fa-moon absolute top-6 left-16 text-2xl -rotate-12"></i>
           <i className="fa-solid fa-mosque absolute bottom-2 left-10 text-4xl opacity-20"></i>
        </div>
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-amber-400 p-3 rounded-2xl shadow-lg -rotate-3 group hover:rotate-0 transition-transform duration-300">
              <i className="fa-solid fa-crescent text-emerald-900 text-3xl"></i>
            </div>
            <div>
              <h1 className="ramadan-title text-3xl font-bold tracking-tight text-white leading-none mb-1"> مائدة الافطار 5.0 </h1>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">   فوج الكشافة برجيش</p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
             <div className="hidden lg:flex flex-col items-start">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">رمضان كريم</span>
                <span className="text-emerald-100 text-[10px] font-medium opacity-60"> وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا ۖ وَسَبِّحْ بِحَمْدِ رَبِّكَ حِينَ تَقُومُ .</span>
             </div>
             <div className="h-10 w-[1px] bg-white/20 hidden lg:block"></div>
             <div className="flex items-center gap-2 bg-emerald-950/40 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
                <span className="text-xs font-bold">الذكاء الاصطناعي نشط</span>
             </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-12 mb-8 opacity-40">
            <div className="flex flex-col items-center gap-2 group cursor-default">
               <i className="fa-solid fa-hands-holding-child text-3xl group-hover:text-amber-400 transition-colors"></i>
               <span className="text-[10px] uppercase font-bold tracking-widest">صدقة</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default">
               <i className="fa-solid fa-utensils text-3xl group-hover:text-amber-400 transition-colors"></i>
               <span className="text-[10px] uppercase font-bold tracking-widest">إطعام</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default">
               <i className="fa-solid fa-compass text-3xl group-hover:text-amber-400 transition-colors"></i>
               <span className="text-[10px] uppercase font-bold tracking-widest">مثالي</span>
            </div>
          </div>
          <p className="text-sm font-medium">تقبل الله منا ومنكم صالح الأعمال في هذا الشهر الفضيل.</p>
          <p className="text-[10px] mt-2 opacity-50 uppercase tracking-widest"> وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِۚ </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
