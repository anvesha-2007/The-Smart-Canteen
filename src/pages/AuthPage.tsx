import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LogIn, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SCHEMA_LIMITS } from '../types';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/menu';

  const {
    firebaseUser,
    profile,
    loading,
    isAdmin,
    needsRegistration,
    signInWithGoogle,
    registerStudentProfile,
  } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseUser && !name) {
      setName(firebaseUser.displayName || '');
    }
  }, [firebaseUser, name]);

  useEffect(() => {
    if (!loading && firebaseUser && profile) {
      navigate(redirectTarget, { replace: true });
    }
  }, [loading, firebaseUser, profile, navigate, redirectTarget]);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      showToast('Signed in successfully!', 'success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to sign in with Google. Please try again.';
      setErrorMsg(message);
      showToast('Sign in failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await registerStudentProfile({ name, studentId, department, phone });
      showToast('Smart Canteen registration complete!', 'success');
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-2xl p-8 animate-pulse space-y-4">
          <div className="h-6 w-40 bg-stone-100 rounded mx-auto" />
          <div className="h-4 w-64 bg-stone-100 rounded mx-auto" />
          <div className="h-11 w-full bg-stone-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-10 shadow-xs">
        {!firebaseUser ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
              Sign In to Smart Canteen
            </h1>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Use your Google account to register as a student, place Cash at Counter orders, and
              track your live pickup status.
            </p>

            {errorMsg && (
              <div className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleLogin}
              className="mt-6 w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              <span>{submitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-6 pt-6 border-t border-[#F0EAE1] space-y-2.5 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Firebase Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Authorized Canteen Admins gain access to the Admin Portal automatically</span>
              </div>
            </div>
          </div>
        ) : needsRegistration ? (
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-stone-900">
              Complete Campus Registration
            </h1>
            <p className="text-sm text-stone-600">
              Signed in as <span className="font-semibold text-stone-900">{firebaseUser.email}</span>.
              Add your campus details once so orders pre-fill automatically.
            </p>

            {isAdmin && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs font-medium text-orange-900 flex items-center justify-between gap-2">
                <span>Admin privileges verified for this account.</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="font-bold underline shrink-0"
                >
                  Open Admin Portal
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                minLength={SCHEMA_LIMITS.NAME_MIN}
                maxLength={SCHEMA_LIMITS.NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-student-id"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Student / Roll ID
                </label>
                <input
                  id="reg-student-id"
                  type="text"
                  required
                  minLength={SCHEMA_LIMITS.STUDENT_ID_MIN}
                  maxLength={SCHEMA_LIMITS.STUDENT_ID_MAX}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. CS2026-042"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  minLength={SCHEMA_LIMITS.PHONE_MIN}
                  maxLength={SCHEMA_LIMITS.PHONE_MAX}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-dept" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Department / Course
              </label>
              <input
                id="reg-dept"
                type="text"
                required
                minLength={SCHEMA_LIMITS.DEPARTMENT_MIN}
                maxLength={SCHEMA_LIMITS.DEPARTMENT_MAX}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 px-5 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving Profile...' : 'Complete Registration'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
