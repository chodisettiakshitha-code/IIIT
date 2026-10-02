import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Shield, Database, MessageSquare, LayoutDashboard, UserCheck, 
  Sparkles, CheckCircle2, ChevronDown, User, AlertCircle
} from 'lucide-react';
import { searchCustomers } from '../api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCustomerId: number;
  onSelectCustomer: (id: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCustomerId,
  onSelectCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchCustomers(searchQuery);
        setSearchResults(data.customers);
        setDropdownOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (id: number) => {
    onSelectCustomer(id);
    setActiveTab('customer360');
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const personas = [
    { id: 1, name: 'John Doe', tag: 'Salary Delay' },
    { id: 2, name: 'Priya Sharma', tag: 'Fraud Dispute' },
    { id: 3, name: 'Robert Chen', tag: '3x Broken PTP' },
    { id: 4, name: 'Sarah Connor', tag: 'Hardship' },
    { id: 5, name: 'Elena Rostova', tag: 'Travel VIP' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-[2px] shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Collection Copilot</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">360</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wide">Synthetic Demo Data</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Customer Story & Next Best Action</p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md mx-6 relative" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Customer ID (CUST-1001), Name, Phone, Account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setDropdownOpen(true); }}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-inner"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Dropdown */}
            {dropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="p-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Matching Customer Records ({searchResults.length})
                </div>
                {searchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between border-b border-slate-800/50 last:border-b-0 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-white">{c.full_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono">{c.customer_ref}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.segment} • {c.phone}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.max_dpd > 60 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        c.max_dpd > 30 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}>
                        {c.max_dpd} DPD
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">${c.total_overdue.toLocaleString()} overdue</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('customer360')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'customer360'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Customer 360</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'assistant'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('dataQuality')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dataQuality'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Data Quality</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('governance')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'governance'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Governance</span>
            </button>
          </nav>

          {/* Active Agent Profile Indicator */}
          <div className="flex items-center pl-4 border-l border-slate-800">
            <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs">
                SJ
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <span>Sarah Jenkins</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-[10px] text-teal-400 font-medium">Collections Specialist</div>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Demo Persona Chips Bar */}
        <div className="py-2 flex items-center space-x-2 overflow-x-auto text-xs border-t border-slate-800/50">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Demo Personas:</span>
          </span>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                selectedCustomerId === p.id && activeTab === 'customer360'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              <span>{p.name}</span>
              <span className="opacity-70 text-[10px]">({p.tag})</span>
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};
