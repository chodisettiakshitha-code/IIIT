import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Landmark, DollarSign, Calendar, Phone, MessageSquare, 
  FileText, Mic, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck, 
  TrendingDown, TrendingUp, Sparkles, User, Clock, AlertCircle, RefreshCw,
  ThumbsUp, Edit3, XCircle, Check, HelpCircle
} from 'lucide-react';
import { 
  fetchCustomer360, fetchCustomerTimeline, fetchWhatChanged, 
  fetchCustomerStory, fetchNextBestAction, submitHumanDecision, fetchAuditTrail 
} from '../api';
import { 
  Customer360Data, TimelineEvent, WhatChangedData, 
  CustomerStoryData, NextBestActionData, AuditLog 
} from '../types';

interface CustomerWorkspaceProps {
  customerId: number;
  onNavigateToTab?: (tab: string) => void;
}

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({ customerId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'360' | 'timeline' | 'whatChanged' | 'story' | 'nba' | 'transcripts'>('nba');
  const [c360, setC360] = useState<Customer360Data | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [whatChanged, setWhatChanged] = useState<WhatChangedData | null>(null);
  const [story, setStory] = useState<CustomerStoryData | null>(null);
  const [nba, setNba] = useState<NextBestActionData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Timeline category filter
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');

  // Human-in-the-Loop State
  const [decisionModal, setDecisionModal] = useState<'NONE' | 'APPROVE' | 'MODIFY' | 'OVERRIDE'>('NONE');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [modifiedAction, setModifiedAction] = useState('');
  const [modifiedChannel, setModifiedChannel] = useState('');
  const [modifiedTiming, setModifiedTiming] = useState('');
  const [overrideAction, setOverrideAction] = useState('Escalate to Senior Collections Supervisor');
  const [overrideChannel, setOverrideChannel] = useState('In-Person / Branch Concierge');
  const [overrideRationale, setOverrideRationale] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, tData, wcData, sData, nbaData, auditData] = await Promise.all([
        fetchCustomer360(customerId),
        fetchCustomerTimeline(customerId),
        fetchWhatChanged(customerId),
        fetchCustomerStory(customerId),
        fetchNextBestAction(customerId),
        fetchAuditTrail(customerId)
      ]);
      setC360(cData);
      setTimeline(tData.timeline);
      setWhatChanged(wcData);
      setStory(sData);
      setNba(nbaData);
      setAuditLogs(auditData.audit_logs);

      if (nbaData) {
        setModifiedAction(nbaData.recommended_action);
        setModifiedChannel(nbaData.recommended_channel);
        setModifiedTiming(nbaData.suggested_timing);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleApprove = async () => {
    if (!nba) return;
    setDecisionSubmitting(true);
    try {
      await submitHumanDecision(customerId, {
        recommendation_id: nba.recommendation_id,
        agent_id: 'AGT-102',
        agent_name: 'Sarah Jenkins',
        role: 'Collections Specialist',
        action_taken: 'Approved',
        recommended_action: nba.recommended_action,
        final_action: nba.recommended_action,
        recommended_channel: nba.recommended_channel,
        final_channel: nba.recommended_channel,
        recommended_timing: nba.suggested_timing,
        final_timing: nba.suggested_timing,
        rationale: 'Approved recommended action as optimal per customer story analysis.'
      });
      setActionSuccessMessage('Action approved and logged to immutable audit trail.');
      setDecisionModal('NONE');
      const auditData = await fetchAuditTrail(customerId);
      setAuditLogs(auditData.audit_logs);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleModifySubmit = async () => {
    if (!nba) return;
    setDecisionSubmitting(true);
    try {
      await submitHumanDecision(customerId, {
        recommendation_id: nba.recommendation_id,
        agent_id: 'AGT-102',
        agent_name: 'Sarah Jenkins',
        role: 'Collections Specialist',
        action_taken: 'Modified',
        recommended_action: nba.recommended_action,
        final_action: modifiedAction,
        recommended_channel: nba.recommended_channel,
        final_channel: modifiedChannel,
        recommended_timing: nba.suggested_timing,
        final_timing: modifiedTiming,
        rationale: 'Modified by collector based on direct customer context.'
      });
      setActionSuccessMessage('Modified recommendation saved and registered in audit trail.');
      setDecisionModal('NONE');
      const auditData = await fetchAuditTrail(customerId);
      setAuditLogs(auditData.audit_logs);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleOverrideSubmit = async () => {
    if (!nba || !overrideRationale.trim()) return;
    setDecisionSubmitting(true);
    try {
      await submitHumanDecision(customerId, {
        recommendation_id: nba.recommendation_id,
        agent_id: 'AGT-102',
        agent_name: 'Sarah Jenkins',
        role: 'Collections Specialist',
        action_taken: 'Overridden',
        recommended_action: nba.recommended_action,
        final_action: overrideAction,
        recommended_channel: nba.recommended_channel,
        final_channel: overrideChannel,
        recommended_timing: 'Manual Intervention Window',
        final_timing: 'Immediate Override',
        rationale: overrideRationale
      });
      setActionSuccessMessage('Override action executed and flagged for supervisor review.');
      setDecisionModal('NONE');
      setOverrideRationale('');
      const auditData = await fetchAuditTrail(customerId);
      setAuditLogs(auditData.audit_logs);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Reconstructing Customer Story & Unified Profile...</p>
        </div>
      </div>
    );
  }

  if (!c360) return null;

  const prof = c360.profile;
  const fin = c360.financial_summary;
  const filteredTimeline = timelineFilter === 'ALL' 
    ? timeline 
    : timeline.filter(t => t.category === timelineFilter);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-teal-400/40 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Customer 360 Header Bar */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Identity & Demographics */}
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-[2px] shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-teal-300">
                {prof.full_name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-white tracking-tight">{prof.full_name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-400 font-mono font-bold border border-slate-700">
                  {prof.customer_ref}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  prof.risk_tier === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  prof.risk_tier === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}>
                  {prof.risk_tier} Risk
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                <span>{prof.segment}</span>
                <span>•</span>
                <span>{prof.employer} ({prof.employment_status})</span>
                <span>•</span>
                <span>Income: <strong className="text-white">${prof.monthly_income.toLocaleString()}/mo</strong></span>
                <span>•</span>
                <span>Credit Score: <strong className="text-teal-400 font-mono">{prof.credit_score}</strong></span>
              </div>
            </div>
          </div>

          {/* Key Financial Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Overdue</div>
              <div className="text-xl font-black text-rose-400 font-mono">
                ${fin.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Max Delinquency</div>
              <div className={`text-xl font-black font-mono ${
                fin.max_dpd > 60 ? 'text-rose-400' :
                fin.max_dpd > 30 ? 'text-amber-400' : 'text-teal-400'
              }`}>
                {fin.max_dpd} DPD
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deposits Cushion</div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ${fin.total_deposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Bank Position</div>
              <div className={`text-xl font-black font-mono ${fin.net_bank_position >= 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                ${fin.net_bank_position.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

        </div>

        {/* 5 Core Feature Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 mt-6 pt-3 overflow-x-auto">
          
          <button
            onClick={() => setActiveSubTab('nba')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'nba'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Next Best Action & Human-in-Loop</span>
          </button>

          <button
            onClick={() => setActiveSubTab('story')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'story'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>“Why?” Customer Story</span>
          </button>

          <button
            onClick={() => setActiveSubTab('whatChanged')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'whatChanged'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>“What Changed?” Engine</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'timeline'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Chronological Timeline</span>
          </button>

          <button
            onClick={() => setActiveSubTab('360')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === '360'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Unified Customer 360</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transcripts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'transcripts'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Agent Transcripts ({c360.transcripts.length})</span>
          </button>

        </div>
      </div>


      {/* TAB 1: NEXT BEST ACTION & HUMAN-IN-THE-LOOP */}
      {activeSubTab === 'nba' && nba && (
        <div className="space-y-6">
          
          {/* Main NBA Recommendation Card */}
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-teal-500 text-slate-950 font-black text-xs px-4 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center space-x-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Next Best Action</span>
            </div>

            <div className="max-w-3xl">
              <div className="flex items-center space-x-3 text-xs text-teal-400 font-semibold mb-2">
                <span>Recommendation Ref: {nba.recommendation_id}</span>
                <span>•</span>
                <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded">Confidence: {nba.confidence_score}% ({nba.confidence_tier})</span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                {nba.recommended_action}
              </h2>

              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                {nba.primary_reason}
              </p>
            </div>

            {/* Strategic Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Channel</span>
                <span className="text-sm font-bold text-teal-300 mt-1 block">{nba.recommended_channel}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Timing</span>
                <span className="text-sm font-bold text-teal-300 mt-1 block">{nba.suggested_timing}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expected Resolution</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">High Cure Propensity</span>
              </div>
            </div>

            {/* Supporting Customer Signals */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Supporting Customer Data Points</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {nba.supporting_customer_data.map((d, i) => (
                  <div key={i} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400 block">{d.metric}</span>
                    <span className="text-xs font-bold text-white font-mono mt-1 block">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Human Decision Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Human-in-the-Loop Mandate: Final decision requires explicit agent authorization.</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setDecisionModal('APPROVE')}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center space-x-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Approve Action</span>
                </button>

                <button
                  onClick={() => setDecisionModal('MODIFY')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Modify Channel / Timing</span>
                </button>

                <button
                  onClick={() => setDecisionModal('OVERRIDE')}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-sm border border-rose-500/30 transition-all flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Override Recommendation</span>
                </button>
              </div>
            </div>

          </div>

          {/* EXPLAINABILITY SECTION: "Why this recommendation?" */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <HelpCircle className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">Explainability: Why this recommendation?</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Data Signals & Expected Outcome */}
              <div className="space-y-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Verified Data Signals Utilized</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {nba.why_this_recommendation.data_signals.map((sig, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Expected Behavioral Outcome</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {nba.why_this_recommendation.expected_outcome}
                  </p>
                </div>
              </div>

              {/* Counter-Actions Evaluated & Rejected */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">Counter-Actions Evaluated & Suppressed</h4>
                <div className="space-y-3">
                  {nba.why_this_recommendation.counter_actions_evaluated.map((ca, i) => (
                    <div key={i} className="border-b border-slate-800/80 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{ca.action}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 pl-5">
                        <strong className="text-slate-500">Suppression Rationale:</strong> {ca.rejected_reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Audit Trail for this Customer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white tracking-tight mb-4">Customer Action Audit Trail</h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No historical human decisions logged yet for this customer in this session.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Agent</th>
                      <th className="px-4 py-2.5">Action Taken</th>
                      <th className="px-4 py-2.5">Final Action & Channel</th>
                      <th className="px-4 py-2.5">Rationale / Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-slate-400">{log.created_at?.split('T')[0]} {log.created_at?.split('T')[1]?.substring(0, 5)}</td>
                        <td className="px-4 py-3 font-semibold text-white">{log.agent_name} ({log.role})</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            log.action_taken === 'Approved' ? 'bg-teal-500/20 text-teal-300' :
                            log.action_taken === 'Modified' ? 'bg-indigo-500/20 text-indigo-300' :
                            'bg-rose-500/20 text-rose-300'
                          }`}>
                            {log.action_taken}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{log.final_action}</div>
                          <div className="text-[11px] text-teal-400">via {log.final_channel}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 italic">{log.rationale || 'Standard adherence'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}


      {/* TAB 2: "WHY?" CUSTOMER STORY */}
      {activeSubTab === 'story' && story && (
        <div className="space-y-6">
          
          {/* Main Story Hero Card */}
          <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl p-6 shadow-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Customer Story Reconstruction Engine</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Chronological Narrative Summary</h2>
            <p className="text-base text-slate-200 mt-3 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-medium">
              “{story.concise_story}”
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Identified Root Cause</span>
                <span className="text-sm font-bold text-teal-300 mt-1 block">{story.root_cause_diagnosis}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Historical Channel Propensity</span>
                <span className="text-sm font-bold text-cyan-300 mt-1 block">{story.historical_channel_effectiveness}</span>
              </div>
            </div>
          </div>

          {/* Explicit Facts vs AI Interpretations Dual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ground Truth Facts Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                <h3 className="font-bold text-base text-white">Direct Facts (Data Records)</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Verified transactional, contact log, and promissory data points from core banking and CRM tables.
              </p>

              <div className="space-y-3">
                {story.facts.map((f, i) => (
                  <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs font-bold text-teal-300 block">{f.label}</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Generated Interpretations Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                <h3 className="font-bold text-base text-white">AI-Generated Interpretations & Inferences</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Inferred psychological, behavioral, and repayment risk assessments derived by models.
              </p>

              <div className="space-y-3">
                {story.ai_interpretations.map((interp, i) => (
                  <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">{interp.label}</span>
                      <span className="text-[11px] font-bold text-white bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded">
                        {interp.assessment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{interp.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}


      {/* TAB 3: "WHAT CHANGED?" ENGINE */}
      {activeSubTab === 'whatChanged' && whatChanged && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">“What Changed?” Comparative Analysis</h2>
                <p className="text-xs text-slate-400">Delta comparison between baseline customer state and current delinquent cycle</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
                {whatChanged.comparison_window}
              </span>
            </div>

            {/* Previous vs Current Situation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Previous Customer Situation</span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{whatChanged.previous_situation}</p>
              </div>

              <div className="bg-slate-950/70 border border-teal-500/30 rounded-xl p-4">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">Current Customer Situation</span>
                <p className="text-sm text-white leading-relaxed font-medium">{whatChanged.current_situation}</p>
              </div>
            </div>

            {/* AI Explanation Banner */}
            <div className="mt-6 bg-teal-950/20 border border-teal-500/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>AI State Transition Explanation</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                {whatChanged.ai_explanation}
              </p>
            </div>

            {/* Changes Matrix Table */}
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Metric / Dimension</th>
                    <th className="px-4 py-3">Baseline (Previous)</th>
                    <th className="px-4 py-3">Current State</th>
                    <th className="px-4 py-3">Delta Impact</th>
                    <th className="px-4 py-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {whatChanged.key_changes.map((chg, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-bold text-white">{chg.metric}</td>
                      <td className="px-4 py-3.5 text-slate-400">{chg.previous}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-200">{chg.current}</td>
                      <td className="px-4 py-3.5 font-mono text-teal-300">{chg.change}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          chg.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          chg.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          chg.severity === 'positive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {chg.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}


      {/* TAB 4: CHRONOLOGICAL TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Chronological Event Timeline</h2>
                <p className="text-xs text-slate-400">Integrated audit trail of payments, calls, SMS, WhatsApp, agent notes, and PTPs</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                {['ALL', 'PAYMENT', 'CONTACT', 'PROMISE_TO_PAY', 'AGENT_NOTE', 'TRANSCRIPT'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTimelineFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                      timelineFilter === cat
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {filteredTimeline.map((ev) => {
                const dotColor = 
                  ev.status === 'danger' ? 'bg-rose-500 ring-rose-500/30' :
                  ev.status === 'warning' ? 'bg-amber-500 ring-amber-500/30' :
                  ev.status === 'success' ? 'bg-emerald-500 ring-emerald-500/30' :
                  ev.status === 'primary' ? 'bg-teal-400 ring-teal-400/30' : 'bg-slate-500 ring-slate-500/30';

                return (
                  <div key={ev.id} className="relative group">
                    <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 transition-all`}></div>
                    
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-slate-500">{ev.timestamp}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-semibold border border-slate-800">
                          {ev.badge}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{ev.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ev.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}


      {/* TAB 5: UNIFIED CUSTOMER 360 */}
      {activeSubTab === '360' && (
        <div className="space-y-6">
          
          {/* Accounts Grid: Cards, Loans, Deposits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Credit Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  <span>Credit Cards ({c360.cards.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {c360.cards.map((c) => (
                  <div key={c.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs">
                    <div className="flex justify-between font-mono font-bold text-white">
                      <span>{c.card_type}</span>
                      <span className={c.dpd > 0 ? 'text-rose-400' : 'text-emerald-400'}>{c.dpd} DPD</span>
                    </div>
                    <div className="text-slate-400 mt-1 font-mono">{c.account_number_masked}</div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between">
                      <span className="text-slate-400">Balance: <strong className="text-white">${c.current_balance.toLocaleString()}</strong></span>
                      <span className="text-slate-400">Min Due: <strong className="text-rose-400 font-bold">${c.min_due.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Term Loans */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <Landmark className="w-4 h-4 text-indigo-400" />
                  <span>Loans & Facilities ({c360.loans.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {c360.loans.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No term loans on record.</p>
                ) : (
                  c360.loans.map((l) => (
                    <div key={l.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs">
                      <div className="flex justify-between font-mono font-bold text-white">
                        <span>{l.loan_type}</span>
                        <span className={l.dpd > 0 ? 'text-amber-400' : 'text-emerald-400'}>{l.dpd} DPD</span>
                      </div>
                      <div className="text-slate-400 mt-1 font-mono">{l.loan_ref}</div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between">
                        <span className="text-slate-400">Balance: <strong className="text-white">${l.outstanding_balance.toLocaleString()}</strong></span>
                        <span className="text-slate-400">EMI: <strong className="text-white">${l.emi_amount.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Deposits & Accounts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Deposits & Savings ({c360.deposits.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {c360.deposits.map((d) => (
                  <div key={d.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs">
                    <div className="flex justify-between font-mono font-bold text-white">
                      <span>{d.account_type}</span>
                      <span className="text-emerald-400">${d.balance.toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 mt-1 font-mono">{d.account_number_masked}</div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-slate-400">
                      <span>Status: <strong className="text-emerald-400">{d.status}</strong></span>
                      <span>Active: {d.last_activity_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Promise to Pay History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white mb-3">Promise-to-Pay (PTP) History</h3>
            {c360.promises.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No PTP commitments recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Promise Date</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Channel Agreed</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {c360.promises.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-mono">{p.promise_date}</td>
                        <td className="px-4 py-3 font-mono font-bold text-white">${p.amount_promised.toLocaleString()}</td>
                        <td className="px-4 py-3">{p.channel_agreed}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            p.status === 'Kept' ? 'bg-emerald-500/20 text-emerald-300' :
                            p.status === 'Broken' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{p.broken_reason || 'Commitment on file'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}


      {/* TAB 6: AGENT TRANSCRIPTS & RECORDINGS */}
      {activeSubTab === 'transcripts' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white tracking-tight mb-2">Recorded Call Transcripts & Agent Notes</h2>
            <p className="text-xs text-slate-400 mb-6">Verbatim call interactions with customer sentiment analysis and commitment extraction</p>

            <div className="space-y-6">
              {c360.transcripts.map((tr) => (
                <div key={tr.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{tr.call_reason}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">{tr.call_ref}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Recorded on {tr.call_date} • Agent: {tr.agent_name} • Duration: {Math.floor(tr.duration_seconds / 60)}m {tr.duration_seconds % 60}s
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 font-semibold self-start sm:self-auto">
                      Sentiment: {tr.customer_sentiment}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI Call Summary</span>
                    <p className="text-xs text-slate-200 mt-1 font-medium bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">{tr.summary}</p>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Verbatim Transcript Dialog</span>
                    <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-900 leading-relaxed max-h-64 overflow-y-auto">
                      {tr.transcript_text}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* HUMAN-IN-THE-LOOP MODALS (Approve, Modify, Override) */}
      {/* ========================================================================= */}

      {/* APPROVE MODAL */}
      {decisionModal === 'APPROVE' && nba && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-teal-400" />
              <span>Confirm Agent Approval</span>
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              You are authorizing execution of the recommended Next Best Action. This will be stamped into the permanent compliance audit log under your credentials.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4 text-xs space-y-2">
              <div><strong className="text-slate-400">Action:</strong> <span className="text-white font-semibold">{nba.recommended_action}</span></div>
              <div><strong className="text-slate-400">Channel:</strong> <span className="text-teal-300">{nba.recommended_channel}</span></div>
              <div><strong className="text-slate-400">Timing:</strong> <span className="text-teal-300">{nba.suggested_timing}</span></div>
              <div><strong className="text-slate-400">Signing Agent:</strong> <span className="text-slate-200">Sarah Jenkins (AGT-102)</span></div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setDecisionModal('NONE')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={decisionSubmitting}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                {decisionSubmitting ? 'Registering...' : 'Confirm & Log Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFY MODAL */}
      {decisionModal === 'MODIFY' && nba && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <span>Modify Recommendation Parameters</span>
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Adjust outreach channel, timing window, or specific phrasing to tailor the action to latest customer developments.
            </p>

            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Action</label>
                <input
                  type="text"
                  value={modifiedAction}
                  onChange={(e) => setModifiedAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Channel</label>
                <select
                  value={modifiedChannel}
                  onChange={(e) => setModifiedChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="SMS">SMS Gateway</option>
                  <option value="Phone Call">Direct Phone Call</option>
                  <option value="WhatsApp">WhatsApp Business</option>
                  <option value="Email">Secure Email Portal</option>
                  <option value="Mobile App Push">Mobile Banking App Push</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Timing Window</label>
                <input
                  type="text"
                  value={modifiedTiming}
                  onChange={(e) => setModifiedTiming(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setDecisionModal('NONE')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleModifySubmit}
                disabled={decisionSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg transition-all"
              >
                {decisionSubmitting ? 'Saving...' : 'Submit Modified Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL */}
      {decisionModal === 'OVERRIDE' && nba && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Override AI Recommendation</span>
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Rejecting AI recommendation requires an explicit agent justification. This override is audited by compliance supervisors.
            </p>

            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Alternative Action to Execute</label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="Escalate to Senior Collections Supervisor">Escalate to Senior Collections Supervisor</option>
                  <option value="Suppress All Outbound Communications (Hard Hold)">Suppress All Outbound Communications (Hard Hold)</option>
                  <option value="Initiate Formal Debt Restructuring Review">Initiate Formal Debt Restructuring Review</option>
                  <option value="Issue 14-Day Demand Notice / Pre-Legal Referral">Issue 14-Day Demand Notice / Pre-Legal Referral</option>
                  <option value="Transfer to Dispute & Fraud Operations">Transfer to Dispute & Fraud Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Required Collector Rationale (Audit Record)</label>
                <textarea
                  rows={3}
                  value={overrideRationale}
                  onChange={(e) => setOverrideRationale(e.target.value)}
                  placeholder="Detail explicit reason why the AI recommendation was overridden..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setDecisionModal('NONE')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={decisionSubmitting || !overrideRationale.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
              >
                {decisionSubmitting ? 'Registering...' : 'Execute Override'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
