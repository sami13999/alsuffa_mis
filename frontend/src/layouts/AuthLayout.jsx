import React from 'react';
import { School, ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/50 mb-4">
          <School className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Al Suffa Education System
        </h1>
        <p className="mt-1 text-sm font-medium text-emerald-400 uppercase tracking-widest">
          Management Information System (MIS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; 2026 Al Suffa Education System. Secure Enterprise Portal.
        </p>
      </div>
    </div>
  );
}

