import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle, Search, LogOut, History, X, Bell, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout, fetchUser } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expCompanyId, setExpCompanyId] = useState('');
  const [expContent, setExpContent] = useState('');
  const [selectedFilterCompany, setSelectedFilterCompany] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/auth/me/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`/auth/me/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const compRes = await axios.get('/companies');
      setCompanies(compRes.data.companies);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }

    try {
      const appRes = await axios.get('/applications/me');
      setApplications(appRes.data.applications);
    } catch (err) {
      console.error("Failed to fetch applications (expected if bypassing auth):", err);
    }

    try {
      const expRes = await axios.get('/experiences');
      setExperiences(expRes.data.experiences || []);
    } catch (err) {
      console.error("Failed to fetch experiences:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return alert('Select file first');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    try {
      await axios.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Resume Uploaded Successfully!');
      fetchUser(); // refresh user dict
    } catch (err) {
      alert('Upload failed');
    }
  };

  const handlePostExperience = async (e) => {
    e.preventDefault();
    if (!expCompanyId || !expContent.trim()) return alert('Please select a company and write your experience.');
    try {
      await axios.post('/experiences', { companyId: expCompanyId, content: expContent });
      alert('Experience posted successfully!');
      setExpContent('');
      setShowExpModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post experience');
    }
  };

  const handleApply = async (companyId) => {
    try {
      await axios.post('/applications/apply', { companyId });
      alert('Applied Successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">PlaceMentor - Student</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-700">Hi, {user?.name}</span>
          
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-slate-500 hover:text-indigo-600 transition cursor-pointer relative p-1">
              <Bell size={20} />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex justify-between items-center">
                  Notifications
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)} className={`p-4 flex gap-3 transition border-b border-slate-100 cursor-pointer ${n.is_read ? 'bg-white opacity-60' : 'bg-slate-50 hover:bg-slate-100'}`}>
                        <div className="mt-1">
                           {n.title.includes('Resume') ? <AlertCircle className="text-red-500" size={16} /> : <Bell className="text-indigo-500" size={16} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                          <p className="text-xs text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: n.message }}></p>
                          <span className="text-[10px] text-slate-400 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setShowHistory(true)} className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 font-medium">
            <History size={18} /> History
          </button>
          <button onClick={logout} className="text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col - Companies */}
        <div className="col-span-2 space-y-6">
          {(() => {
            const activeCompanies = companies.filter(c => !c.deadline || new Date(c.deadline) >= new Date());
            return (
              <>
                <h2 className="text-2xl font-bold text-slate-800">Placement Drives ({activeCompanies.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeCompanies.map(c => {
                    const myApp = applications.find(a => a.companyId === c.id);
                    const hasApplied = !!myApp;
                    let btnColor = 'bg-indigo-600 text-white hover:bg-indigo-700';
                    let btnText = 'Apply Now';
                    
                    if (myApp) {
                      if (myApp.status === 'SELECTED') btnColor = 'bg-green-100 text-green-700';
                      else if (myApp.status === 'REJECTED') btnColor = 'bg-red-100 text-red-700';
                      else if (myApp.status === 'SHORTLISTED') btnColor = 'bg-blue-100 text-blue-700';
                      else btnColor = 'bg-slate-200 text-slate-700'; // APPLIED
                      btnText = myApp.status;
                    }

                    return (
                      <div key={c.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                          <p className="text-indigo-600 font-medium">{c.role}</p>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p><strong>CTC:</strong> {c.ctc}</p>
                            <p><strong>Location:</strong> {c.location}</p>
                            <p><strong>Eligibility:</strong> {c.eligibility_cgpa} CGPA</p>
                            <p><strong>Deadline:</strong>  {c.deadline ? new Date(c.deadline).toLocaleDateString("en-GB") : 'Not specified'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApply(c.id)}
                          disabled={hasApplied}
                          className={`mt-6 w-full py-2 rounded-lg font-bold ${btnColor} ${hasApplied ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                          {btnText}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        {/* Right Col - Tools */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-indigo-500" /> Resume Setup
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <input type="file" accept=".pdf" onChange={e => setResumeFile(e.target.files[0])} className="text-sm block w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer text-slate-500" />
              <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-900 flex justify-center items-center gap-2 cursor-pointer">
                <Upload size={18} /> Upload PDF
              </button>
              {user?.resume_url && <p className="text-sm text-green-600 flex items-center gap-1 mt-2"><CheckCircle size={14} />Resume is active</p>}
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100 border-t-4 border-t-indigo-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                💡 Interview Experiences
              </h3>
              <button onClick={() => setShowExpModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer">
                + Share Mine
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Read real interview questions and prep tips from peers.</p>

            <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 mb-4 cursor-pointer" onChange={e => setSelectedFilterCompany(e.target.value)} value={selectedFilterCompany}>
              <option value="">All Companies ({experiences.length})</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {experiences
                .filter(e => !selectedFilterCompany || e.companyId.toString() === selectedFilterCompany.toString())
                .length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No experiences posted yet. Be the first to share!</div>
              ) : (
                experiences
                  .filter(e => !selectedFilterCompany || e.companyId.toString() === selectedFilterCompany.toString())
                  .map(exp => (
                    <div key={exp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-indigo-700">{exp.companyName}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">{exp.companyRole || 'Drive'}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.content}</p>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                        <span>By: {exp.studentName}</span>
                        <span>{exp.studentBranch || 'Student'}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Post Experience Modal */}
      {showExpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Share Interview Experience</h2>
              <button onClick={() => setShowExpModal(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePostExperience} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Company</label>
                <select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700" value={expCompanyId} onChange={e => setExpCompanyId(e.target.value)}>
                  <option value="">Select Company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} - {c.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Experience & Questions Asked</label>
                <textarea required rows="5" placeholder="Describe the interview rounds, technical questions (DSA, DBMS, etc.), and HR questions..." className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700" value={expContent} onChange={e => setExpContent(e.target.value)}></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold transition cursor-pointer">
                Post Experience
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Application History</h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {applications.length === 0 ? (
                <p className="text-center text-slate-500 py-8">You haven't applied to any drives yet.</p>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50">
                      <div>
                        <h4 className="font-bold text-slate-800">{app.company?.name || 'Unknown Company'}</h4>
                        <p className="text-sm text-slate-500">Applied on: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === 'SELECTED' ? 'bg-green-100 text-green-700' :
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
