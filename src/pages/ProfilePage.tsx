import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SCHEMA_LIMITS } from '../types';

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    firebaseUser,
    profile,
    loading,
    isAdmin,
    needsRegistration,
    registerStudentProfile,
    updateStudentProfile,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setStudentId(profile.studentId || '');
      setDepartment(profile.department || '');
      setPhone(profile.phone || '');
    } else if (firebaseUser) {
      setName(firebaseUser.displayName || '');
    }
  }, [profile, firebaseUser]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 animate-pulse space-y-4">
          <div className="h-7 w-40 bg-stone-100 rounded" />
          <div className="h-32 w-full bg-stone-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-stone-900">Not signed in</h1>
          <p className="mt-2 text-sm text-stone-600">
            Sign in to view and manage your student profile.
          </p>
          <Link
            to="/auth?redirect=/profile"
            className="mt-6 inline-flex px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (needsRegistration) {
        await registerStudentProfile({ name, studentId, department, phone });
        showToast('Profile registered successfully!', 'success');
      } else {
        await updateStudentProfile({ name, studentId, department, phone });
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out of Smart Canteen.', 'info');
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-stone-900">
                {profile?.name || firebaseUser.displayName || 'Campus Account'}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {firebaseUser.email} · {isAdmin ? 'Administrator' : 'Student Account'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#E7DFD3] text-xs font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {isAdmin && (
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0" />
              <p className="text-sm font-medium text-stone-800">
                Verified Canteen Administrator Access Enabled
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open Admin Dashboard</span>
            </Link>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="font-display text-lg font-bold text-stone-900">
            Account &amp; Campus Information
          </h2>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              required
              minLength={SCHEMA_LIMITS.NAME_MIN}
              maxLength={SCHEMA_LIMITS.NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prof-student-id"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Student / Roll ID
              </label>
              <input
                id="prof-student-id"
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
              <label
                htmlFor="prof-phone"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="prof-phone"
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
            <label htmlFor="prof-dept" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Department / Program
            </label>
            <input
              id="prof-dept"
              type="text"
              required
              minLength={SCHEMA_LIMITS.DEPARTMENT_MIN}
              maxLength={SCHEMA_LIMITS.DEPARTMENT_MAX}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-4">
            <Link
              to="/orders"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              View Order History →
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
