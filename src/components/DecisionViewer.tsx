import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, AlertTriangle, HelpCircle, 
  Plus, Trash2, LayoutGrid, FileSpreadsheet, ShieldAlert, Sparkles, Scale, Check
} from 'lucide-react';
import { Decision, DecisionItem, SwotItem, ComparisonCriterion } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DecisionViewerProps {
  decision: Decision;
  onBack: () => void;
  onUpdateDecision: (updated: Decision) => void;
  onDeleteDecision: (id: string) => void;
  onConsult: (message: string) => Promise<{ reply: string, suggestedUpdates?: any }>;
  isConsulting: boolean;
}

export default function DecisionViewer({ 
  decision, 
  onBack, 
  onUpdateDecision, 
  onDeleteDecision,
  onConsult,
  isConsulting
}: DecisionViewerProps) {
  const [activeTab, setActiveTab] = useState<'verdict' | 'proscons' | 'matrix' | 'swot'>('verdict');
  const [chatMessage, setChatMessage] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Quick Inline Item Addition state
  const [newItemText, setNewItemText] = useState('');
  const [newItemScore, setNewItemScore] = useState(3);
  const [newItemCategory, setNewItemCategory] = useState('Personal');
  const [showAddForm, setShowAddForm] = useState<'pro' | 'con' | 'strength' | 'weakness' | 'opportunity' | 'threat' | null>(null);

  // Helper: Format rating with filled dots
  const renderDots = (score: number, max: number = 5, colorClass: string = 'bg-emerald-500') => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <span 
            key={i} 
            className={`w-2 h-2 rounded-full ${i < score ? colorClass : 'bg-slate-200'}`} 
          />
        ))}
      </div>
    );
  };

  // 1. Handlers for manual additions/deletions of items to help users custom-tailor the AI's results
  const handleAddProCon = (type: 'pro' | 'con') => {
    if (!newItemText.trim()) return;

    const newItem: DecisionItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newItemText,
      score: newItemScore,
      category: newItemCategory,
      description: "Added manually"
    };

    const updatedDecision = { ...decision };
    if (!updatedDecision.prosCons) {
      updatedDecision.prosCons = { pros: [], cons: [] };
    }

    if (type === 'pro') {
      updatedDecision.prosCons.pros = [...updatedDecision.prosCons.pros, newItem];
    } else {
      updatedDecision.prosCons.cons = [...updatedDecision.prosCons.cons, newItem];
    }

    onUpdateDecision(updatedDecision);
    resetForm();
  };

  const handleDeleteProCon = (type: 'pro' | 'con', id: string) => {
    const updatedDecision = { ...decision };
    if (!updatedDecision.prosCons) return;

    if (type === 'pro') {
      updatedDecision.prosCons.pros = updatedDecision.prosCons.pros.filter(p => p.id !== id);
    } else {
      updatedDecision.prosCons.cons = updatedDecision.prosCons.cons.filter(c => c.id !== id);
    }

    onUpdateDecision(updatedDecision);
  };

  const handleAddSwot = (quadrant: 'strengths' | 'weaknesses' | 'opportunities' | 'threats') => {
    if (!newItemText.trim()) return;

    const newItem: SwotItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newItemText,
      impact: newItemScore >= 4 ? 'high' : newItemScore === 3 ? 'medium' : 'low',
      description: "Added manually"
    };

    const updatedDecision = { ...decision };
    if (!updatedDecision.swot) {
      updatedDecision.swot = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    }

    updatedDecision.swot[quadrant] = [...updatedDecision.swot[quadrant], newItem];
    onUpdateDecision(updatedDecision);
    resetForm();
  };

  const handleDeleteSwot = (quadrant: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', id: string) => {
    const updatedDecision = { ...decision };
    if (!updatedDecision.swot) return;

    updatedDecision.swot[quadrant] = updatedDecision.swot[quadrant].filter(s => s.id !== id);
    onUpdateDecision(updatedDecision);
  };

  const resetForm = () => {
    setNewItemText('');
    setNewItemScore(3);
    setNewItemCategory('Personal');
    setShowAddForm(null);
  };

  // Resolve / Decide Dilemma
  const handleMarkResolved = (option: string) => {
    const updatedDecision: Decision = {
      ...decision,
      status: 'decided',
      chosenOption: option
    };
    onUpdateDecision(updatedDecision);
    setShowResolveModal(false);
  };

  const handleMarkUndecided = () => {
    const updatedDecision: Decision = {
      ...decision,
      status: 'undecided',
      chosenOption: undefined
    };
    onUpdateDecision(updatedDecision);
  };

  // Submit Consultation Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isConsulting) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');

    // Update state with user message
    const currentHistory = decision.chatHistory || [];
    const updatedHistory = [
      ...currentHistory,
      {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'user' as const,
        message: userMsg,
        timestamp: new Date().toISOString()
      }
    ];

    const updatedDecisionBeforeAI = {
      ...decision,
      chatHistory: updatedHistory
    };
    onUpdateDecision(updatedDecisionBeforeAI);

    // Fetch reply
    try {
      const response = await onConsult(userMsg);
      
      const updatedHistoryWithAI = [
        ...updatedHistory,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'ai' as const,
          message: response.reply,
          timestamp: new Date().toISOString()
        }
      ];

      let updatedDecisionFinal = {
        ...updatedDecisionBeforeAI,
        chatHistory: updatedHistoryWithAI
      };

      // Process automatic suggested matrix updates from AI
      if (response.suggestedUpdates) {
        const su = response.suggestedUpdates;
        if (su.addPro && su.addPro.length > 0) {
          const pros = updatedDecisionFinal.prosCons?.pros || [];
          su.addPro.forEach((p: any) => pros.push({ id: Math.random().toString(), ...p }));
          if (updatedDecisionFinal.prosCons) updatedDecisionFinal.prosCons.pros = pros;
        }
        if (su.addCon && su.addCon.length > 0) {
          const cons = updatedDecisionFinal.prosCons?.cons || [];
          su.addCon.forEach((c: any) => cons.push({ id: Math.random().toString(), ...c }));
          if (updatedDecisionFinal.prosCons) updatedDecisionFinal.prosCons.cons = cons;
        }
        if (su.addStrength && su.addStrength.length > 0 && updatedDecisionFinal.swot) {
          su.addStrength.forEach((s: any) => updatedDecisionFinal.swot?.strengths.push({ id: Math.random().toString(), ...s }));
        }
        if (su.addWeakness && su.addWeakness.length > 0 && updatedDecisionFinal.swot) {
          su.addWeakness.forEach((w: any) => updatedDecisionFinal.swot?.weaknesses.push({ id: Math.random().toString(), ...w }));
        }
        if (su.addOpportunity && su.addOpportunity.length > 0 && updatedDecisionFinal.swot) {
          su.addOpportunity.forEach((o: any) => updatedDecisionFinal.swot?.opportunities.push({ id: Math.random().toString(), ...o }));
        }
        if (su.addThreat && su.addThreat.length > 0 && updatedDecisionFinal.swot) {
          su.addThreat.forEach((t: any) => updatedDecisionFinal.swot?.threats.push({ id: Math.random().toString(), ...t }));
        }
      }

      onUpdateDecision(updatedDecisionFinal);
    } catch (err) {
      console.error(err);
    }
  };

  // Matrix calculation helpers
  const getMatrixTotals = () => {
    if (!decision.comparison) return { totals: {}, maxOption: '' };
    const { options, criteria } = decision.comparison;
    const totals: { [opt: string]: number } = {};

    options.forEach(opt => {
      totals[opt] = 0;
    });

    criteria.forEach(crit => {
      options.forEach(opt => {
        const scoreObj = crit.scores[opt] || { value: 3 };
        totals[opt] += scoreObj.value * crit.importance;
      });
    });

    let maxVal = -1;
    let maxOption = '';
    Object.entries(totals).forEach(([opt, total]) => {
      if (total > maxVal) {
        maxVal = total;
        maxOption = opt;
      }
    });

    return { totals, maxOption };
  };

  const { totals: matrixTotals, maxOption: matrixWinner } = getMatrixTotals();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header and top commands */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white shadow-sm cursor-pointer"
            title="Back to Decisions"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {decision.status === 'decided' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Resolved
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                  Unresolved Dilemma
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono">
                Created: {new Date(decision.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-950">
              {decision.title}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          {decision.status === 'decided' ? (
            <button
              onClick={handleMarkUndecided}
              className="px-4 py-2.5 border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-amber-800 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Reopen Dilemma
            </button>
          ) : (
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-5 py-2.5 bg-slate-950 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-emerald-500/10 cursor-pointer"
            >
              Make Final Choice
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this decision matrix? This cannot be undone.")) {
                onDeleteDecision(decision.id);
              }
            }}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200 bg-white cursor-pointer"
            title="Delete Matrix"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Analysis Frameworks left, Consulting chatbot right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Multi-tab Framework Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Option Decision Resolution Banner */}
          {decision.status === 'decided' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-0.5">Dilemma Resolved</p>
                <p className="text-sm text-slate-700">
                  You resolved this decision in favor of: <strong className="text-slate-950 text-base">{decision.chosenOption}</strong>. 
                </p>
                <button 
                  onClick={handleMarkUndecided}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 mt-2 underline cursor-pointer block"
                >
                  Change your mind? Reopen dilemma
                </button>
              </div>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'verdict', label: 'AI Verdict', icon: Sparkles },
              { id: 'proscons', label: 'Pros & Cons', icon: Scale },
              { id: 'matrix', label: 'Comparison Matrix', icon: FileSpreadsheet },
              { id: 'swot', label: 'SWOT Grid', icon: LayoutGrid }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-2 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-950 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]"
            >
              {/* 1. AI VERDICT TAB */}
              {activeTab === 'verdict' && decision.aiVerdict && (
                <div className="p-6 md:p-8 space-y-6">
                  {/* Recommendation block */}
                  <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                      <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-800 font-bold tracking-wider text-[10px] uppercase rounded-full">
                        Primary Recommendation
                      </span>
                      <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-950">
                        {decision.aiVerdict.recommendation}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {decision.aiVerdict.summary}
                      </p>
                    </div>

                    {/* Circular dial for Confidence */}
                    <div className="shrink-0 flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-100 w-full md:w-auto">
                      <div className="relative flex items-center justify-center w-20 h-20 mb-2">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="32" stroke="#10b981" strokeWidth="6" fill="transparent"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 * (1 - decision.aiVerdict.confidence / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute font-display font-bold text-lg text-slate-900">
                          {decision.aiVerdict.confidence}%
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Confidence Score
                      </span>
                    </div>
                  </div>

                  {/* Blunt Tough Love reality check */}
                  <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
                    <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-amber-900 text-sm uppercase tracking-wide">
                        Tough Love Critique (Biases & Fears Check)
                      </h3>
                      <p className="text-sm text-amber-950 leading-relaxed font-sans italic">
                        "{decision.aiVerdict.toughLove}"
                      </p>
                    </div>
                  </div>

                  {/* Key Factors */}
                  <div>
                    <h3 className="font-display font-bold text-slate-950 text-base mb-4 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Grounding Factors For Recommendation
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {decision.aiVerdict.keyFactors.map((factor, idx) => (
                        <li 
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-sm text-slate-700"
                        >
                          <span className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 2. PROS & CONS TAB */}
              {activeTab === 'proscons' && decision.prosCons && (
                <div className="p-6 md:p-8 space-y-8">
                  {/* Summary Metric Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
                    <div className="text-sm text-slate-700">
                      Weigh the options by scaling impact scores:
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-800">
                          Total Pros Impact: {decision.prosCons.pros.reduce((acc, p) => acc + p.score, 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold text-slate-800">
                          Total Cons Impact: {decision.prosCons.cons.reduce((acc, c) => acc + c.score, 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pro and Con Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pros Column */}
                    <div>
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h3 className="font-display font-bold text-emerald-800 text-lg flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pros
                        </h3>
                        <button
                          onClick={() => setShowAddForm('pro')}
                          className="p-1 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Pro
                        </button>
                      </div>

                      <div className="space-y-3">
                        {decision.prosCons.pros.map(pro => (
                          <div key={pro.id} className="p-3.5 bg-white border border-slate-100 hover:border-emerald-200 rounded-xl shadow-xs transition-all relative group">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                                {pro.category || 'General'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {renderDots(pro.score, 5, 'bg-emerald-500')}
                                <button
                                  onClick={() => handleDeleteProCon('pro', pro.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mb-1">{pro.text}</p>
                            {pro.description && (
                              <p className="text-xs text-slate-500">{pro.description}</p>
                            )}
                          </div>
                        ))}
                        {decision.prosCons.pros.length === 0 && (
                          <p className="text-center py-8 text-slate-400 text-sm">No pros listed yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Cons Column */}
                    <div>
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h3 className="font-display font-bold text-rose-800 text-lg flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cons
                        </h3>
                        <button
                          onClick={() => setShowAddForm('con')}
                          className="p-1 hover:bg-rose-50 rounded-lg text-rose-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Con
                        </button>
                      </div>

                      <div className="space-y-3">
                        {decision.prosCons.cons.map(con => (
                          <div key={con.id} className="p-3.5 bg-white border border-slate-100 hover:border-rose-200 rounded-xl shadow-xs transition-all relative group">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md">
                                {con.category || 'General'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {renderDots(con.score, 5, 'bg-rose-500')}
                                <button
                                  onClick={() => handleDeleteProCon('con', con.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mb-1">{con.text}</p>
                            {con.description && (
                              <p className="text-xs text-slate-500">{con.description}</p>
                            )}
                          </div>
                        ))}
                        {decision.prosCons.cons.length === 0 && (
                          <p className="text-center py-8 text-slate-400 text-sm">No cons listed yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. COMPARISON MATRIX TAB */}
              {activeTab === 'matrix' && decision.comparison && (
                <div className="p-6 md:p-8 space-y-6 overflow-x-auto">
                  {/* Top explanation */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 leading-relaxed">
                      This side-by-side criteria analysis calculates the **weighted total** by multiplying Importance Weight (1-5) by Option Ratings (1-5).
                      The option with the highest total is highlighted in emerald.
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-4 px-3 font-display font-bold text-slate-900 text-sm">Comparison Criterion</th>
                        <th className="py-4 px-3 font-display font-bold text-slate-900 text-sm text-center">Importance</th>
                        {decision.comparison.options.map(option => (
                          <th key={option} className={`py-4 px-3 font-display font-bold text-slate-900 text-sm text-center ${option === matrixWinner ? 'bg-emerald-50/50' : ''}`}>
                            {option}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {decision.comparison.criteria.map((crit, idx) => (
                        <tr key={crit.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-3">
                            <span className="font-semibold text-slate-900 text-sm block">{crit.name}</span>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex justify-center">
                              {renderDots(crit.importance, 5, 'bg-slate-700')}
                            </div>
                          </td>
                          {decision.comparison.options.map(option => {
                            const scoreObj = crit.scores[option] || { value: 3, reason: '' };
                            return (
                              <td key={option} className={`py-4 px-3 text-center ${option === matrixWinner ? 'bg-emerald-50/30' : ''}`}>
                                <div className="inline-flex flex-col items-center">
                                  {renderDots(scoreObj.value, 5, 'bg-amber-500')}
                                  {scoreObj.reason && (
                                    <span className="text-[10px] text-slate-500 mt-1 block max-w-[150px] leading-tight">
                                      {scoreObj.reason}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Weighted Totals row */}
                      <tr className="bg-slate-50 font-display font-bold border-t-2 border-slate-200">
                        <td className="py-5 px-3 text-slate-900 text-sm">Weighted Total Score</td>
                        <td className="py-5 px-3"></td>
                        {decision.comparison.options.map(option => {
                          const total = matrixTotals[option] || 0;
                          const isWinner = option === matrixWinner;
                          return (
                            <td key={option} className={`py-5 px-3 text-center ${isWinner ? 'bg-emerald-50 border-x border-emerald-200' : ''}`}>
                              <span className={`text-lg ${isWinner ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}`}>
                                {total}
                              </span>
                              {isWinner && (
                                <span className="block text-[9px] uppercase tracking-wider text-emerald-600 font-extrabold mt-0.5">
                                  Top Option ★
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. SWOT GRID TAB */}
              {activeTab === 'swot' && decision.swot && (
                <div className="p-6 md:p-8 space-y-6">
                  {/* Grid of SWOT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 relative">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-display font-bold text-emerald-800 text-sm uppercase tracking-wider">
                          S - Strengths <span className="text-[10px] lowercase font-normal text-emerald-600">(Internal advantages)</span>
                        </h4>
                        <button
                          onClick={() => setShowAddForm('strength')}
                          className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {decision.swot.strengths.map(item => (
                          <div key={item.id} className="p-3 bg-white border border-emerald-100/60 rounded-xl relative group">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                Impact: {item.impact}
                              </span>
                              <button
                                onClick={() => handleDeleteSwot('strengths', item.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{item.text}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 relative">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-display font-bold text-rose-800 text-sm uppercase tracking-wider">
                          W - Weaknesses <span className="text-[10px] lowercase font-normal text-rose-600">(Internal risks/costs)</span>
                        </h4>
                        <button
                          onClick={() => setShowAddForm('weakness')}
                          className="text-rose-700 hover:text-rose-950 p-1 rounded-md cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {decision.swot.weaknesses.map(item => (
                          <div key={item.id} className="p-3 bg-white border border-rose-100/60 rounded-xl relative group">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                Impact: {item.impact}
                              </span>
                              <button
                                onClick={() => handleDeleteSwot('weaknesses', item.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{item.text}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 relative">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-display font-bold text-blue-800 text-sm uppercase tracking-wider">
                          O - Opportunities <span className="text-[10px] lowercase font-normal text-blue-600">(External upsides)</span>
                        </h4>
                        <button
                          onClick={() => setShowAddForm('opportunity')}
                          className="text-blue-700 hover:text-blue-950 p-1 rounded-md cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {decision.swot.opportunities.map(item => (
                          <div key={item.id} className="p-3 bg-white border border-blue-100/60 rounded-xl relative group">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                Impact: {item.impact}
                              </span>
                              <button
                                onClick={() => handleDeleteSwot('opportunities', item.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{item.text}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Threats */}
                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 relative">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-display font-bold text-amber-800 text-sm uppercase tracking-wider">
                          T - Threats <span className="text-[10px] lowercase font-normal text-amber-600">(External dangers)</span>
                        </h4>
                        <button
                          onClick={() => setShowAddForm('threat')}
                          className="text-amber-700 hover:text-amber-950 p-1 rounded-md cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {decision.swot.threats.map(item => (
                          <div key={item.id} className="p-3 bg-white border border-amber-100/60 rounded-xl relative group">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                Impact: {item.impact}
                              </span>
                              <button
                                onClick={() => handleDeleteSwot('threats', item.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{item.text}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: AI Consultant Panel (Chat interface) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md h-[550px] flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-500 animate-bounce" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Consult The Tiebreaker
                </h3>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Active Consultation Mode
                </p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs text-emerald-850 leading-relaxed">
                🤖 <strong>Hey!</strong> Ask me anything about this analysis. You can also command me like:
                <div className="mt-1.5 space-y-1 font-semibold text-slate-800">
                  <p>• "Add a con about child insurance cost"</p>
                  <p>• "Critique my risk tolerances here"</p>
                </div>
              </div>

              {(decision.chatHistory || []).map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-slate-950 text-white rounded-tr-none shadow-sm' 
                      : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}

              {isConsulting && (
                <div className="flex justify-start">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                    Analyzing your inputs...
                  </div>
                </div>
              )}
            </div>

            {/* Footer Form */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask advice, pressure-test, or request additions..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-900 shadow-inner"
              />
              <button
                type="submit"
                className="p-2.5 bg-slate-950 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODALS / OVERLAYS */}

      {/* 1. Inline item addition form overlay / dialog */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl"
            >
              <h3 className="font-display font-bold text-lg text-slate-950 mb-4 capitalize">
                Add New {showAddForm} item
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="item-text" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Label/Summary
                  </label>
                  <input
                    id="item-text"
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={`e.g., Higher charging network availability`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm text-slate-900"
                  />
                </div>

                {['pro', 'con'].includes(showAddForm) && (
                  <>
                    <div>
                      <label htmlFor="item-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <input
                        id="item-category"
                        type="text"
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        placeholder="e.g. Financial, Emotional, Effort"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="item-impact-rating" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between">
                        <span>Impact Score</span>
                        <span>{newItemScore} Stars</span>
                      </label>
                      <input
                        id="item-impact-rating"
                        type="range"
                        min="1"
                        max="5"
                        value={newItemScore}
                        onChange={(e) => setNewItemScore(parseInt(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase mt-1">
                        <span>Negligible</span>
                        <span>Dealbreaker</span>
                      </div>
                    </div>
                  </>
                )}

                {['strength', 'weakness', 'opportunity', 'threat'].includes(showAddForm) && (
                  <div>
                    <label htmlFor="item-impact-dropdown" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      SWOT Quadrant Impact
                    </label>
                    <select
                      id="item-impact-dropdown"
                      value={newItemScore}
                      onChange={(e) => setNewItemScore(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm text-slate-900 bg-white"
                    >
                      <option value={5}>High Impact</option>
                      <option value={3}>Medium Impact</option>
                      <option value={1}>Low Impact</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (['pro', 'con'].includes(showAddForm)) {
                      handleAddProCon(showAddForm as 'pro' | 'con');
                    } else {
                      handleAddSwot(
                        showAddForm === 'strength' ? 'strengths' :
                        showAddForm === 'weakness' ? 'weaknesses' :
                        showAddForm === 'opportunity' ? 'opportunities' : 'threats'
                      );
                    }
                  }}
                  className="flex-1 py-3 bg-slate-950 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Confirm Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Resolve / Choose Option Modal */}
      <AnimatePresence>
        {showResolveModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100 text-emerald-600">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-slate-950">
                  Make Your Final Decision
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Choose the option that you have settled on to resolve this dilemma.
                </p>
              </div>

              <div className="space-y-3">
                {/* Options available */}
                {(decision.comparison?.options || ["Yes / Pursue it", "No / Decline it"]).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleMarkResolved(option)}
                    className="w-full p-4 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/10 rounded-2xl text-left font-semibold text-slate-900 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{option}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowResolveModal(false)}
                className="w-full py-3 mt-6 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Close / Keep Weighing
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
