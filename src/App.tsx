import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatAssistant } from './components/ChatAssistant';
import { SelfEnumerationPortal } from './components/SelfEnumerationPortal';
import { ScheduleExplorer } from './components/ScheduleExplorer';
import { FactCheckShield } from './components/FactCheckShield';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ComplianceAuditModal } from './components/ComplianceAuditModal';
import { LanguageCode } from './types/census';
import { ShieldCheck, Lock, PhoneCall, Bot, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'self-enum' | 'schedules' | 'fact-check' | 'analytics'>('chat');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Keyboard accessibility listeners (Alt+1..5 for tabs, Alt+T for audit suite)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('chat');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('self-enum');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('schedules');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('fact-check');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('analytics');
        } else if (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setIsAuditModalOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape' && isAuditModalOpen) {
        setIsAuditModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuditModalOpen]);

  const handleAskCensusMitra = (prompt: string) => {
    setActiveTab('chat');
    // Allow chat assistant to pick up the injected query
    setTimeout(() => {
      const input = document.getElementById('chat-user-input') as HTMLTextAreaElement | null;
      if (input) {
        input.value = prompt;
        const sendBtn = document.getElementById('send-message-btn') as HTMLButtonElement | null;
        if (sendBtn) {
          sendBtn.click();
        }
      }
    }, 150);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Accessibility Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-slate-900 focus:text-white focus:p-3 focus:rounded-xl focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-4" tabIndex={-1}>
        <div
          role="tabpanel"
          id="panel-chat"
          aria-labelledby="nav-tab-chat"
          hidden={activeTab !== 'chat'}
          className={activeTab === 'chat' ? 'block' : 'hidden'}
        >
          <ChatAssistant
            selectedLanguage={selectedLanguage}
            onNavigateTab={setActiveTab}
          />
        </div>

        <div
          role="tabpanel"
          id="panel-self-enum"
          aria-labelledby="nav-tab-self-enum"
          hidden={activeTab !== 'self-enum'}
          className={activeTab === 'self-enum' ? 'block' : 'hidden'}
        >
          <SelfEnumerationPortal
            selectedLanguage={selectedLanguage}
            onAskCensusMitra={handleAskCensusMitra}
          />
        </div>

        <div
          role="tabpanel"
          id="panel-schedules"
          aria-labelledby="nav-tab-schedules"
          hidden={activeTab !== 'schedules'}
          className={activeTab === 'schedules' ? 'block' : 'hidden'}
        >
          <ScheduleExplorer
            selectedLanguage={selectedLanguage}
            onAskCensusMitra={handleAskCensusMitra}
          />
        </div>

        <div
          role="tabpanel"
          id="panel-fact-check"
          aria-labelledby="nav-tab-fact-check"
          hidden={activeTab !== 'fact-check'}
          className={activeTab === 'fact-check' ? 'block' : 'hidden'}
        >
          <FactCheckShield
            selectedLanguage={selectedLanguage}
            onAskCensusMitra={handleAskCensusMitra}
          />
        </div>

        <div
          role="tabpanel"
          id="panel-analytics"
          aria-labelledby="nav-tab-analytics"
          hidden={activeTab !== 'analytics'}
          className={activeTab === 'analytics' ? 'block' : 'hidden'}
        >
          <AnalyticsDashboard
            selectedLanguage={selectedLanguage}
            onAskCensusMitra={handleAskCensusMitra}
          />
        </div>
      </main>

      {/* Persistent Civic Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto text-slate-600 text-xs py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 font-serif font-bold flex items-center justify-center text-sm shrink-0">
              2027
            </div>
            <div>
              <div className="font-bold text-slate-800">
                भारत की 16वीं डिजिटल जनगणना 2027 | Census of India 2027
              </div>
              <div className="text-[11px] text-slate-500">
                Office of the Registrar General & Census Commissioner • Ministry of Home Affairs, Govt. of India
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 text-[11px]">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
              title="Launch Automated Audit Benchmark Suite"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-700" />
              <span>Compliance & Quality Audit Suite (Alt+T)</span>
            </button>

            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Census Act 1948 (Section 15 Confidentiality)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>DPDP Act 2023 Compliant</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
              <span>National Toll-Free: <strong>1800-11-2027</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Quick-Access Button when on other tabs */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-amber-600 to-orange-500 text-white p-3.5 rounded-full shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform flex items-center gap-2 font-semibold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          title="Open CensusMitra AI Assistant"
          aria-label="Open CensusMitra AI Assistant"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">Ask CensusMitra AI</span>
        </button>
      )}

      {/* Compliance & Quality Audit Inspector Modal */}
      <ComplianceAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
