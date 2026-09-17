import { useState, useEffect } from 'react';
import { MailCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
  const { session, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    } else if (session.user.emailVerified) {
      navigate('/');
    }
  }, [session, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!session || session.user.emailVerified) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      showToast('Please enter the 6-digit code.', 'error');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/api/auth/verify-email', { code: code.trim() });
      await refreshProfile();
      showToast('Email verified! Happy shopping.');
      navigate('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Verification failed.', 'error');
    }
    setVerifying(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await api.post('/api/auth/resend-code');
      showToast('A fresh code is on its way.');
      setCooldown(60);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not resend code.', 'error');
    }
    setResending(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="w-full max-w-md">
        <div className="card p-8 animate-slide-up text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-3">
            <MailCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Check your email</h1>
          <p className="text-gray-500 text-sm mt-1 mb-6">
            We sent a 6-digit code to <span className="font-semibold text-gray-700">{session.user.email}</span>.
            It expires in 10 minutes.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="input text-center text-2xl font-bold tracking-[0.5em]"
            />
            <button type="submit" disabled={verifying} className="btn-primary w-full py-3">
              {verifying ? (<><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>) : 'Verify Email'}
            </button>
          </form>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-primary-600 font-semibold text-sm hover:underline mt-4 disabled:opacity-50"
          >
            {resending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get it? Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
