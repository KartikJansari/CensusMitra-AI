import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Search, 
  MapPin, 
  Phone, 
  FileText, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  Filter, 
  ExternalLink,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { ALL_STATES_SCHEDULES } from '../data/censusData';
import { StateSchedule, LanguageCode } from '../types/census';
import { sanitizeInput } from '../utils/securityAndValidation';

interface ScheduleExplorerProps {
  selectedLanguage: LanguageCode;
  onAskCensusMitra: (prompt: string) => void;
}

export const ScheduleExplorer: React.FC<ScheduleExplorerProps> = ({
  onAskCensusMitra,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const filteredSchedules = useMemo(() => {
    const cleanSearch = sanitizeInput(searchQuery).toLowerCase();
    return ALL_STATES_SCHEDULES.filter((item) => {
      const matchesSearch =
        !cleanSearch ||
        item.stateName.toLowerCase().includes(cleanSearch) ||
        item.stateNameHi.toLowerCase().includes(cleanSearch) ||
        item.nodalOfficer.toLowerCase().includes(cleanSearch);

      const matchesRegion = selectedRegion === 'All' || item.region === selectedRegion;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [searchQuery, selectedRegion, selectedStatus]);

  const getStatusBadge = (status: StateSchedule['status']) => {
    switch (status) {
      case 'Active Self-Enum':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active Self-Enumeration
          </span>
        );
      case 'Active Enumerator':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Enumerator Fieldwork Active
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Phase Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Upcoming Schedule
          </span>
        );
    }
  };

  const regions = ['All', 'North', 'South', 'East', 'West', 'Central', 'North East', 'UT'];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Official Notification Timelines
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            State & Union Territory Census 2027 Schedule Directory
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Official gazette notified schedules for Phase 1 (Houselisting & Housing Amenities) and Phase 2 (Population Enumeration) across India.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-slate-200">
          <div className="font-semibold text-amber-300">National Reference Timelines:</div>
          <div className="mt-1 space-y-0.5 text-[11px]">
            <div>• <strong>Phase 1:</strong> April – June 2026</div>
            <div>• <strong>Phase 2:</strong> Feb 9 – 28, 2027 (Revision: Mar 1-5)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="schedule-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by State / UT name (e.g. Maharashtra, महाराष्ट्र, Tamil Nadu)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active Self-Enum">Active Self-Enumeration</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Active Enumerator">Active Enumerator</option>
            </select>
          </div>
        </div>

        {/* Region Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Region:
          </span>
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedRegion === reg
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Schedules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {schedule.stateName}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {schedule.stateNameHi} • {schedule.type}
                  </span>
                </div>
                {getStatusBadge(schedule.status)}
              </div>

              {/* Timelines Details Box */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-2.5 mb-3">
                {/* Phase 1 */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                    <span>Phase 1 (Houselisting & Housing):</span>
                  </div>
                  <div className="text-slate-800 font-semibold mt-0.5">
                    {new Date(schedule.phase1Start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(schedule.phase1End).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Online Self-Enum: {new Date(schedule.selfEnumPhase1Start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} to {new Date(schedule.selfEnumPhase1End).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center justify-between">
                    <span>Phase 2 (Population Enumeration):</span>
                  </div>
                  <div className="text-slate-800 font-semibold mt-0.5">
                    {new Date(schedule.phase2Start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(schedule.phase2End).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Contact & Gazette */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">Nodal Helpline: <strong className="text-slate-800">{schedule.contactHelpline}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="font-mono text-[10px] truncate">{schedule.gazetteNotification}</span>
                </div>
              </div>
            </div>

            {/* Ask AI Prompt Button */}
            <button
              onClick={() => onAskCensusMitra(`What is the complete schedule, self-enumeration window, and district rules for ${schedule.stateName}?`)}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
              <span>Ask CensusMitra about {schedule.stateName}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
