import React from 'react';
import { Shield, LogIn, Terminal, Zap, Activity, Book } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: () => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl text-center relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        
        <div className="mb-8 relative">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-20 bg-neutral-950 border border-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(234,179,8,0.1)]"
          >
            <Shield className="w-10 h-10 text-yellow-500" />
          </motion.div>
          <div className="absolute -top-2 -right-2">
            <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tighter text-yellow-500 uppercase italic mb-2">Project Shadow</h1>
        <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-10">Evolution Protocol</p>
        
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-500/50" />
            <span className="text-[8px] font-mono uppercase text-neutral-500">Fitness</span>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center gap-2">
            <Book className="w-4 h-4 text-yellow-500/50" />
            <span className="text-[8px] font-mono uppercase text-neutral-500">Mindset</span>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center gap-2">
            <Terminal className="w-4 h-4 text-yellow-500/50" />
            <span className="text-[8px] font-mono uppercase text-neutral-500">Skills</span>
          </div>
        </div>

        <div className="space-y-4 mb-10 text-left bg-neutral-950 p-5 rounded-3xl border border-neutral-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-3 h-3 text-yellow-500" />
            <p className="text-[10px] text-yellow-500/70 font-mono uppercase tracking-widest">System Requirements</p>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-xs text-neutral-400 font-medium">
              <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
              Absolute Discipline
            </li>
            <li className="flex items-center gap-3 text-xs text-neutral-400 font-medium">
              <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
              Zero Excuses
            </li>
            <li className="flex items-center gap-3 text-xs text-neutral-400 font-medium">
              <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
              Total Commitment
            </li>
          </ul>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-mono uppercase tracking-wider"
          >
            {error}
          </motion.div>
        )}

        <button 
          onClick={onLogin}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black py-5 rounded-[1.5rem] transition-all active:scale-95 flex items-center justify-center gap-3 uppercase italic tracking-tighter shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
        >
          <LogIn className="w-5 h-5" />
          Initiate Protocol
        </button>
        
        <div className="mt-10 pt-8 border-t border-neutral-800/50">
          <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-[0.4em]">Authorized Access Only</p>
          <p className="text-[8px] text-neutral-700 font-mono mt-2">© 2026 Wayne Enterprises Security</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
