import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, AlertTriangle, UserCheck, 
  FileText, Lock, Eye, Key, Sliders, Database, Sparkles 
} from 'lucide-react';
import { fetchAuditTrail, fetchComplianceInfo } from '../api';
import { AuditLog } from '../types';

export const GovernanceView: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'Agent' | 'Supervisor' | 'Compliance'>('Agent');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Replaceable LLM provider setting
  const [llmProvider, setLlmProvider] = useState<'heuristic' | 'openai' | 'anthropic' | 'gemini'>('heuristic');

  useEffect(() => {
    Promise.all([fetchAuditTrail(), fetchComplianceInfo()])
      .then(([aData, cData]) => {
        setAuditLogs(aData.audit_logs);
        setCompliance(cData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Governance & Policy Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Model Risk Management & Compliance</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Governance & Human Oversight</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enforcing Role-Based Access Controls (RBAC), immutable audit logging, and algorithmic bias exclusion.
            </p>
          </div>

          {/* Role Switcher */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center space-x-1.5 self-start md:self-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Role:</span>
            {(['Agent', 'Supervisor', 'Compliance'] as const).map(role => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === role
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Protected Attributes & Replaceable LLM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fair Lending & Protected Attributes Certification */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Protected Attributes Exclusion Certification</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Under ECOA (Equal Credit Opportunity Act) & FDCPA, algorithmic decision models strictly exclude demographic proxies.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">Strictly Excluded Attributes</span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                {compliance?.protected_attributes_excluded.map((attr: string, i: number) => (
                  <div key={i} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>{attr}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-2">Permitted Decision Features</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {compliance?.decision_features_utilized.map((feat: string, i: number) => (
                  <div key={i} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span className="text-[11px]">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Replaceable AI Engine Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Modular AI Engine Configuration</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Pluggable reasoning architecture. Easily toggle between offline rule-based heuristic synthesis or external enterprise LLM providers.
          </p>

          <div className="space-y-3">
            {[
              { id: 'heuristic', title: 'Deterministic Heuristic & RAG Engine (Active)', desc: 'Zero external API latency; runs fully local with SQLite and verifiable prompt templates.' },
              { id: 'openai', title: 'OpenAI GPT-4o Collections Pipeline', desc: 'Pluggable via OPENAI_API_KEY environment variable in backend config.' },
              { id: 'anthropic', title: 'Anthropic Claude 3.5 Sonnet Engine', desc: 'Pluggable via ANTHROPIC_API_KEY for deep policy reasoning.' },
              { id: 'gemini', title: 'Google Gemini 1.5 Pro Copilot', desc: 'Pluggable via GEMINI_API_KEY for large-context call transcript synthesis.' }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setLlmProvider(p.id as any)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  llmProvider === p.id
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${llmProvider === p.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {p.title}
                  </span>
                  {llmProvider === p.id && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500 text-white font-bold">ACTIVE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Global Human-in-the-Loop Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white">Permanent Decision Audit Trail</h3>
            <p className="text-xs text-slate-400">All collector Approve, Modify, and Override actions recorded with immutable timestamps</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
            {auditLogs.length} audit events logged
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800/80">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No human decisions have been recorded yet in this session.</p>
            <p className="text-[11px] text-slate-500 mt-1">Visit a customer profile (e.g. John Doe) and click Approve or Modify on the Next Best Action tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Executed Action & Channel</th>
                  <th className="px-4 py-3">Collector Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {log.created_at?.split('T')[0]} {log.created_at?.split('T')[1]?.substring(0, 5)}
                    </td>
                    <td className="px-4 py-3 font-mono text-teal-400 font-bold">
                      CUST-100{log.customer_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {log.agent_name}
                      <span className="block text-[10px] text-slate-400">{log.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                        log.action_taken === 'Approved' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                        log.action_taken === 'Modified' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {log.action_taken}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{log.final_action}</div>
                      <div className="text-[11px] text-teal-300 font-medium">via {log.final_channel}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 italic">
                      {log.rationale || 'Adhered to model guidance'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
