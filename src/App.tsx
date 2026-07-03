import React, { useState, useEffect } from 'react';
import { Decision } from './types';
import Dashboard from './components/Dashboard';
import DecisionCreator from './components/DecisionCreator';
import DecisionViewer from './components/DecisionViewer';
import { Scale, HelpCircle, AlertCircle, RefreshCw, BarChart4 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'the_tiebreaker_decisions';

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'create' | 'view'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize/Load decisions
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDecisions(JSON.parse(stored));
      } else {
        // Initial welcome data seed
        const seed: Decision[] = [
          {
            id: 'demo-1',
            title: "Accepting a new tech lead role in San Francisco vs staying in Austin",
            context: "I have a new job offer in SF with a 25% salary bump, but rent is significantly higher. I love Austin's warm weather and my friends are here, but SF has much better long-term career growth in tech.",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'undecided',
            prosCons: {
              pros: [
                { id: 'p1', text: "25% higher base compensation", score: 4, category: "Financial", description: "Provides more investing capital." },
                { id: 'p2', text: "Elite career compounding", score: 5, category: "Career", description: "Proximity to founders, VCs, and top-tier engineers." }
              ],
              cons: [
                { id: 'c1', text: "Exorbitant SF rents & state taxes", score: 5, category: "Financial", description: "Could wipe out the entire salary increase." },
                { id: 'c2', text: "Leaving close friendship circle", score: 4, category: "Emotional", description: "Takes time to rebuild support networks." }
              ]
            },
            swot: {
              strengths: [
                { id: 's1', text: "Highly adaptable skillset", impact: 'high', description: "Can thrive in fast-paced SF startup culture." }
              ],
              weaknesses: [
                { id: 'w1', text: "High personal dependence on quiet weather", impact: 'medium', description: "SF fog can trigger seasonal blues." },
              ],
              opportunities: [
                { id: 'o1', text: "Networking at local hackathons", impact: 'high', description: "SF is the epicenter of the AI boom." }
              ],
              threats: [
                { id: 't1', text: "Burnout from intense tech hustle", impact: 'medium', description: "СФ culture can be highly competitive." }
              ]
            },
            comparison: {
              options: ["San Francisco Tech Lead", "Stay in Austin"],
              criteria: [
                {
                  id: 'crit-1',
                  name: "Wealth Accumulation Potential",
                  importance: 5,
                  scores: {
                    "San Francisco Tech Lead": { value: 3, reason: "Higher income but significantly higher costs offset it." },
                    "Stay in Austin": { value: 4, reason: "Low cost of living, no state tax, high compound savings rate." }
                  }
                },
                {
                  id: 'crit-2',
                  name: "Long Term Career Upside",
                  importance: 5,
                  scores: {
                    "San Francisco Tech Lead": { value: 5, reason: "SF is unparalleled for technology growth." },
                    "Stay in Austin": { value: 3, reason: "Good, but slower startup pace." }
                  }
                }
              ]
            },
            aiVerdict: {
              recommendation: "Accept the San Francisco Role",
              confidence: 85,
              summary: "While Austin offers superior short-term savings, the compounding career capital and tech network in SF will dramatically outpace it over a 5-year window.",
              toughLove: "Stop using the cost-of-living excuse to disguise your fear of leaving your comfort zone and starting over in a new city.",
              keyFactors: [
                "Long-term tech networking in the SF AI wave.",
                "High compensation acceleration path.",
                "Comfort zones rarely foster rapid career growth."
              ]
            }
          }
        ];
        setDecisions(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (err) {
      console.error("Failed to parse stored decisions:", err);
    }
  }, []);

  // Sync state changes to localstorage
  const saveDecisions = (updated: Decision[]) => {
    setDecisions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCreateDecision = async (title: string, context: string) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch('/api/decisions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, context })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const analysis = await response.json();
      
      const newDecision: Decision = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        context,
        createdAt: new Date().toISOString(),
        status: 'undecided',
        prosCons: analysis.prosCons,
        swot: analysis.swot,
        comparison: analysis.comparison,
        aiVerdict: analysis.aiVerdict,
        chatHistory: []
      };

      const nextDecisions = [newDecision, ...decisions];
      saveDecisions(nextDecisions);
      setCurrentId(newDecision.id);
      setView('view');
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDecision = (updated: Decision) => {
    const nextDecisions = decisions.map(d => d.id === updated.id ? updated : d);
    saveDecisions(nextDecisions);
  };

  const handleDeleteDecision = (id: string) => {
    const nextDecisions = decisions.filter(d => d.id !== id);
    saveDecisions(nextDecisions);
    if (currentId === id) {
      setCurrentId(null);
      setView('dashboard');
    }
  };

  const handleConsultChat = async (message: string) => {
    if (!currentId) throw new Error("No active decision context");
    const currentDecision = decisions.find(d => d.id === currentId);
    if (!currentDecision) throw new Error("Decision not found");

    setIsConsulting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/decisions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: currentDecision,
          message,
          history: currentDecision.chatHistory || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Consultation server returned status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Consultation request failed.");
      throw err;
    } finally {
      setIsConsulting(false);
    }
  };

  const activeDecision = decisions.find(d => d.id === currentId) || null;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Top Brand Navbar */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/80 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => { setView('dashboard'); setCurrentId(null); }}
            className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity cursor-pointer bg-transparent border-none text-left p-0"
          >
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-slate-950/15 group-hover:bg-emerald-600 transition-colors">
              <Scale className="w-5.5 h-5.5 text-emerald-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-slate-950">
                The Tiebreaker
              </span>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
                Logical Decision Engine
              </p>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setView('dashboard'); setCurrentId(null); }}
              className={`text-sm font-semibold transition-colors cursor-pointer ${
                view === 'dashboard' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 transition-all cursor-pointer ${
                view === 'create' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : ''
              }`}
            >
              + New Dilemma
            </button>
          </div>
        </div>
      </header>

      {/* Global API Error Alert banner */}
      {apiError && (
        <div className="max-w-4xl mx-auto w-full px-4 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-sm">Action failed</h4>
              <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
            </div>
            <button 
              onClick={() => setApiError(null)}
              className="text-xs font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Loading Overlay for Decision Creator */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-200 shadow-2xl space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <Scale className="absolute inset-0 m-auto w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg text-slate-950">The Tiebreaker is Weighing Options</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We are mapping your pros & cons, drafting SWOT coordinates, weighting side-by-side matrices, and forging a tough-love critique...
              </p>
            </div>
            <div className="flex justify-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 font-mono uppercase">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary content router */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard 
                decisions={decisions}
                onSelect={(id) => {
                  setCurrentId(id);
                  setView('view');
                }}
                onDelete={(id, e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this decision matrix?")) {
                    handleDeleteDecision(id);
                  }
                }}
                onStartNew={() => setView('create')}
              />
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DecisionCreator 
                onAnalyze={handleCreateDecision}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {view === 'view' && activeDecision && (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DecisionViewer 
                decision={activeDecision}
                onBack={() => {
                  setView('dashboard');
                  setCurrentId(null);
                }}
                onUpdateDecision={handleUpdateDecision}
                onDeleteDecision={handleDeleteDecision}
                onConsult={handleConsultChat}
                isConsulting={isConsulting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Humble outer margin footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">
          <div>
            The Tiebreaker © 2026 • AI Decision Partner
          </div>
          <div className="flex gap-4">
            <span>Pros & Cons</span>
            <span>SWOT</span>
            <span>Decision Matrices</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
