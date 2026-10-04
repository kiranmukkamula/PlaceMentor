import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Bell, Trash2, FileText, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsCookie from 'js-cookie';

export default function StudentsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = jsCookie.get('token');
      const res = await axios.get('/users/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
      alert('Error fetching students list');
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (studentId) => {
    try {
      const token = jsCookie.get('token');
      await axios.post(`/users/${studentId}/notify-resume`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Notification sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Error sending notification');
    }
  };

  const handleDeleteResume = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const token = jsCookie.get('token');
      await axios.delete(`/users/${studentId}/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Resume deleted successfully!');
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Error deleting resume');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* Luxury White Glass Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-8 py-4 flex items-center text-slate-800 gap-4 sticky top-0 z-40">
        <button onClick={() => navigate('/admin')} className="text-slate-600 hover:text-emerald-700 p-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 font-black">
            P
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 bg-clip-text text-transparent">
            Student Directory
          </h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Registered Students ({students.length})</h2>
            <p className="text-slate-500 text-sm mt-1">Manage student profiles, placement offers, and resume uploads.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading student profiles...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Branch & CGPA</th>
                  <th className="p-4">Placement Status</th>
                  <th className="p-4">Resume</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-500">No students registered yet.</td>
                  </tr>
                )}
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-500">#{student.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{student.branch || 'N/A'}</span> <br/>
                      <span className="text-xs text-slate-500">CGPA: {student.cgpa || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      {student.selected_company ? (
                        <div className="flex flex-wrap gap-2">
                          {student.selected_company.split(',').map((comp, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1">
                              <UserCheck size={12} className="text-emerald-600" /> Placed: {comp.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold">
                          Not Placed
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {student.resume_url ? (
                        <a href={`http://localhost:5000${student.resume_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold text-xs hover:underline cursor-pointer">
                          <FileText size={15} /> View PDF
                        </a>
                      ) : (
                        <span className="text-rose-500 font-bold text-xs flex items-center gap-1">
                          No Resume
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {!student.resume_url ? (
                          <button onClick={() => handleNotify(student.id)} className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs">
                            <Bell size={13} /> Notify
                          </button>
                        ) : (
                          <button onClick={() => handleDeleteResume(student.id)} className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs">
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

