import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  SCHEMA_LIMITS,
  UserProfile,
} from '../types';
import { seedFoodItemsIfEmpty } from '../data/seedMenu';

interface RegistrationInput {
  name: string;
  phone: string;
  studentId: string;
  department: string;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  needsRegistration: boolean;
  signInWithGoogle: () => Promise<void>;
  registerStudentProfile: (data: RegistrationInput) => Promise<void>;
  updateStudentProfile: (data: RegistrationInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdminRecord, setIsAdminRecord] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const isBootstrappedAdmin = Boolean(
    firebaseUser?.email &&
      firebaseUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
      firebaseUser.emailVerified,
  );

  const isAdmin = isBootstrappedAdmin || isAdminRecord || profile?.role === 'admin';

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setIsAdminRecord(false);
        setProfileLoaded(true);
        setAuthReady(true);
        return;
      }

      setProfileLoaded(false);
      setAuthReady(true);

      // Check trusted /admins registry if not bootstrapped admin
      const isBootstrapped = Boolean(
        user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
          user.emailVerified,
      );

      if (isBootstrapped) {
        setIsAdminRecord(true);
        // Auto-seed sample canteen menu on first admin login if empty
        try {
          await seedFoodItemsIfEmpty();
        } catch (err) {
          console.error('Auto-seed skipped or failed:', err);
        }
      } else {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          const existsInAdmins = adminSnap.exists();
          setIsAdminRecord(existsInAdmins);
          if (existsInAdmins) {
            await seedFoodItemsIfEmpty();
          }
        } catch {
          setIsAdminRecord(false);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Attach real-time listener to user's profile document only when authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const userPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    const unsubProfile = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setProfileLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, userPath);
      },
    );

    return () => unsubProfile();
  }, [firebaseUser]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const registerStudentProfile = useCallback(
    async (input: RegistrationInput) => {
      if (!firebaseUser) {
        throw new Error('You must be signed in before registering a profile.');
      }

      const name = input.name.trim().slice(0, SCHEMA_LIMITS.NAME_MAX);
      const phone = input.phone.trim().slice(0, SCHEMA_LIMITS.PHONE_MAX);
      const studentId = input.studentId.trim().slice(0, SCHEMA_LIMITS.STUDENT_ID_MAX);
      const department = input.department.trim().slice(0, SCHEMA_LIMITS.DEPARTMENT_MAX);
      const email = (firebaseUser.email || '').trim().slice(0, SCHEMA_LIMITS.EMAIL_MAX);

      if (name.length < SCHEMA_LIMITS.NAME_MIN) {
        throw new Error('Full name must be at least 2 characters.');
      }
      if (phone.length < SCHEMA_LIMITS.PHONE_MIN) {
        throw new Error('Please enter a valid phone number.');
      }
      if (studentId.length < SCHEMA_LIMITS.STUDENT_ID_MIN) {
        throw new Error('Please enter your valid Student / Roll ID.');
      }
      if (department.length < SCHEMA_LIMITS.DEPARTMENT_MIN) {
        throw new Error('Please enter your department or program.');
      }

      const role = isBootstrappedAdmin || isAdminRecord ? 'admin' : 'student';
      const userPath = `users/${firebaseUser.uid}`;

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          name,
          email,
          phone,
          studentId,
          department,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, userPath);
      }
    },
    [firebaseUser, isAdminRecord, isBootstrappedAdmin],
  );

  const updateStudentProfile = useCallback(
    async (input: RegistrationInput) => {
      if (!firebaseUser) {
        throw new Error('You must be signed in to update your profile.');
      }

      const name = input.name.trim().slice(0, SCHEMA_LIMITS.NAME_MAX);
      const phone = input.phone.trim().slice(0, SCHEMA_LIMITS.PHONE_MAX);
      const studentId = input.studentId.trim().slice(0, SCHEMA_LIMITS.STUDENT_ID_MAX);
      const department = input.department.trim().slice(0, SCHEMA_LIMITS.DEPARTMENT_MAX);

      if (name.length < SCHEMA_LIMITS.NAME_MIN) {
        throw new Error('Full name must be at least 2 characters.');
      }
      if (phone.length < SCHEMA_LIMITS.PHONE_MIN) {
        throw new Error('Please enter a valid phone number.');
      }
      if (studentId.length < SCHEMA_LIMITS.STUDENT_ID_MIN) {
        throw new Error('Please enter your valid Student / Roll ID.');
      }
      if (department.length < SCHEMA_LIMITS.DEPARTMENT_MIN) {
        throw new Error('Please enter your department or program.');
      }

      const userPath = `users/${firebaseUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          name,
          phone,
          studentId,
          department,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userPath);
      }
    },
    [firebaseUser],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const loading = !authReady || (Boolean(firebaseUser) && !profileLoaded);
  const needsRegistration = Boolean(firebaseUser && profileLoaded && !profile);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        isAdmin,
        needsRegistration,
        signInWithGoogle,
        registerStudentProfile,
        updateStudentProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
