import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Bell, Trash2, CheckCircle, FileText } from 'lucide-react';
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
      fetchStudents(); // Refresh list to show updated resume status
    } catch (err) {
      console.error(err);
      alert('Error deleting resume');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-slate-900 shadow px-8 py-4 flex items-center text-white gap-4">
        <button onClick={() => navigate('/admin')} className="text-slate-300 hover:text-white transition">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-white">All Students</h1>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Student Directory</h2>
            <p className="text-slate-500 text-sm">View all students, their placement status, and manage their resumes.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading students...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
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
                    <td colSpan="6" className="p-8 text-center text-slate-500">No students found.</td>
                  </tr>
                )}
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-bold text-slate-700">#{student.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {student.branch || 'N/A'} <br/>
                      <span className="font-medium text-slate-800">CGPA: {student.cgpa || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      {student.selected_company ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                          Placed: {student.selected_company}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                          Not Yet
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {student.resume_url ? (
                        <a href={`http://localhost:5000${student.resume_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer">
                          <FileText size={16} /> View PDF
                        </a>
                      ) : (
                        <span className="text-red-500 font-medium text-xs flex items-center gap-1">
                          No Resume
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {!student.resume_url ? (
                          <button onClick={() => handleNotify(student.id)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                            <Bell size={14} /> Notify
                          </button>
                        ) : (
                          <button onClick={() => handleDeleteResume(student.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                            <Trash2 size={14} /> Delete
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
