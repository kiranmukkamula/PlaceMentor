import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsCookie from 'js-cookie';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Brain, Star, CheckSquare } from 'lucide-react';

export default function CandidateRanking() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [company, setCompany] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRanking();
  }, [companyId]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const token = jsCookie.get('token');
      // Fetch currently ranked candidates or just fetch applicants first
      // The analyze route actually fetches and ranks them
      const res = await axios.post(`/ranking/analyze/${companyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompany(res.data.company || null);
      setCandidates(res.data.ranked || []);
    } catch (err) {
      console.error(err);
      alert('Error fetching candidates for ranking');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(candidates.map(c => c.application_id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectTop = (count) => {
    const topIds = candidates.slice(0, count).map(c => c.application_id);
    setSelectedIds(new Set(topIds));
  };

  const handleBulkStatus = async (status) => {
    if (selectedIds.size === 0) return alert('No candidates selected');
    
    try {
      setAnalyzing(true);
      const token = jsCookie.get('token');
      await axios.put('/ranking/bulk-status', {
        applicationIds: Array.from(selectedIds),
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Successfully updated to ${status}`);
      // Uncheck all after bulk action
      setSelectedIds(new Set());
      // Re-fetch to see updated DB if needed, or simply update local state
      // For simplicity, re-fetch:
      fetchRanking();
    } catch (err) {
      console.error(err);
      alert('Error performing bulk update');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Brain className="animate-pulse text-indigo-600 mb-4" size={64} />
        <h2 className="text-xl font-bold text-slate-700">AI is analyzing candidate resumes...</h2>
        <p className="text-slate-500 mt-2">Computing semantic vectors and matching skills.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-slate-900 shadow px-8 py-4 flex items-center text-white gap-4">
        <button onClick={() => navigate('/admin')} className="text-slate-300 hover:text-white transition">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-white">Smart Candidate Ranking</h1>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        
        {company && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-2">{company.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 mb-4">
              <span className="bg-slate-100 px-3 py-1 rounded-full">{company.role}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">CTC: {company.ctc}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">{company.location}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
              <strong className="block mb-1 text-slate-800">Job Description:</strong>
              {company.jd}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Ranked Applicants</h2>
            <p className="text-slate-500 text-sm">Candidates sorted intelligently based on JD alignment.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-600 mr-2">Quick Select:</span>
            <button onClick={() => handleSelectTop(10)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm font-medium transition cursor-pointer">Top 10</button>
            <button onClick={() => handleSelectTop(20)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm font-medium transition cursor-pointer">Top 20</button>
            <button onClick={() => handleSelectTop(50)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm font-medium transition cursor-pointer">Top 50</button>
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <button disabled={analyzing} onClick={() => handleBulkStatus('SHORTLISTED')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition flex gap-1 items-center cursor-pointer disabled:opacity-50">
              <CheckCircle size={16} /> Bulk Shortlist
            </button>
            <button disabled={analyzing} onClick={() => handleBulkStatus('REJECTED')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition flex gap-1 items-center cursor-pointer disabled:opacity-50">
              <XCircle size={16} /> Bulk Reject
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4 w-12">
                  <input type="checkbox" onChange={handleSelectAll} checked={candidates.length > 0 && selectedIds.size === candidates.length} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                </th>
                <th className="p-4">Rank & Candidate</th>
                <th className="p-4">Final AI Score</th>
                <th className="p-4">Semantic Match</th>
                <th className="p-4">Skills Match</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No candidates found or processed.</td>
                </tr>
              )}
              {candidates.map((c, index) => {
                const s = c.scores || {};
                const isSelected = selectedIds.has(c.application_id);
                const isExpanded = expandedId === c.application_id;

                return (
                  <React.Fragment key={c.application_id}>
                    <tr className={`hover:bg-slate-50 transition ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(c.application_id)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                      </td>
                      <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index < 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          {c.name}
                          <div className="font-normal text-xs text-slate-500 mt-0.5">ID: {c.user_id}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${s.finalScore || 0}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-700">{s.finalScore || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{s.semanticScore || 0}%</td>
                      <td className="p-4 text-slate-600">{s.skillsScore || 0}%</td>
                      <td className="p-4">
                        <button onClick={() => setExpandedId(isExpanded ? null : c.application_id)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded transition text-sm font-medium flex items-center gap-1 cursor-pointer">
                          {isExpanded ? 'Hide Details' : 'View AI Breakdown'} {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="6" className="p-0 border-b border-slate-200">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><Brain size={16} className="text-indigo-600" /> Scoring Breakdown</h4>
                                <ul className="text-sm text-slate-600 space-y-2 bg-white p-4 rounded-lg border border-slate-200">
                                  <li className="flex justify-between"><span>Semantic Similarity (40% weight):</span> <span className="font-medium text-slate-800">{s.semanticScore}%</span></li>
                                  <li className="flex justify-between"><span>Skills Match (25% weight):</span> <span className="font-medium text-slate-800">{s.skillsScore}%</span></li>
                                  <li className="flex justify-between"><span>Project Relevance (15% weight):</span> <span className="font-medium text-slate-800">{s.projectScore}%</span></li>
                                  <li className="flex justify-between"><span>Certifications Value (10% weight):</span> <span className="font-medium text-slate-800">{s.certScore}%</span></li>
                                  <li className="flex justify-between"><span>Achievements Value (10% weight):</span> <span className="font-medium text-slate-800">{s.achScore}%</span></li>
                                </ul>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><CheckSquare size={16} className="text-green-600" /> Matched Domain & Skills</h4>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {(s.explanations?.matchedDomains && s.explanations.matchedDomains.length > 0) ? s.explanations.matchedDomains.map((d, idx) => (
                                      <span key={idx} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-200 uppercase tracking-wide">{d}</span>
                                    )) : null}
                                    
                                    {(s.explanations?.matchedSkills && s.explanations.matchedSkills.length > 0) ? s.explanations.matchedSkills.map((sk, idx) => (
                                      <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-200">{sk}</span>
                                    )) : <span className="text-sm text-slate-500">No exact JD skills matched.</span>}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><Star size={16} className="text-amber-500" /> Missing Core Requirements</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {(s.explanations?.missingSkills && s.explanations.missingSkills.length > 0) ? s.explanations.missingSkills.map((sk, idx) => (
                                    <span key={idx} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-medium border border-red-100">{sk}</span>
                                  )) : <span className="text-sm text-slate-500">Candidate meets all explicit JD skills.</span>}
                                </div>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
