import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Lock, Mail, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch, setAuthToken } from '../api';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode: initialMode }: AuthPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear states when mode changes
  useEffect(() => {
    setError('');
    setSuccess('');
    setFieldErrors({});
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    // Basic client validations
    const newFieldErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newFieldErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newFieldErrors.email = 'Email must be a valid email';
    }

    if (!password) {
      newFieldErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newFieldErrors.password = 'Password length must be at least 6 characters long';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    try {
      setLoading(true);
      if (initialMode === 'login') {
        const loginRes = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const token = loginRes?.data?.accessToken;
        if (token) {
          setAuthToken(token);
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(payload?.role)) {
              navigate('/staff');
              return;
            }
          } catch (e) {
            console.error('Failed to parse token:', e);
          }
        }
        navigate('/');
      } else {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            username: email.split('@')[0],
          }),
        });
        setSuccess('Registration successful! New staff accounts are pending admin approval.');
        setTimeout(() => {
          navigate('/signin');
        }, 1500);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('not approved')) {
        setError('Your staff account is pending admin approval. You will be able to log in once approved.');
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: msg.replace(/"/g, '') });
      } else if (msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: msg.replace(/"/g, '') });
      } else {
        setError(msg || (initialMode === 'login' ? 'Invalid email or password' : 'Failed to register'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#2D6DB5] flex-shrink-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 px-2.5 py-1.5 rounded transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="text-white text-xl font-bold tracking-wide">GIBI-GUBAE</h1>
          <div className="w-20 hidden sm:block" />
        </div>

        {/* Amharic Scripture Banner */}
        <div className="bg-[#1a4f8a] text-center px-4 py-2">
          <p className="text-white/80 text-xs italic tracking-wide">
            ምክርን ስማ፥ ተግሣጽንም ተቀበል በፍጻሜህ ጠቢብ ትሆን ዘንድ። &nbsp;
            <span className="not-italic font-medium text-white/60">መጽሐፈ ምሳሌ 19 ፥ 20</span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          {/* Top Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <Link
              to="/signin"
              className={`flex-1 py-3 text-center text-sm font-bold transition-colors ${
                initialMode === 'login'
                  ? 'text-[#2D6DB5] bg-white border-b-2 border-[#2D6DB5]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className={`flex-1 py-3 text-center text-sm font-bold transition-colors ${
                initialMode === 'register'
                  ? 'text-[#2D6DB5] bg-white border-b-2 border-[#2D6DB5]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {initialMode === 'login' ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {initialMode === 'login'
                  ? 'Sign in to ask questions, view responses, or access staff moderation'
                  : 'Register for staff moderation or student discussion participation'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-xs">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-emerald-700 text-xs">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm border ${
                      fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] text-gray-800 transition-colors`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2 text-sm border ${
                      fieldErrors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] text-gray-800 transition-colors`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D6DB5] hover:bg-[#245A94] disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
              >
                {loading
                  ? 'Please wait...'
                  : initialMode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            {/* Portal Notice */}
            <div className="mt-6 p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck size={16} className="text-[#2D6DB5] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Attendees and students can join rooms and ask questions anonymously without an account. Staff members require administrative approval before accessing moderation tools.
              </p>
            </div>

            {/* Bottom Mode Switcher Link */}
            <div className="text-center mt-5 pt-4 border-t border-gray-100">
              {initialMode === 'login' ? (
                <p className="text-xs text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[#2D6DB5] font-semibold hover:underline">
                    Register here
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <Link to="/signin" className="text-[#2D6DB5] font-semibold hover:underline">
                    Sign in here
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
