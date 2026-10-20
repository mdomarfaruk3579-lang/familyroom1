import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { ShieldCheck, Lock, ArrowLeft, KeyRound, Sparkles, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const [adminCode, setAdminCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginWithAdminCode, signInWithGoogle, isAdmin } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await loginWithAdminCode(adminCode);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/admin');
        }, 1200);
      } else {
        setError(lang === 'en' 
          ? 'Incorrect admin code! Please enter the valid master code.' 
          : 'ভুল সিক্রেট কোড! সঠিক কোডটি দিন।');
      }
    } catch {
      setError(lang === 'en' ? 'Something went wrong. Please try again.' : 'একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/unauthorized-domain') {
        setError(lang === 'en'
          ? `Vercel domain '${window.location.hostname}' is not yet added in Firebase Console (Authentication > Settings > Authorized Domains). You can use the Master Admin Code above to login instantly!`
          : `এই ডোমেইন '${window.location.hostname}' ফায়ারবেস অথেনটিকেশনে Authorized নেই। তবে আপনি উপরের 'অ্যাডমিন সিক্রেট কোড' দিয়ে কোনো প্রকার ঝামেলা ছাড়াই সাথে সাথে লগইন করতে পারেন!`);
      } else {
        setError(lang === 'en' ? 'Google sign in was cancelled or failed.' : 'গুগল সাইন-ইন সম্পন্ন হয়নি বা বাতিল করা হয়েছে। উপরের কোড দিয়ে লগইন করতে পারেন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-800 transition-colors mb-6 font-medium group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{lang === 'en' ? 'Back to Family Tree' : 'ফ্যামিলি রুমে ফিরে যান'}</span>
        </button>

        {/* Master Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/80 shadow-[0_20px_50px_rgba(26,54,54,0.08)] overflow-hidden transition-all duration-300">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1A3636] via-[#244c4c] to-[#1A3636] p-8 text-center text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />
            
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-400/10 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-wide text-amber-200 mb-2">
              {lang === 'en' ? 'Admin Verification' : 'অ্যাডমিন ভেরিফিকেশন'}
            </h1>
            <p className="text-stone-300 text-xs md:text-sm max-w-xs mx-auto leading-relaxed">
              {lang === 'en' 
                ? 'Enter the administrative master code to manage members, timeline & archives.' 
                : 'পারিবারিক ওয়েবসাইট নিয়ন্ত্রণ ও যাবতীয় তথ্য এডিট করতে অ্যাডমিন কোডটি দিন।'}
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8 space-y-6">
            {isSuccess ? (
              <div className="text-center py-6 space-y-3 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-emerald-800">
                  {lang === 'en' ? 'Access Granted!' : 'অ্যাক্সেস অনুমোদিত!'}
                </h3>
                <p className="text-sm text-stone-600">
                  {lang === 'en' ? 'Redirecting to Admin Dashboard...' : 'অ্যাডমিন ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCodeSubmit} className="space-y-5">
                {isAdmin && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{lang === 'en' ? 'You already have active admin permissions!' : 'আপনার অলরেডি অ্যাডমিন অ্যাক্সেস রয়েছে!'}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    {lang === 'en' ? 'Master Admin Code' : 'অ্যাডমিন সিক্রেট কোড'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type={showCode ? 'text' : 'password'}
                      value={adminCode}
                      onChange={(e) => {
                        setAdminCode(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="••••••••••••••"
                      className="w-full pl-11 pr-11 py-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-mono tracking-widest text-center text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-xs"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !adminCode.trim()}
                  className="w-full py-3.5 px-6 rounded-xl font-medium text-stone-900 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span className="font-semibold tracking-wide">
                    {loading ? (lang === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...') : (lang === 'en' ? 'Unlock Admin Access' : 'অ্যাডমিন আনলক করুন')}
                  </span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-stone-200 w-full absolute" />
                  <span className="bg-white px-3 text-xs text-stone-400 uppercase tracking-widest relative">
                    {lang === 'en' ? 'Or' : 'অথবা'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'en' ? 'Sign in with Google Account' : 'গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="bg-stone-50/80 px-6 py-4 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-500">
              {lang === 'en' 
                ? 'Authorized family curators only. Protected system.' 
                : 'শুধুমাত্র পরিবারের অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
