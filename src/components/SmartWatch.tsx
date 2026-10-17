import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Heart, Zap, Moon, Smartphone, TrendingUp, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const SmartWatch: React.FC = () => {
  const [heartRate, setHeartRate] = useState(72);
  const [steps, setSteps] = useState(4520);
  const [screenTime, setScreenTime] = useState(145); // minutes
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 3000);

    // Try to get battery level for "realism"
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heart Rate Monitor */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Heart size={120} className="text-red-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-neutral-400">Heart Rate</h3>
              <p className="text-[8px] text-neutral-600 font-mono uppercase tracking-widest">Live Biometric Feed</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black italic tracking-tighter text-neutral-100">{heartRate}</span>
            <span className="text-sm font-mono text-neutral-500 uppercase">BPM</span>
          </div>
          <div className="mt-8 h-12 flex items-end gap-1">
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                className="flex-1 bg-red-500/30 rounded-full"
              />
            ))}
          </div>
        </section>

        {/* Screen Time Monitor */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Smartphone size={120} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-neutral-400">Screen Time</h3>
              <p className="text-[8px] text-neutral-600 font-mono uppercase tracking-widest">Digital Discipline</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black italic tracking-tighter text-neutral-100">{Math.floor(screenTime / 60)}h {screenTime % 60}m</span>
          </div>
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-500">
              <span>Daily Limit: 3h</span>
              <span>{batteryLevel !== null ? `Device Battery: ${batteryLevel}%` : 'Syncing...'}</span>
            </div>
            <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[82%]" />
            </div>
          </div>
        </section>
      </div>

      {/* Activity Rings */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
        <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 flex items-center gap-2">
          <TrendingUp className="text-yellow-500" /> Tactical Activity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <ActivityRing label="Steps" value={steps} target={10000} color="text-yellow-500" icon={<Zap />} />
          <ActivityRing label="Exercise" value={45} target={60} color="text-orange-500" icon={<Activity />} />
          <ActivityRing label="Sleep" value={6.5} target={8} color="text-purple-500" icon={<Moon />} />
        </div>
      </section>
    </div>
  );
};

const ActivityRing = ({ label, value, target, color, icon }: { label: string, value: number, target: number, color: string, icon: React.ReactNode }) => {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r="58" className="stroke-neutral-800 fill-none" strokeWidth="12" />
          <circle 
            cx="64" cy="64" r="58" 
            className={cn("fill-none transition-all duration-1000", color.replace('text-', 'stroke-'))}
            strokeWidth="12" 
            strokeDasharray={364}
            strokeDashoffset={364 - (364 * pct) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("w-6 h-6 mb-1", color)}>{icon}</div>
          <span className="text-xl font-black italic tracking-tighter">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold uppercase italic tracking-tighter">{label}</p>
        <p className="text-[10px] text-neutral-500 font-mono uppercase">{value} / {target}</p>
      </div>
    </div>
  );
};

export default SmartWatch;
