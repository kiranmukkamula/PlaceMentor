import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsCookie from 'js-cookie';
import { useModal } from '../../context/ModalContext';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Brain, Star, CheckSquare, Award, Briefcase, Code, Layers, FileText, Link as LinkIcon, Copy, ExternalLink, CheckCircle2, X } from 'lucide-react';

export default function CandidateRanking() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [company, setCompany] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [interviewLinkModal, setInterviewLinkModal] = useState({ show: false, url: '', companyName: '', copied: false });

  useEffect(() => {
    fetchRanking();
  }, [companyId]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const token = jsCookie.get('token');
      const res = await axios.post(`/ranking/analyze/${companyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompany(res.data.company || null);
      setCandidates(res.data.ranked || []);
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Error fetching candidate ranking analysis', type: 'error' });
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
    if (selectedIds.size === 0) return showAlert({ title: 'No Selection', message: 'Please select candidate applications to update.', type: 'info' });
    
    try {
      setAnalyzing(true);
      const token = jsCookie.get('token');
      await axios.put('/ranking/bulk-status', {
        applicationIds: Array.from(selectedIds),
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert({ title: 'Candidates Updated', message: `Successfully updated ${selectedIds.size} candidate(s) status to ${status}.`, type: 'success' });
      setSelectedIds(new Set());
      fetchRanking();
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Error', message: 'Error performing bulk status update', type: 'error' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!company) return;
    try {
      const token = jsCookie.get('token');
      const res = await axios.post('/interview/admin/create-interview-link', { companyId: company.id }, {
        headers: { Authorization: `Bearer ${token}` }
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


  const getMatchTierBadge = (tier, score) => {
    if (tier === 'Exceptional Fit' || score >= 80) {
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Exceptional Fit</span>;
    }
    if (tier === 'Strong Fit' || score >= 65) {
      return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Strong Fit</span>;
    }
    if (tier === 'Moderate Fit' || score >= 50) {
      return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Moderate Fit</span>;
    }
    return <span className="bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Weak Fit</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Brain className="animate-pulse text-emerald-600 mb-4" size={64} />
        <h2 className="text-xl font-black text-slate-800">AI is analyzing candidate resumes...</h2>
        <p className="text-slate-500 text-sm mt-2">Computing calibrated semantic vectors & section-by-section breakdown.</p>
      </div>
    );
  }

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
            Smart Candidate Ranking
          </h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        
        {company && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">{company.name}</h2>
            <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-700 mb-4">
              <span className="bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200">{company.role}</span>
              <span className="bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200">CTC: {company.ctc}</span>
              <span className="bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">{company.location}</span>
            </div>
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              <strong className="block mb-1 text-slate-900 font-bold uppercase tracking-wider text-[11px]">Job Description:</strong>
              {company.jd}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Ranked Applicants</h2>
            <p className="text-slate-500 text-xs mt-0.5">Sorted with calibrated semantic AI matching & section analysis.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-600 mr-2 uppercase tracking-wider">Quick Select:</span>
            <button onClick={() => handleSelectTop(10)} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer">Top 10</button>
            <button onClick={() => handleSelectTop(20)} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer">Top 20</button>
            <button onClick={() => handleSelectTop(50)} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer">Top 50</button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button disabled={analyzing} onClick={() => handleBulkStatus('SHORTLISTED')} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex gap-1.5 items-center cursor-pointer disabled:opacity-50">
              <CheckCircle size={15} /> Bulk Shortlist
            </button>
            <button disabled={analyzing} onClick={() => handleBulkStatus('REJECTED')} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition flex gap-1.5 items-center cursor-pointer disabled:opacity-50">
              <XCircle size={15} /> Bulk Reject
            </button>
            <button onClick={handleGenerateLink} className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 px-4 py-2 rounded-xl text-xs font-bold transition flex gap-1.5 items-center cursor-pointer shadow-xs">
              <LinkIcon size={15} className="text-teal-600" /> Interview Link
            </button>
          </div>
        </div>


        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 w-12">
                  <input type="checkbox" onChange={handleSelectAll} checked={candidates.length > 0 && selectedIds.size === candidates.length} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600" />
                </th>
                <th className="p-4">Rank & Candidate</th>
                <th className="p-4">Match Rating</th>
                <th className="p-4">Final AI Score</th>
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
                const exp = s.explanations || {};
                const sec = exp.sections || {};
                const isSelected = selectedIds.has(c.application_id);
                const isExpanded = expandedId === c.application_id;

                return (
                  <React.Fragment key={c.application_id}>
                    <tr className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(c.application_id)} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600" />
                      </td>
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index < 10 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          {c.name}
                          <div className="font-normal text-xs text-slate-500 mt-0.5">ID: {c.user_id}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getMatchTierBadge(exp.matchTier, s.finalScore)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200/80 rounded-full h-2.5 max-w-[100px] overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full" style={{ width: `${s.finalScore || 0}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-800">{s.finalScore || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-bold">{s.skillsScore || 0}%</td>
                      <td className="p-4">
                        <button onClick={() => setExpandedId(isExpanded ? null : c.application_id)} className="text-emerald-700 hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs">
                          {isExpanded ? 'Hide Breakdown' : 'Detailed Analysis'} {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td colSpan="6" className="p-6 border-b border-slate-200 space-y-6">
                          
                          {/* 1. Summary & Fit Banner */}
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Brain size={18} className="text-indigo-600" />
                                <h4 className="text-base font-bold text-slate-800">AI Candidate Summary</h4>
                                {getMatchTierBadge(exp.matchTier, s.finalScore)}
                              </div>
                              <p className="text-sm text-slate-600">{exp.summaryText || 'Extracted skills and section alignment evaluated.'}</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg text-right">
                              <span className="block text-xs font-semibold text-indigo-600 uppercase">Overall Match</span>
                              <span className="text-2xl font-black text-indigo-900">{s.finalScore || 0}%</span>
                            </div>
                          </div>

                          {/* 2. 5-Component Weighted Breakdown */}
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                              <Layers size={16} className="text-indigo-600" /> Weighted Scoring Breakdown
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs font-medium text-slate-500">Semantic Context (40%)</span>
                                <span className="text-lg font-bold text-slate-800">{s.semanticScore}%</span>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs font-medium text-slate-500">Skills Match (25%)</span>
                                <span className="text-lg font-bold text-slate-800">{s.skillsScore}%</span>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs font-medium text-slate-500">Project Alignment (15%)</span>
                                <span className="text-lg font-bold text-slate-800">{s.projectScore}%</span>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs font-medium text-slate-500">Certifications (10%)</span>
                                <span className="text-lg font-bold text-slate-800">{s.certScore}%</span>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-xs font-medium text-slate-500">Achievements (10%)</span>
                                <span className="text-lg font-bold text-slate-800">{s.achScore}%</span>
                              </div>
                            </div>
                          </div>

                          {/* 3. Skill Matching Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Matched JD Skills */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <CheckSquare size={16} className="text-emerald-600" /> Matched Required Skills ({exp.matchedSkills?.length || 0})
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {exp.matchedSkills && exp.matchedSkills.length > 0 ? (
                                  exp.matchedSkills.map((sk, idx) => (
                                    <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium">
                                      ✓ {sk}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">No required skills matched explicitly.</span>
                                )}
                              </div>
                            </div>

                            {/* Missing JD Skills */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Star size={16} className="text-amber-500" /> Missing Required Skills ({exp.missingSkills?.length || 0})
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {exp.missingSkills && exp.missingSkills.length > 0 ? (
                                  exp.missingSkills.map((sk, idx) => (
                                    <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-medium">
                                      ✗ {sk}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500">Candidate satisfies all JD required skills.</span>
                                )}
                              </div>
                            </div>

                            {/* Additional Skills */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Code size={16} className="text-indigo-600" /> Additional Skills ({exp.additionalSkills?.length || 0})
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {exp.additionalSkills && exp.additionalSkills.length > 0 ? (
                                  exp.additionalSkills.map((sk, idx) => (
                                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md text-xs font-medium">
                                      + {sk}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">No additional skills detected.</span>
                                )}
                              </div>
                            </div>

                          </div>

                          {/* 4. Categorized Skill Inventory */}
                          {exp.categorizedCandidateSkills && Object.keys(exp.categorizedCandidateSkills).length > 0 && (
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Code size={16} className="text-indigo-600" /> Candidate Full Skill Inventory by Domain
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(exp.categorizedCandidateSkills).map(([catName, catSkills], idx) => (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{catName}</span>
                                    <div className="flex flex-wrap gap-1">
                                      {catSkills.map((s, sIdx) => (
                                        <span key={sIdx} className={`px-2 py-0.5 rounded text-xs font-medium ${exp.matchedSkills?.includes(s) ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 5. Detailed Resume Section Summaries */}
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <FileText size={16} className="text-indigo-600" /> Detailed Resume Section Summaries
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              
                              {/* Skills Section */}
                              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Code size={14} className="text-indigo-600" /> Skills Section
                                  </span>
                                  <span className={`px-2 py-0.5 rounded font-bold ${sec.skills?.hasContent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {sec.skills?.hasContent ? 'Detected' : 'Empty'}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-slate-100">
                                  {sec.skills?.preview || 'No explicit skills header found'}
                                </p>
                              </div>

                              {/* Projects Section */}
                              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Layers size={14} className="text-indigo-600" /> Projects Section
                                  </span>
                                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                                    Score: {sec.projects?.score || s.projectScore || 0}%
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-slate-100">
                                  {sec.projects?.preview || 'No projects section detected'}
                                </p>
                              </div>

                              {/* Experience Section */}
                              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-indigo-600" /> Experience Section
                                  </span>
                                  <span className={`px-2 py-0.5 rounded font-bold ${sec.experience?.hasContent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {sec.experience?.hasContent ? 'Detected' : 'Empty'}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-slate-100">
                                  {sec.experience?.preview || 'No experience section listed'}
                                </p>
                              </div>

                              {/* Certifications & Achievements */}
                              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Award size={14} className="text-indigo-600" /> Certifications & Achievements
                                  </span>
                                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                                    Bonus Scores: {s.certScore || 0}% / {s.achScore || 0}%
                                  </span>
                                </div>
                                <div className="space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono text-[11px]">
                                  <p><strong className="text-slate-700">Certs:</strong> {sec.certifications?.preview || 'None'}</p>
                                  <p><strong className="text-slate-700">Achievements:</strong> {sec.achievements?.preview || 'None'}</p>
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


