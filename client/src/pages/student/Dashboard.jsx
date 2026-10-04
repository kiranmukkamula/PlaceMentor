import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle, Search, LogOut, History, X, Bell, AlertCircle, Sparkles, Building2, MessageSquarePlus } from 'lucide-react';

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
      console.error("Failed to fetch applications:", err);
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
    if (!resumeFile) return alert('Please select a PDF resume file first');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    try {
      await axios.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Resume Uploaded Successfully!');
      fetchUser();
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
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* Luxury White Glass Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 font-black">
            P
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 bg-clip-text text-transparent">
            PlaceMentor <span className="text-xs font-semibold text-slate-400 font-normal">Student</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-800 text-sm hidden sm:inline">Hi, {user?.name}</span>
          
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-slate-600 hover:text-emerald-700 transition cursor-pointer relative p-2 rounded-xl hover:bg-emerald-50">
              <Bell size={18} />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 font-bold text-slate-900 flex justify-between items-center text-sm">
                  Notifications
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)} className={`p-4 flex gap-3 transition cursor-pointer ${n.is_read ? 'bg-white opacity-60' : 'bg-emerald-50/40 hover:bg-emerald-50'}`}>
                        <div className="mt-1">
                           {n.title.includes('Resume') ? <AlertCircle className="text-amber-500" size={16} /> : <Sparkles className="text-emerald-600" size={16} />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          <p className="text-xs text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: n.message }}></p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setShowHistory(true)} className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 font-bold text-xs transition">
            <History size={16} /> History
          </button>

          <button onClick={logout} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 font-bold text-xs transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col - Placement Drives */}
        <div className="col-span-2 space-y-6">
          {(() => {
            const activeCompanies = companies.filter(c => !c.deadline || new Date(c.deadline) >= new Date());
            return (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Placement Drives ({activeCompanies.length})</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeCompanies.map(c => {
                    const myApp = applications.find(a => a.companyId === c.id);
                    const hasApplied = !!myApp;
                    let btnColor = 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20';
                    let btnText = 'Apply Now';
                    
                    if (myApp) {
                      if (myApp.status === 'SELECTED') btnColor = 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold';
                      else if (myApp.status === 'REJECTED') btnColor = 'bg-rose-50 text-rose-800 border border-rose-200 font-bold';
                      else if (myApp.status === 'SHORTLISTED') btnColor = 'bg-teal-50 text-teal-800 border border-teal-200 font-bold';
                      else btnColor = 'bg-slate-100 text-slate-700 border border-slate-200 font-bold';
                      btnText = myApp.status;
                    }

                    return (
                      <div key={c.id} className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200/80 hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                              <p className="text-emerald-700 font-semibold text-sm">{c.role}</p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                              {c.ctc}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                            <p><strong className="text-slate-800">Location:</strong> {c.location}</p>
                            <p><strong className="text-slate-800">Eligibility:</strong> {c.eligibility_cgpa} CGPA</p>
                            <p><strong className="text-slate-800">Deadline:</strong> {c.deadline ? new Date(c.deadline).toLocaleDateString("en-GB") : 'Flexible'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleApply(c.id)}
                          disabled={hasApplied}
                          className={`mt-6 w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${btnColor} ${hasApplied ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
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

        {/* Right Col - Tools & Experiences */}
        <div className="space-y-6">
          
          {/* Resume Upload Card */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="text-emerald-600" size={18} /> Resume Upload & Parser
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <input
                type="file"
                accept=".pdf"
                onChange={e => setResumeFile(e.target.files[0])}
                className="text-xs block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer text-slate-500 border border-slate-200 rounded-xl p-2 bg-slate-50/50"
              />
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 text-xs transition cursor-pointer shadow-sm">
                <Upload size={16} /> Upload & Extract Resume
              </button>
              {user?.resume_url && (
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-2">
                  <CheckCircle size={14} className="text-emerald-600" /> Active Resume uploaded
                </p>
              )}
            </form>
          </div>

          {/* Peer Interview Experiences Card */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200/80">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                💡 Interview Experiences
              </h3>
              <button onClick={() => setShowExpModal(true)} className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer">
                + Share Mine
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Read real questions and guidance from senior students.</p>

            <select className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-xs text-slate-800 mb-4 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setSelectedFilterCompany(e.target.value)} value={selectedFilterCompany}>
              <option value="">All Drives ({experiences.length})</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {experiences
                .filter(e => !selectedFilterCompany || e.companyId.toString() === selectedFilterCompany.toString())
                .length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No interview experiences posted yet.</div>
              ) : (
                experiences
                  .filter(e => !selectedFilterCompany || e.companyId.toString() === selectedFilterCompany.toString())
                  .map(exp => (
                    <div key={exp.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-emerald-800">{exp.companyName}</span>
                        <span className="text-[10px] bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded font-bold">{exp.companyRole || 'Drive'}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.content}</p>
                      <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-200 flex justify-between">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-lg font-black text-slate-900">Share Interview Experience</h2>
              <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePostExperience} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Drive</label>
                <select required className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500" value={expCompanyId} onChange={e => setExpCompanyId(e.target.value)}>
                  <option value="">Select Company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} - {c.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Experience & Questions</label>
                <textarea required rows="5" placeholder="Describe the interview rounds, technical questions (DSA, DBMS, OS, System Design), and HR questions..." className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500" value={expContent} onChange={e => setExpContent(e.target.value)}></textarea>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer">
                Post Experience
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-lg font-black text-slate-900">Application History</h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {applications.length === 0 ? (
                <p className="text-center text-slate-500 py-12">You haven't applied to any drives yet.</p>
              ) : (
                <div className="space-y-3">
                  {applications.map(app => (
                    <div key={app.id} className="flex justify-between items-center p-4 border border-slate-200/80 rounded-2xl hover:bg-slate-50/80 transition">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{app.company?.name || 'Unknown Company'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Applied on: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          app.status === 'SELECTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          app.status === 'SHORTLISTED' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
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

