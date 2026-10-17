import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Droplets, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Zap, 
  Clock, 
  Dumbbell,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  LogOut,
  RefreshCw,
  Shield,
  Terminal,
  Activity,
  Book,
  Target,
  Brain,
  LayoutDashboard,
  Calendar,
  Utensils,
  GraduationCap,
  TrendingUp,
  Bot
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { 
  INITIAL_TIMETABLE, 
  WORKOUT_PLAN, 
  NUTRITION_GUIDE, 
  SKILL_PATH, 
  WEEKLY_GOALS, 
  QUOTES 
} from '../constants/protocol';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../lib/firestore';
import ShadowAI from './ShadowAI';
import SmartWatch from './SmartWatch';
import Onboarding from './Onboarding';
import { soundManager } from '../lib/sounds';

type TabType = 'today' | 'timetable' | 'workout' | 'nutrition' | 'skills' | 'goals' | 'tracker' | 'profile' | 'ai' | 'watch';

export default function ProtocolDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [currentDay, setCurrentDay] = useState(1);
  const [workoutDay, setWorkoutDay] = useState(1);
  const [completedTasks, setCompletedTasks] = useState<Record<string, Record<string, boolean>>>({});
  const [dayCompleted, setDayCompleted] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    age: '',
    weight: '',
    height: ''
  });

  const totalDays = activeProtocol?.total_days || 20;

  // Fetch progress from Firebase
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    
    // Listen for tasks
    const tasksPath = `users/${userId}/tasks`;
    const tasksQuery = query(collection(db, tasksPath));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasks: Record<string, Record<string, boolean>> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const day = data.day;
        const taskId = data.taskId;
        if (!tasks[day]) tasks[day] = {};
        tasks[day][taskId] = data.completed;
      });
      setCompletedTasks(tasks);
    }, (error) => handleFirestoreError(error, OperationType.GET, tasksPath));

    // Listen for day completions
    const profilePath = `users/${userId}`;
    const unsubscribeProfile = onSnapshot(doc(db, profilePath), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setDayCompleted(data.dayCompleted || {});
        setCurrentDay(data.currentDay || 1);
        setWorkoutDay(data.currentDay || 1);
        setProfileForm({
          age: data.age || '',
          weight: data.weight || '',
          height: data.height || ''
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, profilePath));

    // Listen for active protocol
    const protocolPath = `users/${userId}/protocol/active`;
    const unsubscribeProtocol = onSnapshot(doc(db, protocolPath), (docSnap) => {
      if (docSnap.exists()) {
        setActiveProtocol(docSnap.data());
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, protocolPath));

    return () => {
      unsubscribeTasks();
      unsubscribeProfile();
      unsubscribeProtocol();
    };
  }, []);

  const resetProtocol = async () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    soundManager.play('click');
    
    if (!window.confirm("Are you sure you want to reset your protocol? This will clear your current plan and progress.")) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        hasProtocol: false,
        currentDay: 1,
        dayCompleted: {}
      });
      // Optionally clear tasks collection too, but setting hasProtocol: false triggers onboarding
      setActiveTab('today');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const key = `day-${currentDay}-${taskId}`;
    const path = `users/${userId}/tasks/${key}`;
    
    const isCurrentlyDone = completedTasks[currentDay]?.[taskId] || false;
    
    try {
      await setDoc(doc(db, `users/${userId}/tasks`, key), {
        completed: !isCurrentlyDone,
        day: currentDay,
        taskId: taskId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const nextDay = async () => {
    if (currentDay < totalDays && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const newDayCompleted = { ...dayCompleted, [currentDay]: true };
      const newCurrentDay = currentDay + 1;
      
      try {
        await setDoc(doc(db, 'users', userId), {
          dayCompleted: newDayCompleted,
          currentDay: newCurrentDay
        }, { merge: true });
        
        setCurrentDay(newCurrentDay);
        setWorkoutDay(newCurrentDay);
        setActiveTab('today');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      }
    }
  };

  const getWorkoutForDay = (day: number) => {
    const workoutData = activeProtocol?.workout_data || WORKOUT_PLAN;
    const workoutKeys = Object.keys(workoutData);
    if (workoutKeys.length === 0) return { focus: 'No Protocol', plans: [] };
    const key = workoutKeys[(day - 1) % workoutKeys.length];
    return { focus: key, plans: workoutData[key] || [] };
  };

  const dailyWorkout = getWorkoutForDay(workoutDay);

  const calculateStats = () => {
    const timetable = activeProtocol?.timetable_data || INITIAL_TIMETABLE;
    const dayTasks = completedTasks[currentDay] || {};
    const doneCount = Object.values(dayTasks).filter(Boolean).length;
    const totalCount = timetable.length;
    const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    
    let streak = 0;
    for (let d = currentDay; d >= 1; d--) {
      if (dayCompleted[d]) streak++;
      else if (d < currentDay) break;
    }
    
    return { doneCount, progressPct, streak };
  };

  const stats = calculateStats();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const path = `users/${userId}`;

    try {
      await updateDoc(doc(db, 'users', userId), {
        age: Number(profileForm.age),
        weight: Number(profileForm.weight),
        height: profileForm.height,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleTabChange = (tab: TabType) => {
    soundManager.play('click');
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!userProfile?.hasProtocol) {
    return <Onboarding onComplete={() => setActiveTab('today')} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-yellow-500/30 pb-20">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-yellow-500" />
              <h1 className="text-lg font-black tracking-tighter uppercase italic text-yellow-500">Project Shadow</h1>
            </div>
          </div>
          
          <button 
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 no-scrollbar border-b border-neutral-800 pb-2 sticky top-16 bg-neutral-950/80 backdrop-blur-sm z-40">
          <TabButton active={activeTab === 'today'} onClick={() => handleTabChange('today')} icon={<LayoutDashboard />} label="Today" />
          <TabButton active={activeTab === 'timetable'} onClick={() => handleTabChange('timetable')} icon={<Calendar />} label="Timetable" />
          <TabButton active={activeTab === 'workout'} onClick={() => handleTabChange('workout')} icon={<Activity />} label="Workouts" />
          <TabButton active={activeTab === 'nutrition'} onClick={() => handleTabChange('nutrition')} icon={<Utensils />} label="Nutrition" />
          <TabButton active={activeTab === 'skills'} onClick={() => handleTabChange('skills')} icon={<GraduationCap />} label="Skills" />
          <TabButton active={activeTab === 'goals'} onClick={() => handleTabChange('goals')} icon={<Target />} label="Goals" />
          <TabButton active={activeTab === 'tracker'} onClick={() => handleTabChange('tracker')} icon={<TrendingUp />} label="Tracker" />
          <TabButton active={activeTab === 'ai'} onClick={() => handleTabChange('ai')} icon={<Bot />} label="Shadow AI" />
          <TabButton active={activeTab === 'watch'} onClick={() => handleTabChange('watch')} icon={<Clock />} label="Watch" />
          <TabButton active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} icon={<Shield />} label="Profile" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'today' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard value={stats.doneCount} label="Done Today" />
                  <StatCard value={`${stats.progressPct}%`} label="Progress" />
                  <StatCard value={stats.streak} label="Day Streak" />
                </div>

                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-yellow-500" /> Daily Checklist — Day {currentDay}
                  </h2>
                    <div className="space-y-3 mb-6">
                      {(activeProtocol?.timetable_data || INITIAL_TIMETABLE).length > 0 ? (
                        (activeProtocol?.timetable_data || INITIAL_TIMETABLE).map((task: any) => {
                          const isDone = completedTasks[currentDay]?.[task.id] || false;
                          return (
                            <div 
                              key={task.id}
                              onClick={() => toggleTask(task.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                isDone ? "bg-yellow-500/10 border-yellow-500/20 opacity-60" : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                              )}
                            >
                              {isDone ? <CheckCircle2 className="w-5 h-5 text-yellow-500" /> : <Circle className="w-5 h-5 text-neutral-700" />}
                              <div className="flex-1">
                                <p className={cn("text-sm font-bold", isDone && "line-through")}>{task.title}</p>
                                <p className="text-[10px] text-neutral-500 uppercase font-mono">{task.time}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 border border-dashed border-neutral-800 rounded-xl">
                          <Bot className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                          <p className="text-sm text-neutral-500">No tactical tasks active.</p>
                          <button 
                            onClick={() => setActiveTab('ai')}
                            className="mt-4 text-xs text-yellow-500 font-bold uppercase tracking-widest hover:underline"
                          >
                            Consult Shadow AI
                          </button>
                        </div>
                      )}
                    </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${stats.progressPct}%` }} />
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest text-right">
                    {stats.doneCount} / {(activeProtocol?.timetable_data || INITIAL_TIMETABLE).length} Tasks Complete
                  </p>
                </section>

                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center italic relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                  <p className="text-lg text-neutral-300 font-medium mb-6">
                    {QUOTES[(currentDay - 1) % QUOTES.length]}
                  </p>
                  <button 
                    onClick={nextDay}
                    disabled={currentDay >= totalDays}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-black py-4 rounded-2xl transition-all active:scale-95 uppercase italic tracking-tighter"
                  >
                    Mark Day Complete & Go to Day {Math.min(currentDay + 1, totalDays)} →
                  </button>
                </section>
              </div>
            )}

            {activeTab === 'timetable' && (
              <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Active Protocol Schedule</h2>
                <p className="text-xs text-neutral-500 mb-6 uppercase tracking-widest font-mono">Tactical deployment plan.</p>
                {activeProtocol?.timetable ? (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 prose prose-invert max-w-none prose-sm">
                    <ReactMarkdown>{activeProtocol.timetable}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {INITIAL_TIMETABLE.map((t, i) => (
                      <div key={i} className="grid grid-cols-[100px_1fr] border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="bg-neutral-800 p-3 text-xs font-bold text-neutral-400 flex items-center justify-center border-r border-neutral-800">
                          {t.time}
                        </div>
                        <div className="p-3 bg-neutral-950 text-sm flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase rounded border border-yellow-500/20">Protocol</span>
                          {t.title}: {t.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'workout' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                  <button 
                    onClick={() => setWorkoutDay(Math.max(1, workoutDay - 1))}
                    className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-400"
                  >
                    <ChevronLeft />
                  </button>
                  <div className="text-center">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Day {workoutDay}</h2>
                    <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">{dailyWorkout.focus}</p>
                  </div>
                  <button 
                    onClick={() => setWorkoutDay(Math.min(totalDays, workoutDay + 1))}
                    className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-400"
                  >
                    <ChevronRight />
                  </button>
                </div>

                {dailyWorkout.plans.length > 0 ? (
                  dailyWorkout.plans.map((w, idx) => (
                    <section key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Dumbbell size={80} />
                      </div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
                        <Flame className="w-5 h-5 text-orange-500" /> {w.part}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-neutral-500 text-[10px] uppercase tracking-widest border-b border-neutral-800">
                              <th className="text-left py-2 font-bold">Exercise</th>
                              <th className="text-left py-2 font-bold">Sets×Reps</th>
                              <th className="text-left py-2 font-bold">Target</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800">
                            {w.exercises.map((ex, eIdx) => (
                              <tr key={eIdx}>
                                <td className="py-3 font-semibold">{ex.name}</td>
                                <td className="py-3 font-mono text-yellow-500">{ex.sets}×{ex.reps}</td>
                                <td className="py-3 text-neutral-500 text-xs italic">{ex.target}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="text-center py-20 bg-neutral-900 border border-neutral-800 rounded-2xl">
                    <Dumbbell className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                    <p className="text-neutral-500">No workout protocol generated for this day.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="space-y-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Tactical Nutrition</h2>
                  <p className="text-xs text-neutral-500 mb-6 uppercase tracking-widest font-mono">Fuel for the evolution.</p>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 prose prose-invert max-w-none prose-sm">
                    <ReactMarkdown>{activeProtocol?.nutrition || NUTRITION_GUIDE}</ReactMarkdown>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'skills' && (
              <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Skill Roadmap</h2>
                <p className="text-xs text-neutral-500 mb-6 uppercase tracking-widest font-mono">Tactical skill evolution path.</p>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 prose prose-invert max-w-none prose-sm">
                  <ReactMarkdown>{activeProtocol?.skills || SKILL_PATH}</ReactMarkdown>
                </div>
              </section>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-6">
                {(activeProtocol?.goals_data || WEEKLY_GOALS).length > 0 ? (
                  (activeProtocol?.goals_data || WEEKLY_GOALS).map((week: any, idx: number) => (
                    <section key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                      <h2 className="text-xl font-bold mb-4 uppercase tracking-tight flex items-center gap-2">
                        <Target className="text-yellow-500" /> Week {week.week}: {week.title}
                      </h2>
                      <div className="space-y-2">
                        {week.goals.map((goal: string, gIdx: number) => (
                          <div key={gIdx} className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            {goal}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="text-center py-20 bg-neutral-900 border border-neutral-800 rounded-2xl">
                    <Target className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                    <p className="text-neutral-500">No long-term objectives defined.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tracker' && (
              <div className="space-y-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Protocol Overview</h2>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {[...Array(totalDays)].map((_, i) => {
                      const d = i + 1;
                      const isToday = d === currentDay;
                      const isDone = dayCompleted[d];
                      const dayTasks = completedTasks[d] || {};
                      const doneCount = Object.values(dayTasks).filter(Boolean).length;
                      const totalCount = (activeProtocol?.timetable_data || INITIAL_TIMETABLE).length;
                      const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                      
                      return (
                        <div 
                          key={i}
                          className={cn(
                            "aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all",
                            isToday ? "border-yellow-500 bg-yellow-500/10" : 
                            isDone ? "border-green-500/50 bg-green-500/10" : 
                            doneCount > 0 ? "border-orange-500/50 bg-orange-500/10" :
                            "border-neutral-800 bg-neutral-950"
                          )}
                        >
                          <span className={cn("text-xs font-black", isToday ? "text-yellow-500" : "text-neutral-400")}>{d}</span>
                          <span className="text-[8px] font-mono text-neutral-600">{d <= currentDay ? `${pct}%` : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Habit Streaks</h2>
                  <div className="space-y-4">
                    <HabitStreak label="Morning Workout" taskId="morning_workout" currentDay={currentDay} completedTasks={completedTasks} />
                    <HabitStreak label="Evening Workout" taskId="evening_workout" currentDay={currentDay} completedTasks={completedTasks} />
                    <HabitStreak label="4:45 AM Wake" taskId="wake" currentDay={currentDay} completedTasks={completedTasks} />
                    <HabitStreak label="Clean Eating" taskId="breakfast" currentDay={currentDay} completedTasks={completedTasks} />
                    <HabitStreak label="Study Sessions" taskId="morning_study" currentDay={currentDay} completedTasks={completedTasks} />
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'ai' && (
              <ShadowAI onProtocolGenerated={() => setActiveTab('today')} />
            )}

            {activeTab === 'watch' && (
              <SmartWatch />
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield size={120} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-500">User Profile</h2>
                      <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">Authorized Access Only</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={resetProtocol}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center gap-2"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset Protocol
                      </button>
                      {!isEditingProfile && (
                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold transition-all border border-neutral-700"
                        >
                          Modify Stats
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Age</label>
                          <input 
                            type="number" 
                            value={profileForm.age}
                            onChange={(e) => setProfileForm({...profileForm, age: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-yellow-500 outline-none transition-all"
                            placeholder="Years"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Weight (kg)</label>
                          <input 
                            type="number" 
                            value={profileForm.weight}
                            onChange={(e) => setProfileForm({...profileForm, weight: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-yellow-500 outline-none transition-all"
                            placeholder="kg"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Height</label>
                          <input 
                            type="text" 
                            value={profileForm.height}
                            onChange={(e) => setProfileForm({...profileForm, height: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-yellow-500 outline-none transition-all"
                            placeholder='e.g. 5"10'
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black py-3 rounded-xl transition-all uppercase italic tracking-tighter text-sm"
                        >
                          Save Changes
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-3 rounded-xl transition-all uppercase text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ProfileStat label="Age" value={userProfile?.age ? `${userProfile.age} yrs` : 'Not Set'} />
                      <ProfileStat label="Weight" value={userProfile?.weight ? `${userProfile.weight} kg` : 'Not Set'} />
                      <ProfileStat label="Height" value={userProfile?.height || 'Not Set'} />
                      <div className="md:col-span-3 p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                        <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-2">Identity Data</p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-yellow-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{userProfile?.name}</p>
                            <p className="text-xs text-neutral-500">{userProfile?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-lg font-bold mb-4 uppercase tracking-tight flex items-center gap-2">
                    <Terminal className="text-yellow-500 w-4 h-4" /> System Logs
                  </h2>
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-[10px] space-y-2 text-neutral-500">
                    <p><span className="text-yellow-500/50">[{new Date().toISOString()}]</span> PROTOCOL_INITIALIZED</p>
                    <p><span className="text-yellow-500/50">[{userProfile?.createdAt?.toDate ? userProfile.createdAt.toDate().toISOString() : '...'}]</span> USER_ENROLLED</p>
                    <p><span className="text-yellow-500/50">[{new Date().toISOString()}]</span> ENCRYPTION_ACTIVE</p>
                  </div>
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/80 backdrop-blur-lg border-t border-neutral-800 md:hidden z-50">
        <div className="flex justify-around p-2">
          <NavIcon active={activeTab === 'today'} onClick={() => handleTabChange('today')} icon={<LayoutDashboard />} />
          <NavIcon active={activeTab === 'timetable'} onClick={() => handleTabChange('timetable')} icon={<Calendar />} />
          <NavIcon active={activeTab === 'workout'} onClick={() => handleTabChange('workout')} icon={<Activity />} />
          <NavIcon active={activeTab === 'nutrition'} onClick={() => handleTabChange('nutrition')} icon={<Utensils />} />
          <NavIcon active={activeTab === 'ai'} onClick={() => handleTabChange('ai')} icon={<Bot />} />
          <NavIcon active={activeTab === 'watch'} onClick={() => handleTabChange('watch')} icon={<Clock />} />
          <NavIcon active={activeTab === 'tracker'} onClick={() => handleTabChange('tracker')} icon={<TrendingUp />} />
          <NavIcon active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} icon={<Shield />} />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
        active ? "bg-yellow-500 text-neutral-950 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "text-neutral-400 border-transparent hover:bg-neutral-800"
      )}
    >
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: cn("w-3 h-3", (icon.props as any).className) })}
      {label}
    </button>
  );
}

function NavIcon({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-all",
        active ? "text-yellow-500 bg-yellow-500/10" : "text-neutral-500"
      )}
    >
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: cn("w-6 h-6", (icon.props as any).className) })}
    </button>
  );
}

function StatCard({ value, label }: { value: string | number, label: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center shadow-lg">
      <div className="text-2xl font-black text-yellow-500 italic tracking-tighter">{value}</div>
      <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-1">{label}</div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
      <div className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest mb-1">{label}</div>
      <div className="text-xl font-black text-neutral-100 italic tracking-tighter">{value}</div>
    </div>
  );
}

function HabitStreak({ label, taskId, currentDay, completedTasks }: { label: string, taskId: string, currentDay: number, completedTasks: Record<string, Record<string, boolean>> }) {
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (completedTasks[d]?.[taskId]) streak++;
    else break;
  }
  
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-xl font-black italic", streak > 2 ? "text-green-500" : "text-neutral-500")}>{streak}</span>
        <span className="text-[8px] text-neutral-600 uppercase font-bold tracking-widest">Day Streak</span>
      </div>
    </div>
  );
}
