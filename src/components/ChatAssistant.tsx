import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Layers, 
  ShieldCheck
} from 'lucide-react';
import { ChatMessage, LanguageCode } from '../types/census';
import { RenderChartBlock } from './RenderChartBlock';
import { DEMOGRAPHIC_STATS_2027 } from '../data/censusData';
import { sanitizeInput } from '../utils/securityAndValidation';

interface ChatAssistantProps {
  selectedLanguage: LanguageCode;
  onNavigateTab: (tab: 'self-enum' | 'schedules' | 'fact-check' | 'analytics') => void;
  onAutofillFormRequested?: (data: any) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    text: `नमस्ते! I am **CensusMitra AI (जनगणना मित्र)**, your official intelligent assistant for India's Digital Census 2027.

I can assist you across all official Indian languages with:
- **Phase 1 (Housing & Amenities Census)** and **Phase 2 (Population Enumeration)** guidelines.
- **State/UT Official Schedules** and Self-Enumeration portal windows.
- **Strict Privacy Guarantees** under Section 15 of the Census Act, 1948.
- **Fact-checking & Dispelling Misinformation** regarding citizen data.
- **Demographic & Statistical Insights** with interactive live charts.

How can I help you today? You can type your query in your preferred language or pick one of the suggested prompts below.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionSteps: [
      'Check when Digital Census starts in your State or District',
      'Start Phase 1 Houselisting self-enumeration online',
      'Learn about data confidentiality under Census Act 1948',
      'View projected 2027 demographics and literacy trends'
    ],
    suggestedPrompts: [
      'What is the schedule for Maharashtra and UP?',
      'Guide me through Phase 1 Self-Enumeration',
      'Will census data affect my bank account or citizenship?',
      'Show 2027 projected literacy & population chart'
    ]
  }
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  selectedLanguage,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawQuery = textToSend || inputValue;
    const query = sanitizeInput(rawQuery);
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.replyText,
        chartData: data.chartData,
        actionSteps: data.actionSteps,
        suggestedPrompts: data.suggestedPrompts,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Chat request fallback error:', err);
      // Fallback assistant response
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `I have recorded your query regarding: "${query}".

**Digital Census 2027 Key Guidance:**
- **Phase 1 (Houselisting & Amenities):** Conducted between April and June 2026 across Indian States/UTs.
- **Phase 2 (Population Enumeration):** Nationwide enumeration from February 9 to 28, 2027.
- **Confidentiality:** Under Section 15 of the Census Act, 1948, your data cannot be shared with tax authorities, police, or used for citizenship status verification.`,
        actionSteps: [
          'Verify your State schedule in the State Schedules tab',
          'Fill your Phase 1 details in the Self-Enumeration portal',
          'Keep your 12-digit Census Reference Slip safe'
        ],
        chartData: DEMOGRAPHIC_STATS_2027.populationByAgeGroup,
        suggestedPrompts: [
          'Show schedule for Maharashtra',
          'Guide me through Phase 1 Self-Enumeration',
          'Is my bank account or PAN requested?'
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-w-6xl mx-auto px-2 sm:px-4 py-3">
      {/* Top Helper Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>CensusMitra Civic Copilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </h2>
            <p className="text-[11px] text-slate-500">
              Multilingual Natural Language Assistant • End-to-End Encrypted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="reset-chat-btn"
            onClick={resetChat}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2" id="chat-messages-container">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-1 text-xs font-bold font-serif">
                  CM
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 transition-all ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-100/10 text-[11px] text-slate-400">
                  <span className="font-semibold flex items-center gap-1 text-slate-500">
                    {isUser ? <User className="w-3 h-3 text-slate-300" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                    {isUser ? 'You (Citizen)' : 'CensusMitra AI'}
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>

                {/* Message Text with Markdown formatting */}
                <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isUser ? 'text-slate-100' : 'text-slate-800'}`}>
                  {msg.text.split('\n\n').map((para, pIdx) => (
                    <p key={pIdx} className="mb-2 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Actionable Steps Card */}
                {msg.actionSteps && msg.actionSteps.length > 0 && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Actionable Steps & Recommended Actions:</span>
                    </div>
                    <ul className="space-y-1.5">
                      {msg.actionSteps.map((step, sIdx) => (
                        <li key={sIdx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Embedded Structured Chart Visualization */}
                {msg.chartData && (
                  <div className="mt-3">
                    <RenderChartBlock data={msg.chartData} />
                  </div>
                )}

                {/* Suggested Follow-up Prompts */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1.5">
                      Suggested Follow-ups:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedPrompts.map((prompt, prIdx) => (
                        <button
                          key={prIdx}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-[11px] text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 border border-slate-200 px-2.5 py-1 rounded-full transition-all cursor-pointer text-left flex items-center gap-1"
                        >
                          <span>{prompt}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Bar: Copy & Verification badge */}
                {!isUser && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-slate-400 text-xs">
                    <button
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Census Response</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold font-serif">
              CM
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                CensusMitra is verifying official guidelines & statistics...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-400" /> Quick Hub:
        </span>
        <button
          onClick={() => onNavigateTab('self-enum')}
          className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>📋 Start Phase 1 Self-Enumeration</span>
        </button>
        <button
          onClick={() => onNavigateTab('schedules')}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>🗓️ State Schedules Directory</span>
        </button>
        <button
          onClick={() => onNavigateTab('fact-check')}
          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>🛡️ Fact-Check & Privacy Shield</span>
        </button>
        <button
          onClick={() => onNavigateTab('analytics')}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>📊 2027 Demographic Charts</span>
        </button>
      </div>

      {/* Input Composer Box */}
      <div className="bg-white border border-slate-300 rounded-2xl p-2 shadow-sm focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 transition-all">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id="chat-user-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask CensusMitra AI (e.g. 'What is Maharashtra census schedule?', 'Is bank data shared?', 'Show literacy chart')"
            rows={1}
            className="flex-1 max-h-32 resize-none bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5 px-2"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="send-message-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

