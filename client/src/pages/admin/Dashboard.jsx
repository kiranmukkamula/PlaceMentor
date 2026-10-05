import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { LogOut, Plus, X, Brain, Users, Building2, Link as LinkIcon, CheckCircle2, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import jsCookie from 'js-cookie';
import { io } from 'socket.io-client';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', role: '', ctc: '', location: '', jd: '', eligibility_cgpa: '', deadline: ''
  });
  const [applicantsModal, setApplicantsModal] = useState({ show: false, companyId: null, companyName: '' });
  const [applicants, setApplicants] = useState([]);
  const [interviewLinkModal, setInterviewLinkModal] = useState({ show: false, url: '', companyName: '', copied: false });
  const navigate = useNavigate();

  const socketRef = useRef(null);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('round-submitted', () => {
      fetchCompanies();
    });
    socketRef.current.on('selection-submitted', () => {
      fetchCompanies();
    });

    fetchCompanies();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = jsCookie.get('token');
      const res = await axios.get('/companies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data.companies);
      
      if (socketRef.current) {
        res.data.companies.forEach(c => {
          socketRef.current.emit('join-admin-room', c.id);
        });
      }
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/companies', formData);
      showAlert({ title: 'Drive Launched', message: 'Placement drive launched successfully!', type: 'success' });
      setShowForm(false);
      setFormData({ name: '', role: '', ctc: '', location: '', jd: '', eligibility_cgpa: '', deadline: '' });
      fetchCompanies();
    } catch (err) {
      showAlert({ title: 'Error Creating Drive', message: err.response?.data?.message || 'Error adding company', type: 'error' });
    }
  };

  const handleViewApplicants = async (company) => {
    try {
      const res = await axios.get(`/applications/company/${company.id}`, {
        headers: { Authorization: `Bearer ${jsCookie.get('token')}` }
      });
      setApplicants(res.data.applications);
      setApplicantsModal({ show: true, companyId: company.id, companyName: company.name });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Error fetching applicants list', type: 'error' });
    }
  };

  const handleGenerateLink = async (company) => {
    try {
      const res = await axios.post('/interview/admin/create-interview-link', { companyId: company.id }, {
        headers: { Authorization: `Bearer ${jsCookie.get('token')}` }
      });
      const fullUrl = `${window.location.origin}${res.data.url}`;

      try {
        await navigator.clipboard.writeText(fullUrl);
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }

      setInterviewLinkModal({
        show: true,
        url: fullUrl,
        companyName: company.name,
        copied: true
      });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Error generating interview link', type: 'error' });
    }
  };

  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setInterviewLinkModal(prev => ({ ...prev, copied: true }));
      setTimeout(() => {
        setInterviewLinkModal(prev => ({ ...prev, copied: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleApproveRound = (company) => {
    showConfirm({
      title: 'Approve Interview Round',
      message: `Are you sure you want to approve Round ${company.current_round || 1} for ${company.name}? This will advance shortlisted candidates and notify student applicants.`,
      confirmText: 'Approve & Advance Round',
      onConfirm: async () => {
        try {
          await axios.post('/interview/admin/approve-round', { companyId: company.id }, {
            headers: { Authorization: `Bearer ${jsCookie.get('token')}` }
          });
          showAlert({ title: 'Round Approved', message: `Round ${company.current_round || 1} approved! Notifications dispatched to candidates.`, type: 'success' });
          fetchCompanies();
        } catch (err) {
          console.error(err);
          showAlert({ title: 'Error', message: 'Error approving round', type: 'error' });
        }
      }
    });
  };


  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* Luxury White Glass Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 font-black">
              P
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 bg-clip-text text-transparent">
              Admin Portal
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/admin" className="bg-emerald-50 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm border border-emerald-200/80">
              Companies
            </Link>
            <Link to="/admin/students" className="text-slate-600 font-semibold hover:text-emerald-700 px-4 py-2 rounded-xl text-sm hover:bg-emerald-50/50 transition flex items-center gap-1.5">
              <Users size={16} /> Students
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">Admin</span>
          <button onClick={logout} className="text-rose-600 hover:text-rose-700 font-semibold text-sm cursor-pointer flex items-center gap-1 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Placement Drives</h2>
            <p className="text-sm text-slate-500 mt-1">Manage active drive listings, AI candidate rankings, and interview rounds.</p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-3 rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Drive'}
          </button>
        </div>

        {/* Add Company Form */}
        {showForm && (
          <form className="bg-white p-8 rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleAddCompany}>
            <h3 className="md:col-span-2 text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="text-emerald-600" size={20} /> Create New Company Drive
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name</label>
              <input required placeholder="e.g. Google India" type="text" className="w-full appearance-none rounded-xl px-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Job Role</label>
              <input required placeholder="e.g. Software Development Engineer" type="text" className="w-full appearance-none rounded-xl px-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setFormData({ ...formData, role: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Package (CTC)</label>
              <input required placeholder="e.g. 18 LPA" type="text" className="w-full appearance-none rounded-xl px-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setFormData({ ...formData, ctc: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Location</label>
              <input required placeholder="e.g. Bangalore / Remote" type="text" className="w-full appearance-none rounded-xl px-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Eligibility Cutoff (CGPA)</label>
              <input required placeholder="e.g. 7.5" type="number" step="0.01" className="w-full appearance-none rounded-xl px-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setFormData({ ...formData, eligibility_cgpa: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Application Deadline</label>
              <input type="date" className="w-full appearance-none rounded-xl px-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all" onChange={e => setFormData({ ...formData, deadline: (e.target.value)})} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Job Description (used by AI matching engine)</label>
              <textarea required placeholder="Paste complete Job Description detailing roles, CS fundamentals, skills..." className="w-full appearance-none rounded-xl p-4 border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all h-28" onChange={e => setFormData({ ...formData, jd: e.target.value })} />
            </div>

            <button type="submit" className="md:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all cursor-pointer">
              Save & Launch Drive
            </button>
          </form>
        )}

        {/* Company Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Role</th>
                <th className="p-4">CTC</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Current Round</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-black">
                      {c.name.charAt(0)}
                    </div>
                    {c.name}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{c.role}</td>
                  <td className="p-4 text-emerald-700 font-bold">{c.ctc}</td>
                  <td className="p-4 text-slate-500">{new Date(c.deadline).toLocaleDateString("en-GB")}</td>
                  <td className="p-4 font-semibold text-emerald-700">Round {c.current_round || 1}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                      c.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      'bg-teal-50 text-teal-800 border-teal-200'
                    }`}>
                      {c.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end items-center flex-wrap">
                      <button onClick={() => handleViewApplicants(c)} className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs">
                        Applicants
                      </button>
                      <button onClick={() => navigate(`/admin/ranking/${c.id}`)} className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs">
                        <Brain size={14} className="text-emerald-600" /> AI Rank
                      </button>
                      <button onClick={() => handleGenerateLink(c)} className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs">
                        <LinkIcon size={14} className="text-teal-600" /> Link
                      </button>
                      <button 
                        onClick={() => c.status === 'PENDING_REVIEW' && handleApproveRound(c)} 
                        disabled={c.status !== 'PENDING_REVIEW'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          c.status === 'PENDING_REVIEW' 
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 cursor-pointer animate-pulse' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        }`}
                      >
                        Approve Round
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && <div className="p-12 text-center text-slate-500">No active placement drives found.</div>}
        </div>
      </div>

      {/* Applicants Modal */}
      {applicantsModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <div>
                <h2 className="text-xl font-black text-slate-900">Applicants for {applicantsModal.companyName}</h2>
                <p className="text-xs text-slate-500">Student applications and live interview status</p>
              </div>
              <button onClick={() => setApplicantsModal({ show: false, companyId: null, companyName: '' })} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {applicants.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No student has applied yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">CGPA</th>
                      <th className="p-4">Resume PDF</th>
                      <th className="p-4">Status / Round</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">
                          {app.student.name}
                          <div className="font-normal text-xs text-slate-500">{app.student.email}</div>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{app.student.branch}</td>
                        <td className="p-4 text-slate-700 font-bold">{app.student.cgpa}</td>
                        <td className="p-4">
                          {app.student.resumeUrl ? (
                            <a href={`${import.meta.env.VITE_SERVER_URL || ''}${app.student.resumeUrl}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 font-bold text-xs hover:underline cursor-pointer">View Resume</a>
                          ) : (
                            <span className="text-slate-400 text-xs">No Resume</span>
                          )}
                        </td>
                        <td className="p-4">
                          {app.latest_interview ? (
                            <div className="flex flex-col gap-1">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${
                                app.latest_interview.decision === 'SELECTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                app.latest_interview.decision === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                'bg-teal-50 text-teal-800 border-teal-200'
                              }`}>
                                {app.latest_interview.decision === 'NEXT_ROUND' ? 'Advanced' : app.latest_interview.decision}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                Round {app.latest_interview.round_number}
                              </span>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              app.status === 'SELECTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              app.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                              app.status === 'SHORTLISTED' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {app.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Luxury Interview Link Modal with Auto-Copy */}
      {interviewLinkModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full p-8 relative">
            <button 
              onClick={() => setInterviewLinkModal({ show: false, url: '', companyName: '', copied: false })}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
              <LinkIcon size={24} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Interview Portal Link</h3>
            <p className="text-slate-500 text-xs mt-1">
              Live panel link for <span className="font-bold text-slate-800">{interviewLinkModal.companyName}</span>
            </p>

            {/* Auto-copied badge alert */}
            {interviewLinkModal.copied && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                Link copied automatically!
              </div>
            )}

            {/* Copy Input Box */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={interviewLinkModal.url}
                onClick={() => handleCopyLink(interviewLinkModal.url)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer select-all"
              />
              <button
                onClick={() => handleCopyLink(interviewLinkModal.url)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
              >
                {interviewLinkModal.copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {interviewLinkModal.copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setInterviewLinkModal({ show: false, url: '', companyName: '', copied: false })}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Done
              </button>
              <a
                href={interviewLinkModal.url}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                Open Portal <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


