import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, GraduationCap, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center selection:bg-emerald-100 selection:text-emerald-900">
      {/* Luxury Glass Navbar */}
      <nav className="w-full bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 font-black text-lg">
            P
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 bg-clip-text text-transparent">
            PlaceMentor
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-slate-600 hover:text-emerald-700 font-semibold px-4 py-2 rounded-xl hover:bg-emerald-50/60 transition-all duration-200 cursor-pointer">
            Sign In
          </Link>
          <Link to="/register" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 cursor-pointer">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl py-16">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 shadow-xs">
          <Sparkles size={14} className="text-emerald-600 animate-pulse" /> AI-POWERED CAMPUS PLACEMENT PLATFORM
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          Your Gateway to <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 bg-clip-text text-transparent">
            Dream Tier-1 Companies
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10">
          Track placement drives in real-time, check eligibility instantly, apply with one click, and harness our NLP Resume Matching engine to land top offers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/register" className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
            Student Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/admin/login" className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-2xl font-bold text-lg shadow-md shadow-slate-900/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
            Admin Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Smart AI Ranking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Advanced NLP semantic matching aligns candidate resume section vectors against job descriptions.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Drives & Eligibility</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Students can check live CTC, CGPA criteria, application deadlines, and apply in seconds.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Interview Rounds</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Real-time socket updates for round advancements, status changes, and interview feedback.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

