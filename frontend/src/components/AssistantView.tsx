import React, { useState } from 'react';
import { 
  MessageSquare, Sparkles, Send, Database, Terminal, ShieldAlert, 
  HelpCircle, User, CheckCircle2, ChevronRight, Copy, Check
} from 'lucide-react';
import { queryAssistant } from '../api';
import { AssistantResponse } from '../types';

interface AssistantViewProps {
  selectedCustomerId: number;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ selectedCustomerId }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Chat message history
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    data?: AssistantResponse;
    timestamp: string;
  }>>([
    {
      sender: 'assistant',
      text: "Hello Sarah, I am your Collections Copilot. I combine transactional portfolio records with unstructured agent notes and call transcripts to answer deep questions, reconstruct customer stories, and generate SQL queries. How can I assist you today?",
      timestamp: 'Just now'
    }
  ]);

  const presetQuestions = [
    "Why did this customer miss the promise?",
    "What changed since the last contact?",
    "What worked for this customer before?",
    "What should I do next?",
    "Show customers with broken promises.",
    "Which customers need attention today?",
    "What is the total overdue portfolio exposure?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const resp = await queryAssistant(q, selectedCustomerId);
      const assistantMsg = {
        sender: 'assistant' as const,
        text: resp.answer,
        data: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "Error executing assistant query. Please ensure backend service is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Natural Language → SQL & RAG Synthesis</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Collections Assistant</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ask natural language queries across structured account databases, agent notes, and call audio transcripts.
            </p>
          </div>

          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 block font-semibold">Active Customer Context</span>
            <span className="text-teal-400 font-mono font-bold">Customer ID: {selectedCustomerId}</span>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Suggested Collections Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((pq, i) => (
              <button
                key={i}
                onClick={() => handleSend(pq)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-all flex items-center space-x-1.5 hover:text-white"
              >
                <span>{pq}</span>
                <ChevronRight className="w-3 h-3 text-teal-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-3xl rounded-2xl p-5 shadow-xl ${
              m.sender === 'user'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-none'
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              <div className="flex items-center justify-between space-x-4 mb-2 text-[11px] opacity-70">
                <span className="font-bold uppercase tracking-wider">
                  {m.sender === 'user' ? 'Sarah Jenkins (Collector)' : 'Collection Copilot AI'}
                </span>
                <span>{m.timestamp}</span>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {m.text}
              </p>

              {/* Data Query Metadata & SQL Section */}
              {m.data && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  
                  {/* Data Sources Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">Sources:</span>
                    {m.data.data_sources.map((ds, dsi) => (
                      <span key={dsi} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700 font-mono">
                        {ds}
                      </span>
                    ))}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono ml-auto">
                      Confidence: {m.data.confidence}%
                    </span>
                  </div>

                  {/* SQL Display if generated */}
                  {m.data.sql_query && (
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span className="font-mono text-teal-400 flex items-center space-x-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Generated SQL Query</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(m.data!.sql_query!)}
                          className="hover:text-white transition-colors flex items-center space-x-1"
                        >
                          {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="text-xs font-mono text-cyan-300 block whitespace-pre-wrap bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        {m.data.sql_query}
                      </code>
                    </div>
                  )}

                  {/* Tabular Results Output */}
                  {m.data.tabular_data && m.data.tabular_data.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                          <tr>
                            {Object.keys(m.data.tabular_data[0]).map((col, ci) => (
                              <th key={ci} className="px-3.5 py-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {m.data.tabular_data.map((row, ri) => (
                            <tr key={ri} className="hover:bg-slate-800/40">
                              {Object.values(row).map((val: any, vi) => (
                                <td key={vi} className="px-3.5 py-2 font-mono text-[11px]">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Notes & Transcripts RAG Quotes */}
                  {m.data.notes_retrieved && m.data.notes_retrieved.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contextual Notes Retrieved</span>
                      {m.data.notes_retrieved.map((nr, nri) => (
                        <div key={nri} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
                          <div className="text-[10px] text-teal-400 font-bold mb-1">{nr.source} {nr.date && `• ${nr.date}`}</div>
                          <p className="text-slate-300 italic">"{nr.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-300 font-medium">Consulting portfolios, notes, and generating SQL...</span>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <div className="sticky bottom-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask anything (e.g. 'Why did this customer miss payment?', 'Show customers with broken promises')..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all disabled:opacity-40 flex items-center space-x-2"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
