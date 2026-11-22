import { Calendar, FileText, LogIn, ShieldCheck } from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => void;
  isSigningIn: boolean;
  authError: string | null;
}

export function AuthGate({ onSignIn, isSigningIn, authError }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <main className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-bold tracking-tight text-blue-700">Noted</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            DCISM Academic Announcement Organizer
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sign in with your Google account to upload announcement screenshots, extract
            deadlines with Gemini, and sync your personal Academic Calendar with Cloud Firestore.
          </p>
        </div>

        <ul className="space-y-3 border-t border-b border-slate-100 py-5 text-xs text-slate-600">
          <li className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Extract titles, summaries, deadlines, and required documents from notice images.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              View exam schedules, enrollment windows, and cutoffs directly on your monthly
              Academic Calendar.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Every announcement is reviewed by you before saving and stored privately in your
              Firestore workspace.
            </span>
          </li>
        </ul>

        {authError && (
          <p
            role="alert"
            className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5"
          >
            {authError}
          </p>
        )}

        <button
          type="button"
          disabled={isSigningIn}
          onClick={onSignIn}
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors min-h-[44px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
      </main>
    </div>
  );
}
