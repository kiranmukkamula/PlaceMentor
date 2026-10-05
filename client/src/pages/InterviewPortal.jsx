import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { CheckCircle2, ShieldAlert, Sparkles, Building2, UserCheck, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || '/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const InterviewPortal = () => {
  const { token } = useParams();
  const [portalState, setPortalState] = useState('LOADING'); // LOADING, ACTIVE, LOCKED, COMPLETED
  const [company, setCompany] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(''); // NEXT_ROUND or FINAL_SELECT

  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/interview/state/${token}`);
      if (res.data.success) {
        setPortalState(res.data.state);
        setCompany(res.data.company);
        if (res.data.students) setStudents(res.data.students);
        setSelectedStudents(new Set());
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading interview state');
      setPortalState('ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();

    const socket = io(SOCKET_URL);
    socket.emit('join-interview-room', token);

    socket.on('next-round-started', () => {
      fetchState();
    });

    socket.on('hiring-completed', () => {
      fetchState();
    });

    return () => socket.disconnect();
  }, [token]);

  const toggleStudent = (id) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const handleActionClick = (type) => {
    setActionType(type);
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    try {
      setShowConfirmModal(false);
      setPortalState('LOADING');
      
      const endpoint = actionType === 'NEXT_ROUND' ? 'next-round' : 'final-select';
      const payload = {
        token,
        selectedStudentIds: Array.from(selectedStudents),
        allStudentIds: students.map(s => s.student_id)
      };

      await axios.post(`${API_URL}/interview/${endpoint}`, payload);
      setPortalState('LOCKED');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setPortalState('ERROR');
    }
  };

  if (portalState === 'LOADING' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-bold text-slate-600 animate-pulse flex items-center gap-2">
          <Sparkles className="text-emerald-600 animate-spin" size={20} /> Loading Interview Portal...
        </div>
      </div>
    );
  }

  if (portalState === 'ERROR') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-rose-50 text-rose-700 border border-rose-200 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <ShieldAlert size={48} className="mx-auto text-rose-600 mb-3" />
          <h2 className="text-2xl font-black mb-2">Access Error</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (portalState === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-emerald-950/5 max-w-md w-full text-center border border-emerald-200">
          <CheckCircle2 size={56} className="mx-auto text-emerald-600 mb-4" />
          <h1 className="text-3xl font-black text-slate-900 mb-2">Hiring Process Completed</h1>
          <p className="text-slate-600 text-sm mb-6">Selected Candidates Finalized for {company?.name}.</p>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-4 py-2 rounded-full text-sm">
            Thank You for Partnering!
          </span>
        </div>
      </div>
    );
  }

  if (portalState === 'LOCKED') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-amber-200">
          <div className="mb-6 flex justify-center">
             <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Round Submitted</h2>
          <p className="text-slate-600 text-sm">Waiting for Placement Cell authorization to unlock the next round...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Luxury White Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-xs sticky top-0 z-20 px-6 py-4 border-b border-emerald-900/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/20">
              {company?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{company?.name}</h1>
              <p className="text-xs text-slate-500">{company?.role}</p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
            Round {company?.current_round}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900">Round {company?.current_round} Candidates ({students.length})</h2>
          <span className="text-xs text-slate-500 font-medium">Select candidates to advance or offer</span>
        </div>

        <div className="space-y-3">
          {students.map(student => {
            const isSelected = selectedStudents.has(student.student_id);
            return (
              <div 
                key={student.student_id} 
                onClick={() => toggleStudent(student.student_id)}
                className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-600/10' 
                    : 'border-slate-200/80 hover:border-emerald-300 shadow-xs'
                } flex items-center justify-between`}
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Branch: <strong className="text-slate-700">{student.branch}</strong> • CGPA: <strong className="text-emerald-700">{student.cgpa}</strong></p>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    readOnly
                    className="w-6 h-6 text-emerald-600 rounded-lg focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            );
          })}
          {students.length === 0 && (
            <div className="text-center text-slate-400 py-16 bg-white rounded-3xl border border-slate-200/80">No candidates available for this round.</div>
          )}
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl z-30">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={() => handleActionClick('NEXT_ROUND')}
            disabled={students.length === 0}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Advance {selectedStudents.size} Candidate(s) to Next Round
          </button>
          <button 
            onClick={() => handleActionClick('FINAL_SELECT')}
            disabled={students.length === 0}
            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Final Select ({selectedStudents.size})
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-3">Confirm Round Submission</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-6">
              You have selected <strong className="text-emerald-700 font-bold">{selectedStudents.size} candidate(s)</strong> for {actionType === 'NEXT_ROUND' ? 'advancement to the next round' : 'final placement selection'}.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPortal;

