import React, { useState } from 'react';
import { Calendar, Trash2, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, LayoutGrid, FileSpreadsheet } from 'lucide-react';
import { Decision } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  decisions: Decision[];
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onStartNew: () => void;
}

export default function Dashboard({ decisions, onSelect, onDelete, onStartNew }: DashboardProps) {
  const [filter, setFilter] = useState<'all' | 'undecided' | 'decided'>('all');

  const filteredDecisions = decisions.filter(d => {
    if (filter === 'undecided') return d.status === 'undecided';
    if (filter === 'decided') return d.status === 'decided';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-950">
            Your Decisions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, analyze, and resolve your complex dilemmas.
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
        >
          New Dilemma
        </button>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-200">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['all', 'undecided', 'decided'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                filter === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t} ({decisions.filter(d => t === 'all' || (t === 'undecided' ? d.status === 'undecided' : d.status === 'decided')).length})
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Analyzed: {decisions.length}
        </div>
      </div>

      {/* Grid of cards */}
      {filteredDecisions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto px-6"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100">
            <HelpCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-display font-semibold text-slate-900 mb-2">
            No Decisions Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {filter === 'all'
              ? "You haven't added any dilemmas yet. Get started by describing what is on your mind."
              : `You don't have any ${filter} decisions in your history.`}
          </p>
          <button
            onClick={onStartNew}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-emerald-600 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Create Your First Tiebreaker
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDecisions.map((decision) => (
            <motion.div
              key={decision.id}
              layoutId={`card-${decision.id}`}
              onClick={() => onSelect(decision.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
            >
              {/* Card top */}
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-3">
                  {decision.status === 'decided' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                      ● Active Dilemma
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(decision.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-slate-950 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                  {decision.title}
                </h3>

                {decision.context && (
                  <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                    {decision.context}
                  </p>
                )}

                {/* Badges for active frameworks */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {decision.prosCons && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <LayoutGrid className="w-3 h-3 text-slate-400" /> Pros & Cons
                    </span>
                  )}
                  {decision.swot && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <LayoutGrid className="w-3 h-3 text-slate-400" /> SWOT
                    </span>
                  )}
                  {decision.comparison && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <FileSpreadsheet className="w-3 h-3 text-slate-400" /> Matrix
                    </span>
                  )}
                </div>
              </div>

              {/* Card bottom */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                {decision.status === 'decided' ? (
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium block">Resolution:</span>
                    <span className="font-semibold text-slate-900 line-clamp-1">{decision.chosenOption}</span>
                  </div>
                ) : (
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium block">AI Recommendation:</span>
                    <span className="font-semibold text-emerald-700 line-clamp-1">
                      {decision.aiVerdict?.recommendation || "Analyzing..."}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => onDelete(decision.id, e)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                    title="Delete Decision"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                  <span className="p-1 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
