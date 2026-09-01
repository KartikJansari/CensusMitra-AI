import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  Home, 
  Sparkles, 
  Download, 
  Layers, 
  Info,
  CheckCircle,
  ArrowUpRight,
  PieChart as PieIcon,
  MessageSquare
} from 'lucide-react';
import { DEMOGRAPHIC_STATS_2027 } from '../data/censusData';
import { RenderChartBlock } from './RenderChartBlock';
import { LanguageCode } from '../types/census';

interface AnalyticsDashboardProps {
  selectedLanguage: LanguageCode;
  onAskCensusMitra: (prompt: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onAskCensusMitra,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'age' | 'literacy' | 'amenities' | 'sexRatio'>('age');
  const stats = DEMOGRAPHIC_STATS_2027;

  const downloadReportJson = () => {
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `India-Census-2027-Demographic-Projections.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActiveChartData = () => {
    switch (activeChartTab) {
      case 'literacy':
        return stats.literacyTrends;
      case 'amenities':
        return stats.housingAmenitiesComparison;
      case 'sexRatio':
        return stats.stateSexRatioComparison;
      default:
        return stats.populationByAgeGroup;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Official Statistical Modeling & Visualizer
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            India Digital Census 2027: Demographic & Amenities Intelligence
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Comparative analysis of India's demographic transition, urbanization, human development indicators, and housing amenities (2011 Actual vs 2027 Projections).
          </p>
        </div>

        <button
          onClick={downloadReportJson}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Projections Data</span>
        </button>
      </div>

      {/* Key Metric Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Projected Population
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {stats.overview.projectedPopulation2027}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+20.5% vs 2011</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Projected Sex Ratio
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {stats.overview.projectedSexRatio2027} <span className="text-xs text-slate-500 font-normal">/1000 M</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14 vs 2011 (940)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Estimated Literacy
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {stats.overview.projectedLiteracyRate2027}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+8.36% vs 2011</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Digital Connectivity
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {stats.overview.digitalConnectivity2027}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1">
            <Sparkles className="w-3 h-3" />
            <span>84.6% Households</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Clean Cooking Fuel
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {stats.overview.cleanCookingFuelAccess2027}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Up from 28.5%</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Visualizer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Switcher Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveChartTab('age')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'age'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Age Distribution & Youth Dividend
            </button>

            <button
              onClick={() => setActiveChartTab('literacy')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'literacy'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Literacy Trajectory (1991–2027)
            </button>

            <button
              onClick={() => setActiveChartTab('amenities')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'amenities'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Housing Amenities (2011 vs 2027)
            </button>

            <button
              onClick={() => setActiveChartTab('sexRatio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'sexRatio'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Top States Sex Ratio
            </button>
          </div>

          <button
            onClick={() => onAskCensusMitra(`Explain the key insights and policy implications of India's 2027 ${activeChartTab} census data.`)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI to Analyze this Chart</span>
          </button>
        </div>

        {/* Render Chart */}
        <div>
          <RenderChartBlock data={getActiveChartData()} />
        </div>

        {/* Key Analysis Takeaways */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-600" />
            <span>Key Demographic Insights for Policy Planning:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600">
            <li>
              <strong>Demographic Dividend Window:</strong> 65.6% of India’s population is concentrated in the working-age bracket (15–59 years), reaching its demographic peak.
            </li>
            <li>
              <strong>Narrowing Gender Literacy Gap:</strong> The male-female literacy differential is projected to decline from 16.3% in 2011 to 10.8% in 2027.
            </li>
            <li>
              <strong>Digital First Infrastructure:</strong> Over 84% of households now possess internet access, enabling the fastest and most secure Digital Self-Enumeration in Indian history.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
