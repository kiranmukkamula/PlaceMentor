import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <nav className="w-full bg-white shadow py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">PlaceMentor</h1>
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium cursor-pointer">Login</Link>
          <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">Get Started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Your Bridge to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">Dream Companies</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
          Track placement drives, check eligibility, apply with a single click, and use our AI Resume Analyzer to ensure you're a perfect match.
        </p>
        <div className="flex gap-4">
          <Link to="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1 transition transform duration-200 cursor-pointer">
            Student Registration
          </Link>
          <Link to="/login" className="bg-white text-indigo-600 border border-indigo-200 px-8 py-4 rounded-xl font-semibold text-lg hover:border-indigo-600 hover:bg-indigo-50 transition">
            Admin Portal
          </Link>
        </div>
      </main>
    </div>
  );
}
