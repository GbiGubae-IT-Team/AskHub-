import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiFetch, setAuthToken } from '../api';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitle?: string;
  noticeIcon?: string;
  noticeTitle?: string;
  noticeMessage?: string;
  showGuestOption?: boolean;
  submitButtonText?: string;
  initialMode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
  onSubmit?: () => void;
}

export function SignInModal({
  isOpen,
  onClose,
  subtitle = "Ask your questions anonymously",
  noticeIcon = "🔒",
  noticeTitle = "Your Privacy Matters",
  noticeMessage = "All questions and interactions are completely confidential and anonymous.",
  showGuestOption = true,
  submitButtonText = "Join now",
  initialMode = 'login',
  onModeChange,
  onSubmit
}: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string}>({});
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setFieldErrors({});
    onModeChange?.(newMode);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    try {
      if (mode === 'login') {
        const loginRes = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        setAuthToken(loginRes.data.accessToken);
        if (onSubmit) onSubmit();
        onClose();
      } else {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, username: email.split('@')[0] })
        });
        setSuccess('new staffs pendding approval');
        setMode('login'); // switch back after registration
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('not approved')) {
        setError('not approved');
      } else if (msg.includes('"email"')) {
        setFieldErrors({ email: msg.replace(/"/g, '') });
      } else if (msg.includes('"password"')) {
        setFieldErrors({ password: msg.replace(/"/g, '') });
      } else {
        setError(msg || (mode === 'login' ? 'Invalid credentials' : 'Failed to register'));
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#2D6DB5] z-50 shadow-2xl flex flex-col">
        <div className="flex-1 flex flex-col justify-center p-6 max-h-screen overflow-y-auto">
          <button onClick={onClose} className="absolute top-3 right-3 text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>

          <div className="text-center mb-4">
            <h1 className="text-white text-2xl font-bold mb-2">GIBI-GUBAE</h1>
            <p className="text-white text-sm">{subtitle}</p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <form className="space-y-3" onSubmit={handleSubmit}>
              
              <div>
                <label htmlFor="email" className="block text-xs text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#2D6DB5]'} rounded focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="Enter your email"
                />
                {fieldErrors.email && <p className="text-red-500 text-[11px] font-medium mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#2D6DB5]'} rounded focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="Enter your password"
                />
                {fieldErrors.password && <p className="text-red-500 text-[11px] font-medium mt-1">{fieldErrors.password}</p>}
              </div>

              {error && <div className="text-red-600 text-xs text-center font-medium mt-1">{error}</div>}
              {success && <div className="text-green-600 text-xs text-center font-medium mt-1">{success}</div>}

              <button type="submit" className="w-full bg-[#2D6DB5] hover:bg-[#245A94] text-white font-medium py-2 text-sm rounded mt-2">
                {mode === 'login' ? submitButtonText : 'Register'}
              </button>

              <div className="text-center mt-3 pt-2 border-t">
                {mode === 'login' ? (
                  <p className="text-xs text-gray-600">
                    Need an account?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="text-[#2D6DB5] hover:underline font-medium cursor-pointer">
                      Register
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="text-[#2D6DB5] hover:underline font-medium cursor-pointer">
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
