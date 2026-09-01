import React from 'react';
import { 
  ShieldCheck, 
  PhoneCall, 
  Languages, 
  MessageSquare, 
  ClipboardList, 
  CalendarDays, 
  ShieldAlert, 
  BarChart2,
  Lock,
  Sparkles,
  Check
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/censusData';
import { LanguageCode } from '../types/census';

interface NavbarProps {
  activeTab: 'chat' | 'self-enum' | 'schedules' | 'fact-check' | 'analytics';
  setActiveTab: (tab: 'chat' | 'self-enum' | 'schedules' | 'fact-check' | 'analytics') => void;
  selectedLanguage: LanguageCode;
  setSelectedLanguage: (lang: LanguageCode) => void;
  onOpenQuickQuery?: (prompt: string) => void;
  onOpenAuditModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLanguage,
  setSelectedLanguage,
  onOpenAuditModal,
}) => {
  const [copiedHelpline, setCopiedHelpline] = React.useState(false);

  const copyHelpline = () => {
    navigator.clipboard?.writeText('1800-11-2027');
    setCopiedHelpline(true);
    setTimeout(() => setCopiedHelpline(false), 2000);
  };

  const navItems = [
    {
      id: 'chat' as const,
      label: 'CensusMitra AI',
      sub: 'AI Assistant',
      icon: MessageSquare,
      badge: 'Multilingual'
    },
    {
      id: 'self-enum' as const,
      label: 'Self-Enumeration',
      sub: 'Phase 1 & 2 Portal',
      icon: ClipboardList,
      badge: 'Active'
    },
    {
      id: 'schedules' as const,
      label: 'State Schedules',
      sub: 'All 36 States & UTs',
      icon: CalendarDays
    },
    {
      id: 'fact-check' as const,
      label: 'Fact-Check & Privacy',
      sub: 'Census Act Sec 15',
      icon: ShieldAlert
    },
    {
      id: 'analytics' as const,
      label: 'Census Visualizer',
      sub: '2027 Projections',
      icon: BarChart2
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Civic National Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-slate-800 to-emerald-800 text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              भारत सरकार | Government of India — Office of the Registrar General & Census Commissioner
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors cursor-pointer" onClick={copyHelpline} title="Click to copy National Census Helpline">
              <PhoneCall className="w-3 h-3 text-amber-300" />
              <span>Helpline: <strong className="text-white">1800-11-2027</strong></span>
              {copiedHelpline ? <Check className="w-3 h-3 text-emerald-300" /> : null}
            </div>

            <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-200">
              <Lock className="w-3 h-3 text-emerald-300" />
              <span>Census Act 1948 Confidential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & National Crest */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-serif font-bold text-xl border border-white/20 shrink-0">
              <div className="text-center leading-none">
                <span className="block text-[9px] tracking-widest text-amber-100 font-sans font-semibold">CENSUS</span>
                <span className="text-base font-extrabold tracking-tighter">2027</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>CensusMitra AI</span>
                  <span className="text-sm font-normal text-slate-500">| जनगणना मित्र</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5" /> Official AI
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-tight">
                Digital Self-Enumeration & Citizen Intelligence Portal (भारत की 16वीं डिजिटल जनगणना)
              </p>
            </div>
          </div>

          {/* Right Actions: Language Selector & Status */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors">
              <Languages className="w-4 h-4 text-slate-600 shrink-0" />
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none pr-1"
                aria-label="Select Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="security-badge-btn"
              onClick={() => setActiveTab('fact-check')}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="View Census Confidentiality & Legal Safeguards (Section 15 Census Act)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">256-bit Encrypted</span>
            </button>

            {/* Quality & Compliance Test Suite Trigger */}
            <button
              id="open-audit-suite-btn"
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-200 to-amber-300 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Run Automated Compliance & Quality Tests (Audit Mode)"
              aria-label="Open Compliance & Quality Audit Suite"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-pulse" />
              <span className="hidden lg:inline">Audit Suite (6 Parameters)</span>
              <span className="lg:hidden">Audit</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav 
          role="tablist" 
          aria-label="Census Portal Sections"
          className="flex items-center gap-1 overflow-x-auto no-scrollbar mt-3 pt-2 border-t border-slate-100"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
