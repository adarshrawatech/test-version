import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  Activity, 
  Book, 
  CheckCircle2, 
  Circle, 
  Terminal, 
  ChevronRight,
  ChevronLeft,
  Flame,
  Droplets,
  Scale,
  LogOut,
  RefreshCw,
  Clock,
  Dumbbell,
  BookOpen,
  Trophy,
  Moon,
  Sun,
  LogIn
} from 'lucide-react';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import ProtocolDashboard from './components/ProtocolDashboard';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { handleFirestoreError, OperationType } from './lib/firestore';

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (readErr) {
            handleFirestoreError(readErr, OperationType.GET, `users/${currentUser.uid}`);
            throw readErr;
          }
          
          if (!userSnap.exists()) {
            // Create initial user profile if it doesn't exist
            try {
              await setDoc(userRef, {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Vengeance Candidate',
                email: currentUser.email,
                role: 'user',
                hasProtocol: false,
                createdAt: serverTimestamp()
              }, { merge: true });
            } catch (writeErr) {
              handleFirestoreError(writeErr, OperationType.WRITE, `users/${currentUser.uid}`);
              throw writeErr;
            }
          }
          setUser(currentUser);
        } catch (err) {
          setError("Failed to initialize user profile. Check console for details.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-yellow-500" />
          <p className="text-yellow-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Protocol...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} error={error} />;
  }

  return (
    <ErrorBoundary>
      <ProtocolDashboard />
    </ErrorBoundary>
  );
}

export default App;
