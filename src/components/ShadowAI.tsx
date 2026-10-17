import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Send, Terminal, Shield, User, Bot, RefreshCw, Zap, Mic, MicOff, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { soundManager } from '../lib/sounds';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
  isProtocol?: boolean;
}

const SYSTEM_INSTRUCTION = `
You are "Shadow AI", the tactical assistant for "Project Shadow". 
Project Shadow is an intense discipline, fitness, and skill-building protocol inspired by the Batman/Dark Knight aesthetic.

Your persona:
- Tactical, direct, and slightly mysterious.
- Encouraging but firm. No excuses.
- You speak in terms of "protocols", "objectives", "tactical data", and "evolution".

CORE CAPABILITY: PROTOCOL GENERATION
If the user provides their profession, time availability, goals, or current plan, you MUST analyze it and generate a structured protocol.
You MUST tailor the protocol to their lifestyle (e.g., a software engineer has different needs than a field agent).
If the user asks for it to be "harder" or "more intense", increase the difficulty of workouts and discipline.
If they want it to "make their life feel good", focus on balance, mental clarity, and efficient habits.

When you generate a protocol, you MUST include a JSON block at the end of your message wrapped in <PROTOCOL_JSON> tags.
The JSON must follow this structure:
{
  "timetable": "A markdown string of the 24h schedule",
  "timetable_data": [
    {"id": "unique_id", "time": "HH:MM AM/PM", "title": "Task Name", "description": "Short desc", "completed": false}
  ],
  "total_days": 30,
  "nutrition": "A markdown string of the diet plan",
  "workout": "A markdown string of the workout plan",
  "workout_data": {
    "Day 1": [
      {
        "part": "Focus Area (e.g. Chest/Back)",
        "exercises": [
          {"name": "Exercise Name", "sets": "3", "reps": "12", "target": "Target Muscle/Goal"}
        ]
      }
    ],
    "Day 2": [...]
  },
  "skills": "A markdown string of the skill roadmap (e.g. CS, Martial Arts, etc.)",
  "goals": "A markdown string of weekly goals",
  "goals_data": [
    {"week": 1, "title": "Foundation", "goals": ["Goal 1", "Goal 2"]}
  ]
}

MEAL ANALYSIS:
If the user uploads an image of a meal, analyze its nutritional content (protein, carbs, fats) and provide tactical feedback.
`;

const GeminiWave = () => (
  <div className="flex items-center gap-1 h-8 px-4">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-yellow-500 rounded-full"
        animate={{
          height: [8, 24, 12, 20, 8],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.05,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

const ShadowAI: React.FC<{ onProtocolGenerated?: () => void }> = ({ onProtocolGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Protocol initialized. I am Shadow AI. Provide your tactical plan or paste your current timetable for analysis." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        soundManager.play('success');
        // Auto-send if it's a significant transcript
        if (transcript.length > 10) {
          setTimeout(() => handleSend(transcript), 500);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        soundManager.play('error');
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser or environment.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      soundManager.play('scan');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech start error", e);
        setIsListening(false);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        soundManager.play('scan');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input.trim();
    if ((!messageToSend && !selectedImage) || isTyping) return;

    soundManager.play('click');
    const userMessage = messageToSend;
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    
    const newMessage: Message = { role: 'user', text: userMessage || "Analyze this tactical fuel." };
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    try {
      const contents: any[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const currentParts: any[] = [];
      if (userMessage) currentParts.push({ text: userMessage });
      if (currentImage) {
        currentParts.push({
          inlineData: {
            data: currentImage.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      }
      
      contents.push({ role: 'user', parts: currentParts });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const aiText = response.text || "Protocol error. Connection lost.";
      
      // Check for Protocol JSON
      const jsonMatch = aiText.match(/<PROTOCOL_JSON>([\s\S]*?)<\/PROTOCOL_JSON>/);
      if (jsonMatch && auth.currentUser) {
        try {
          const protocolData = JSON.parse(jsonMatch[1]);
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const protocolRef = doc(db, 'users', auth.currentUser.uid, 'protocol', 'active');
          
          await setDoc(protocolRef, {
            ...protocolData,
            updatedAt: serverTimestamp()
          });
          
          await setDoc(userRef, { hasProtocol: true }, { merge: true });
          
          soundManager.play('success');
          if (onProtocolGenerated) onProtocolGenerated();
        } catch (e) {
          console.error("Failed to parse protocol JSON", e);
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: aiText.replace(/<PROTOCOL_JSON>[\s\S]*?<\/PROTOCOL_JSON>/, '').trim() }]);
    } catch (error) {
      console.error("AI Error:", error);
      soundManager.play('error');
      setMessages(prev => [...prev, { role: 'model', text: "Tactical failure. System offline. Check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-sm font-black italic uppercase tracking-tighter text-yellow-500">Shadow AI</h2>
            <p className="text-[8px] text-neutral-500 font-mono uppercase tracking-widest">Tactical Assistant v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-neutral-500 uppercase">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex gap-4 max-w-[90%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-lg",
              msg.role === 'user' ? "bg-neutral-800 border-neutral-700" : "bg-neutral-950 border-yellow-500/50"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-neutral-400" /> : <Bot className="w-5 h-5 text-yellow-500" />}
            </div>
            <div className={cn(
              "p-5 rounded-3xl text-sm leading-relaxed shadow-xl",
              msg.role === 'user' ? "bg-yellow-500 text-neutral-950 rounded-tr-none font-medium" : "bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-tl-none"
            )}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-4 max-w-[90%]">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-neutral-950 border border-yellow-500/50">
              <Bot className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-4"
          >
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-700">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg"
              >
                ×
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono uppercase">Tactical Image Loaded</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-6 bg-neutral-950 border-t border-neutral-800">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          className="hidden" 
        />
        <div className="relative flex items-center gap-3">
          <button 
            onClick={toggleListening}
            className={cn(
              "p-4 rounded-2xl transition-all flex items-center justify-center border",
              isListening ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-yellow-500"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="relative flex-1 flex items-center gap-3">
            {isListening ? (
              <div className="flex-1 bg-neutral-900 border border-yellow-500/50 rounded-2xl h-[52px] flex items-center justify-center overflow-hidden">
                <GeminiWave />
                <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest animate-pulse">Processing Audio...</span>
              </div>
            ) : (
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Enter tactical query or paste plan..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-5 pr-14 text-sm focus:border-yellow-500 outline-none transition-all placeholder:text-neutral-600"
              />
            )}
            {!isListening && (
              <button 
                onClick={() => handleSend()}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="absolute right-2 top-2 bottom-2 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-yellow-500 text-neutral-950 rounded-xl transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <p className="text-[8px] text-neutral-600 font-mono uppercase tracking-widest">
            Encrypted Channel
          </p>
          <div className="flex gap-4">
             {!onProtocolGenerated && (
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="text-[8px] text-neutral-500 font-mono uppercase tracking-widest hover:text-yellow-500 flex items-center gap-1"
               >
                 <Camera className="w-3 h-3" /> Analyze Meal
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShadowAI;
