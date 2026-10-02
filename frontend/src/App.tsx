import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CustomerWorkspace } from './components/CustomerWorkspace';
import { AssistantView } from './components/AssistantView';
import { DataQualityView } from './components/DataQualityView';
import { GovernanceView } from './components/GovernanceView';
import { Shield, Database } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1); // Defaults to John Doe

  const handleSelectCustomer = (id: number) => {
    setSelectedCustomerId(id);
    setActiveTab('customer360');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            onSelectCustomer={handleSelectCustomer}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'customer360' && (
          <CustomerWorkspace
            customerId={selectedCustomerId}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'assistant' && (
          <AssistantView
            selectedCustomerId={selectedCustomerId}
          />
        )}

        {activeTab === 'dataQuality' && (
          <DataQualityView />
        )}

        {activeTab === 'governance' && (
          <GovernanceView />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-12 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">Collection Copilot 360</span>
            <span>•</span>
            <span>Customer Story Reconstruction & Next Best Action</span>
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono text-[10px]">v1.0 Hackathon Edition</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Human-in-the-Loop Certified</span>
            </span>
            <span className="flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>SQLite + FastAPI + React TS</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
