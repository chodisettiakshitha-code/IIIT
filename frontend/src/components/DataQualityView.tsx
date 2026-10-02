import React, { useState, useEffect } from 'react';
import { 
  Database, ShieldCheck, AlertCircle, CheckCircle2, 
  RefreshCw, FileWarning, Layers, Check, Clock 
} from 'lucide-react';
import { fetchDataQuality } from '../api';

export const DataQualityView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetchDataQuality();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Scanning Datasets for Quality & Integrity Metrics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Top Health Score Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Governance & Ingestion Health</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Data Quality Diagnostics</h1>
            <p className="text-xs text-slate-400 mt-1">
              Active integrity verification across cards, loans, deposits, collections cases, and contact streams.
            </p>
          </div>

          {/* Health Score Dial */}
          <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Health Score</div>
              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {data.overall_health_score}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-300 text-lg">
              {data.health_grade}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Record Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(data.dataset_counts).map(([key, count]: any) => (
          <div key={key} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              {key.replace('_', ' ')}
            </span>
            <span className="text-lg font-black text-white font-mono mt-1 block">
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Grid: Missing Values & Duplicates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Missing Values Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-base text-white mb-2 flex items-center space-x-2">
            <FileWarning className="w-4 h-4 text-amber-400" />
            <span>Missing Values & Null Field Auditing</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Tracking attributes essential for Right-Party Contact (RPC) and collection reachability.</p>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3.5 py-2.5">Field</th>
                  <th className="px-3.5 py-2.5">Dataset</th>
                  <th className="px-3.5 py-2.5">Missing</th>
                  <th className="px-3.5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.missing_values.map((mv: any, i: number) => (
                  <tr key={i}>
                    <td className="px-3.5 py-3 font-semibold text-white">{mv.field}</td>
                    <td className="px-3.5 py-3 font-mono text-slate-400">{mv.dataset}</td>
                    <td className="px-3.5 py-3 font-mono text-slate-300">{mv.missing_count} ({mv.pct_missing}%)</td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300">
                        {mv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Duplicate Detection Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-base text-white mb-2 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Duplicate & Ambiguity Checks</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Cross-verifying unique customer IDs, phone sharing, and email collisions.</p>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3.5 py-2.5">Identifier Check</th>
                  <th className="px-3.5 py-2.5">Duplicates Found</th>
                  <th className="px-3.5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.duplicates.map((dup: any, i: number) => (
                  <tr key={i}>
                    <td className="px-3.5 py-3 font-semibold text-white">{dup.check}</td>
                    <td className="px-3.5 py-3 font-mono text-slate-300">{dup.duplicates_found}</td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300">
                        {dup.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Grid: Integrity Checks & Data Freshness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Referential Integrity Checks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-base text-white mb-2">Referential Integrity & Foreign Keys</h3>
          <p className="text-xs text-slate-400 mb-4">Verifying orphan loan accounts, detached card accounts, and credit limits.</p>

          <div className="space-y-3">
            {data.integrity_checks.map((ic: any, i: number) => (
              <div key={i} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">{ic.rule}</span>
                  <span className="text-[11px] text-slate-400">Violations: {ic.violations}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{ic.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Stream Freshness */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-base text-white mb-2 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Data Freshness & Stream Synchronization</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Monitoring ingestion latency across banking systems and collections CRM.</p>

          <div className="space-y-3">
            {data.data_freshness.map((df: any, i: number) => (
              <div key={i} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">{df.stream}</span>
                  <span className="text-[11px] text-slate-400 font-mono">Last update: {df.last_synced}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-medium text-[11px]">
                  {df.latency_status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Customer ID Matching Confidence Layer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-base text-white mb-2">Customer ID Matching & Entity Resolution</h3>
        <p className="text-xs text-slate-400 mb-4">
          Core Banking Customer ID matching against Collections CRM and external bureau IDs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Exact ID Matches</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">{data.customer_id_matching.exact_id_matches}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Fuzzy Matches</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">{data.customer_id_matching.fuzzy_demographic_matches}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Ambiguities</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">{data.customer_id_matching.unresolved_ambiguities}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Matching Confidence</span>
            <span className="text-xl font-bold text-teal-400 font-mono mt-1 block">{data.customer_id_matching.overall_matching_confidence_score}%</span>
          </div>
        </div>
      </div>

    </div>
  );
};
