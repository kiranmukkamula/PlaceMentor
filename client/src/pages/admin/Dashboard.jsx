import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Plus, X } from 'lucide-react';
import jsCookie from 'js-cookie';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', role: '', ctc: '', location: '', jd: '', eligibility_cgpa: '', deadline: ''
  });
  const [applicantsModal, setApplicantsModal] = useState({ show: false, companyId: null, companyName: '' });
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = jsCookie.get('token');

      const res = await axios.get('/companies', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCompanies(res.data.companies);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/companies', formData);
      alert('Company added!');
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding company');
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
      alert('Error fetching applicants');
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await axios.put(`/applications/${applicationId}/status`, { status }, {
        headers: { Authorization: `Bearer ${jsCookie.get('token')}` }
      });
      setApplicants(applicants.map(app => app.id === applicationId ? { ...app, status } : app));
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 shadow px-8 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-300">Admin</span>
          <button onClick={logout} className="text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Manage Companies</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex gap-2 items-center cursor-pointer">
            <Plus size={18} /> {showForm ? 'Cancel' : 'Add Company'}
          </button>
        </div>

        {showForm && (
          <form className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddCompany}>
            <input required placeholder="Company Name" type="text" className="border p-2 rounded" onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input required placeholder="Job Role" type="text" className="border p-2 rounded" onChange={e => setFormData({ ...formData, role: e.target.value })} />
            <input required placeholder="CTC" type="text" className="border p-2 rounded" onChange={e => setFormData({ ...formData, ctc: e.target.value })} />
            <input required placeholder="Location" type="text" className="border p-2 rounded" onChange={e => setFormData({ ...formData, location: e.target.value })} />
            <input required placeholder="Eligibility CGPA" type="number" step="0.01" className="border p-2 rounded" onChange={e => setFormData({ ...formData, eligibility_cgpa: e.target.value })} />
            <input type="date" placeholder="Deadline" className="border p-2 rounded" onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
            <textarea required placeholder="Job Description (for AI matching)" className="border p-2 rounded md:col-span-2 h-24" onChange={e => setFormData({ ...formData, jd: e.target.value })} />
            <button type="submit" className="md:col-span-2 bg-slate-900 text-white py-2 rounded-lg font-bold cursor-pointer">Save Company</button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Role</th>
                <th className="p-4">CTC</th>
                <th className="p-4">Deadline</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-800">{c.name}</td>
                  <td className="p-4 text-slate-600">{c.role}</td>
                  <td className="p-4 text-slate-600">{c.ctc}</td>
                  <td className="p-4 text-slate-600">{new Date(c.deadline).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleViewApplicants(c)} className="text-indigo-600 font-medium hover:underline cursor-pointer">View Applicants</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && <div className="p-8 text-center text-slate-500">No companies found</div>}
        </div>
      </div>

      {/* Applicants Modal */}
      {applicantsModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Applicants for {applicantsModal.companyName}</h2>
              <button onClick={() => setApplicantsModal({ show: false, companyId: null, companyName: '' })} className="text-slate-500 hover:text-slate-700 cursor-pointer">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {applicants.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No one has applied yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">CGPA</th>
                      <th className="p-4">Resume</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-800">
                          {app.student.name}
                          <div className="font-normal text-xs text-slate-500">{app.student.email}</div>
                        </td>
                        <td className="p-4 text-slate-600">{app.student.branch}</td>
                        <td className="p-4 text-slate-600 font-medium">{app.student.cgpa}</td>
                        <td className="p-4">
                          {app.student.resumeUrl ? (
                            <a href={`http://localhost:5000${app.student.resumeUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Resume</a>
                          ) : (
                            <span className="text-slate-400">No Resume</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            app.status === 'SELECTED' ? 'bg-green-100 text-green-700' :
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <select 
                            value={app.status} 
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                            className="border border-slate-200 rounded p-1 text-sm bg-white cursor-pointer">
                            <option value="APPLIED">Applied</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="SELECTED">Selected</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
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
    </div>
  );
}
