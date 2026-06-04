import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

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
        setSelectedStudents(new Set()); // Reset selections
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Interview Portal...</div>
      </div>
    );
  }

  if (portalState === 'ERROR') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (portalState === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-green-500">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Hiring Process Completed</h1>
          <p className="text-gray-600 mb-6">Selected Candidates Finalized.</p>
          <p className="text-green-600 font-semibold text-xl">Thank You!</p>
        </div>
      </div>
    );
  }

  if (portalState === 'LOCKED') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-yellow-500">
          <div className="mb-6 flex justify-center">
             <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Results submitted successfully.</h2>
          <p className="text-gray-600">Waiting for Placement Cell authorization to unlock the next round...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 md:px-8 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company?.name}</h1>
            <p className="text-sm text-gray-500">{company?.role}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm">
            Round {company?.current_round}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Candidates ({students.length})</h2>
        <div className="space-y-4">
          {students.map(student => (
            <div 
              key={student.student_id} 
              onClick={() => toggleStudent(student.student_id)}
              className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
                selectedStudents.has(student.student_id) ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'
              } flex items-center justify-between`}
            >
              <div>
                <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                <p className="text-sm text-gray-500">{student.branch} • CGPA: {student.cgpa}</p>
              </div>
              <div>
                <input 
                  type="checkbox" 
                  checked={selectedStudents.has(student.student_id)} 
                  readOnly
                  className="w-8 h-8 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="text-center text-gray-500 py-10">No candidates available for this round.</div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={() => handleActionClick('NEXT_ROUND')}
            disabled={students.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Move {selectedStudents.size} to Next Round
          </button>
          <button 
            onClick={() => handleActionClick('FINAL_SELECT')}
            disabled={students.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Final Select ({selectedStudents.size})
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-xl font-bold mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              You have selected {selectedStudents.size} candidate(s) for {actionType === 'NEXT_ROUND' ? 'the next round' : 'final selection'}. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
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
