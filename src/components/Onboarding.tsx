import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Terminal, Sparkles, MessageSquare, ClipboardPaste, ArrowRight } from 'lucide-react';
import ShadowAI from './ShadowAI';
import { soundManager } from '../lib/sounds';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'intro' | 'setup'>('intro');

  const handleStartSetup = () => {
    soundManager.play('click');
    setStep('setup');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === 'intro' ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-8"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl"
                />
                <div className="relative bg-neutral-900 border border-yellow-500/30 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <Shield className="w-12 h-12 text-yellow-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-yellow-500">Initialize Protocol</h1>
                <p className="text-neutral-400 max-w-lg mx-auto text-lg">
                  Welcome to Project Shadow. Your evolution requires a tactical plan. 
                  You can either talk to Shadow AI to build your protocol or paste your existing timetable.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <OnboardingCard 
                  icon={<MessageSquare className="text-yellow-500" />}
                  title="Interactive Setup"
                  desc="Chat with AI to define your goals and schedule."
                />
                <OnboardingCard 
                  icon={<ClipboardPaste className="text-yellow-500" />}
                  title="Instant Analysis"
                  desc="Paste your diet or timetable for tactical conversion."
                />
                <OnboardingCard 
                  icon={<Sparkles className="text-yellow-500" />}
                  title="AI Optimization"
                  desc="Get a personalized vengeance roadmap."
                />
              </div>

              <button 
                onClick={handleStartSetup}
                className="mt-12 group bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black px-10 py-5 rounded-2xl transition-all flex items-center gap-3 mx-auto uppercase italic tracking-tighter shadow-[0_0_30px_rgba(234,179,8,0.3)]"
              >
                Begin Setup
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-500">Shadow AI Setup</h2>
                  <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">Awaiting tactical data input...</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <Terminal className="w-4 h-4 text-yellow-500" />
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">System: Online</span>
                </div>
              </div>
              
              <ShadowAI onProtocolGenerated={onComplete} />
              
              <p className="text-center text-[10px] text-neutral-600 font-mono uppercase tracking-[0.3em]">
                Paste your timetable or say "Create a plan for me"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const OnboardingCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl text-left hover:border-yellow-500/30 transition-all hover:bg-neutral-900">
    <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center mb-4 border border-neutral-800">
      {icon}
    </div>
    <h3 className="font-bold text-neutral-100 mb-2 uppercase tracking-tight">{title}</h3>
    <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
  </div>
);

export default Onboarding;
