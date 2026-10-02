import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, AlertCircle, Clock, CheckCircle2, ArrowUpRight, 
  TrendingUp, PhoneCall, MessageSquare, ShieldAlert, FileText, ChevronRight, Sparkles 
} from 'lucide-react';
import { fetchDashboardStats } from '../api';
import { DashboardStats } from '../types';

interface DashboardViewProps {
  onSelectCustomer: (id: number) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectCustomer,
  onNavigateToTab
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Collections Portfolio Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const summary = stats.summary;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-teal-500/5 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Customer Story Reconstruction Active</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Verified Synthetic Demo Dataset (No Real Customer Data)</span>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Collections Copilot 360 Command Center
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Unifying fragmented credit cards, retail loans, checking/savings deposits, contact history, and agent transcripts into chronological stories with explainable next best actions.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateToTab('assistant')}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </button>
            <button
              onClick={() => onNavigateToTab('dataQuality')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Data Quality
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Overdue Exposure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Overdue Exposure</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              ${summary.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span>Across</span>
              <span className="text-white font-semibold">{summary.active_collections_cases} active cases</span>
            </p>
          </div>
        </div>

        {/* Broken Promises */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Broken Promises (PTP)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
              {summary.broken_promises}
            </div>
            <p className="text-xs text-slate-400 mt-1">Requires immediate channel strategy pivot</p>
          </div>
        </div>

        {/* High / Critical Priority */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical & High Priority</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {summary.high_priority_cases}
            </div>
            <p className="text-xs text-slate-400 mt-1">Escalated for senior collector review</p>
          </div>
        </div>

        {/* Pending Human Reviews */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Human Review</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-300 font-mono tracking-tight">
              {summary.pending_human_reviews}
            </div>
            <p className="text-xs text-slate-400 mt-1">Human-in-the-Loop decision queues</p>
          </div>
        </div>

      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DPD Bucket Distribution Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">Collections Portfolio by DPD Bucket</h3>
              <p className="text-xs text-slate-400">Days Past Due distribution and total overdue exposure</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">Real-time</span>
          </div>

          <div className="space-y-4 mt-6">
            {stats.charts.dpd_buckets.map((b) => {
              const maxOverdue = Math.max(...stats.charts.dpd_buckets.map(x => x.total_overdue));
              const pct = Math.round((b.total_overdue / maxOverdue) * 100);
              const colorClass = 
                b.bucket === '90+' ? 'bg-rose-500' :
                b.bucket === '61-90' ? 'bg-amber-500' :
                b.bucket === '31-60' ? 'bg-indigo-500' : 'bg-teal-500';

              return (
                <div key={b.bucket} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{b.bucket} Days ({b.count} cases)</span>
                    <span className="font-mono text-slate-200 font-medium">${b.total_overdue.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(8, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Omnichannel Effectiveness Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">Channel Effectiveness Benchmark</h3>
              <p className="text-xs text-slate-400">Right-Party Contact (RPC) & engagement rate by outreach channel</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 font-medium">Historical</span>
          </div>

          <div className="space-y-4 mt-6">
            {stats.charts.channel_effectiveness.map((c) => (
              <div key={c.channel} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <span>{c.channel}</span>
                    <span className="text-slate-500 font-normal">({c.successful}/{c.total} touches)</span>
                  </span>
                  <span className="font-mono text-teal-400 font-bold">{c.success_rate}% success</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${c.success_rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Featured Hackathon Personas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Core Hackathon Showcase Personas</h2>
            <p className="text-xs text-slate-400">Pre-configured complex scenarios demonstrating Customer Story Reconstruction</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Persona 1: John Doe */}
          <div 
            onClick={() => onSelectCustomer(1)}
            className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-teal-500/10 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">CUST-1001</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">18 DPD</span>
            </div>
            <h3 className="font-bold text-base text-white mt-3 group-hover:text-teal-300 transition-colors">John Doe</h3>
            <p className="text-xs text-teal-400 font-medium">The "Salary Delay" Persona</p>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
              Flawless 36-month payer. Sudden delinquency due to corporate Workday ERP payroll transition. Active PTP for Friday salary release.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Overdue: <strong className="text-white font-mono">$770.00</strong></span>
              <span className="text-teal-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                Explore Story <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Persona 2: Priya Sharma */}
          <div 
            onClick={() => onSelectCustomer(2)}
            className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/10 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">CUST-1002</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">32 DPD</span>
            </div>
            <h3 className="font-bold text-base text-white mt-3 group-hover:text-indigo-300 transition-colors">Priya Sharma</h3>
            <p className="text-xs text-indigo-400 font-medium">The "Disputed Charge" Persona</p>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
              Wealth client ($42.5k on deposit) refusing to pay minimum due while $1,420 fraudulent London transaction is disputed.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Overdue: <strong className="text-white font-mono">$450.00</strong></span>
              <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                Explore Story <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Persona 3: Robert Chen */}
          <div 
            onClick={() => onSelectCustomer(3)}
            className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-rose-500/10 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">CUST-1003</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">64 DPD</span>
            </div>
            <h3 className="font-bold text-base text-white mt-3 group-hover:text-rose-300 transition-colors">Robert Chen</h3>
            <p className="text-xs text-rose-400 font-medium">The "3x Broken Promise" Persona</p>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
              SME freight owner with 3 broken PTPs. Call avoidance on phone, but reads 100% of WhatsApp messages within 8 mins.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Overdue: <strong className="text-white font-mono">$2,780.00</strong></span>
              <span className="text-rose-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                Explore Story <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Priority Collections Cases Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Active Collections Worklist</h3>
            <p className="text-xs text-slate-400">Click any customer to open their Customer 360, Timeline & Next Best Action</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{stats.recent_cases.length} records shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Case Ref</th>
                <th className="px-5 py-3">DPD Bucket</th>
                <th className="px-5 py-3">Overdue Amount</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Assigned Agent</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {stats.recent_cases.map((c) => (
                <tr 
                  key={c.case_ref}
                  onClick={() => onSelectCustomer(c.customer_id)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-white">{c.customer_name}</div>
                    <div className="text-xs text-teal-400 font-mono">{c.customer_ref}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-400">{c.case_ref}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {c.dpd_bucket} Days
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-white">
                    ${c.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      c.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-300">{c.agent}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all">
                      Open 360 &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
