import React, { useState } from 'react';
import { Sparkles, ArrowRight, HelpCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface DecisionCreatorProps {
  onAnalyze: (title: string, context: string) => Promise<void>;
  isLoading: boolean;
}

const PRESETS = [
  {
    title: "Relocating to San Francisco or staying in Austin",
    context: "I have a new job offer in SF with a 25% salary bump, but rent is significantly higher. I love Austin's warm weather and my friends are here, but SF has much better long-term career growth in tech."
  },
  {
    title: "Buy a new Tesla Model Y or repair my old gas car",
    context: "My 2014 Honda Civic needs a $2,200 transmission repair. A new Tesla Model Y would cost $43,000 but qualifies for a $7,500 tax credit. I would save on gas, but insurance rates will double."
  },
  {
    title: "Bootstrapping a SaaS startup vs accepting a Senior Dev job",
    context: "I have saved enough to live for 10 months to build my micro-SaaS. Alternatively, I have a solid job offer at a stable company for $140k/yr. I'm afraid of failure but crave independence."
  }
];

export default function DecisionCreator({ onAnalyze, isLoading }: DecisionCreatorProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('A title is required to analyze your decision.');
      return;
    }
    setError('');
    onAnalyze(title, context);
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setContext(preset.context);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <span className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-widest inline-flex items-center gap-1 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> AI Decision engine
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-950 mb-4">
          Resolve Your Dilemmas with <span className="text-emerald-600">The Tiebreaker</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Cut through analysis paralysis. Provide your dilemma, and let AI dissect it with Pros & Cons, SWOT quadrants, side-by-side matrices, and custom recommendations.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Presets Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1 flex flex-col gap-4"
        >
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex-1">
            <h3 className="font-display font-semibold text-slate-900 mb-3 flex items-center gap-1.5 text-sm uppercase tracking-wider text-slate-400">
              <Lightbulb className="w-4 h-4 text-emerald-600" /> Presets
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Need inspiration? Try one of these classic structured dilemmas to see how The Tiebreaker operates:
            </p>
            <div className="space-y-3">
              {PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 transition-all group"
                >
                  <p className="font-medium text-slate-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {preset.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {preset.context}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Input Form Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  What decision are you trying to make?
                </label>
                <input
                  id="title-input"
                  type="text"
                  placeholder="e.g., Should I buy a house or keep renting?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900 transition-all text-base placeholder:text-slate-400"
                />
                {error && (
                  <p id="title-error" className="text-sm text-red-600 mt-1.5 font-medium flex items-center gap-1">
                    ⚠️ {error}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="context-input" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  Provide background context <span className="text-xs font-normal text-slate-400">(Optional but highly recommended)</span>
                </label>
                <textarea
                  id="context-input"
                  rows={4}
                  placeholder="Include any constraints like budget, time, location, personal feelings, or specific goals. More details yield a sharper critique."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900 transition-all text-sm placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">What happens next?</p>
                  <p>Our AI will ingest your inputs and formulate a customized multi-framework analysis: a detailed Pros/Cons balance, a SWOT quadrant breakdown, and a side-by-side criteria evaluation matrix.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-950 hover:bg-emerald-600 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Assembling Decision Matrix...
                  </>
                ) : (
                  <>
                    Analyze Decision
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
