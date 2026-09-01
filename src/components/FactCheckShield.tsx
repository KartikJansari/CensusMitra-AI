import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Scale, 
  Lock, 
  HelpCircle, 
  Send, 
  Sparkles,
  Bot
} from 'lucide-react';
import { MYTH_BUSTER_DATABASE } from '../data/censusData';
import { MythFactItem, LanguageCode } from '../types/census';
import { sanitizeInput } from '../utils/securityAndValidation';

interface FactCheckShieldProps {
  selectedLanguage: LanguageCode;
  onAskCensusMitra: (prompt: string) => void;
}

export const FactCheckShield: React.FC<FactCheckShieldProps> = ({
  onAskCensusMitra,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customRumorInput, setCustomRumorInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResponse, setVerifiedResponse] = useState<string | null>(null);

  const categories = ['All', 'Citizenship', 'Banking & Tax', 'Biometrics', 'Confidentiality', 'Legal Mandatory'];

  const filteredMyths = useMemo(() => {
    const cleanSearch = sanitizeInput(searchQuery).toLowerCase();
    return MYTH_BUSTER_DATABASE.filter((item) => {
      const matchesSearch =
        !cleanSearch ||
        item.rumor.toLowerCase().includes(cleanSearch) ||
        item.rumorHi.toLowerCase().includes(cleanSearch) ||
        item.fact.toLowerCase().includes(cleanSearch) ||
        item.legalBasis.toLowerCase().includes(cleanSearch);

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleVerifyCustomRumor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRumorInput.trim() || isVerifying) return;

    setIsVerifying(true);
    setVerifiedResponse(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Fact-Check this rumor or doubt about Digital Census 2027: "${customRumorInput}". State clearly whether it is TRUE, FALSE, or MISLEADING, cite Section 15 of Census Act 1948 or relevant laws, and explain why citizen privacy is protected.`,
        }),
      });
      const data = await res.json();
      setVerifiedResponse(data.replyText || 'Census data is 100% confidential under Section 15 of the Census Act, 1948.');
    } catch (e) {
      setVerifiedResponse(
        `**Official Legal Verification:**\n\nUnder **Section 15 of the Census Act, 1948**, all answers given during the Census are completely confidential. They cannot be used as evidence in courts, shared with income tax authorities, or linked to NRC/citizenship registers.`
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Privacy Shield Top Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wide border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Section 15, Census Act 1948 Protected</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Anti-Misinformation Hub & Official Citizen Privacy Shield
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Official fact-checking center dispelling viral rumors, fraudulent messages, and clarifying statutory legal protections safeguarding every Indian citizen's census response.
          </p>
        </div>

        <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-slate-200 shrink-0 max-w-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <Scale className="w-4 h-4" />
            <span>Statutory Non-Disclosure</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            Census records cannot be inspected by Courts, Police, Income Tax, or private corporations. Anonymized statistical aggregates only.
          </p>
        </div>
      </div>

      {/* Interactive AI Rumor Verifier */}
      <div className="bg-white border-2 border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live AI Rumor & WhatsApp Forward Verifier
            </h3>
            <p className="text-xs text-slate-500">
              Paste any suspicious social media post, message, or question to get instant legal verification from CensusMitra AI
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyCustomRumor} className="space-y-3 mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              id="rumor-verifier-input"
              value={customRumorInput}
              onChange={(e) => setCustomRumorInput(e.target.value)}
              placeholder="e.g. Will census enumerators ask for my bank OTP? Will I lose government welfare if I don't fill Phase 1?"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-800"
            />
            <button
              type="submit"
              disabled={!customRumorInput.trim() || isVerifying}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying...' : 'Verify Rumor'}</span>
            </button>
          </div>
        </form>

        {verifiedResponse && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-600 font-bold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>CensusMitra AI Official Fact-Check Verdict</span>
              </span>
              <button
                onClick={() => onAskCensusMitra(`Tell me more about: ${customRumorInput}`)}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Ask more in Chat &rarr;
              </button>
            </div>
            <div className="leading-relaxed whitespace-pre-line text-slate-700">
              {verifiedResponse}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="myth-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search myth or topic (e.g. Citizenship, Bank, Biometrics, Police, Taxes)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Myth vs Fact Cards Grid */}
      <div className="space-y-4">
        {filteredMyths.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
          >
            {/* Header / Category & Verdict */}
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {item.category}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 ${
                  item.verdict === 'FALSE'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : item.verdict === 'FACT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {item.verdict === 'FALSE' ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                <span>VERDICT: {item.verdict}</span>
              </span>
            </div>

            {/* Rumor Quote */}
            <div className="bg-red-50/70 border-l-4 border-red-500 p-3 rounded-r-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block mb-0.5">
                Viral Rumor / Misconception:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-red-950">
                "{item.rumor}"
              </p>
              <p className="text-[11px] text-red-800 mt-1 font-sans">
                "{item.rumorHi}"
              </p>
            </div>

            {/* Verified Fact & Legal Citation */}
            <div className="bg-emerald-50/70 border-l-4 border-emerald-600 p-3 rounded-r-xl space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Official Verified Fact:
              </span>
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                {item.fact}
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
                {item.factHi}
              </p>
            </div>

            {/* Legal Basis & Source Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><strong>Legal Reference:</strong> {item.legalBasis}</span>
              </div>
              <button
                onClick={() => onAskCensusMitra(`Explain in detail the legal protection for: "${item.rumor}"`)}
                className="text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Ask CensusMitra AI</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
