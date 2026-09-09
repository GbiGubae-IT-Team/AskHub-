import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiFetch, setAuthToken } from '../api';
import { useLanguage } from '../context/LanguageContext';

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
  subtitle,
  noticeIcon = '🔒',
  noticeTitle,
  noticeMessage,
  showGuestOption = true,
  submitButtonText,
  initialMode = 'login',
  onModeChange,
  onSubmit
}: SignInModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string}>({});
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Resolve defaults through translation
  const resolvedSubtitle = subtitle ?? t('signin.subtitle');
  const resolvedNoticeTitle = noticeTitle ?? t('signin.notice.privacyTitle');
  const resolvedNoticeMessage = noticeMessage ?? t('signin.notice.privacyBody');
  const resolvedSubmitText = submitButtonText ?? t('signin.joinNow');

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
        setSuccess(t('signin.pendingApproval'));
        setMode('login');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('not approved')) {
        setError(t('signin.notApproved'));
      } else if (msg.includes('"email"')) {
        setFieldErrors({ email: msg.replace(/"/g, '') });
      } else if (msg.includes('"password"')) {
        setFieldErrors({ password: msg.replace(/"/g, '') });
      } else {
        setError(msg || (mode === 'login' ? t('signin.invalidCredentials') : t('signin.failedRegister')));
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#2D6DB5] z-50 shadow-2xl flex flex-col">
        <div className="flex-1 flex flex-col justify-center p-6 max-h-screen overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-4">
            <h1 className="text-white text-2xl font-bold mb-2">{t('signin.title')}</h1>
            <p className="text-white text-sm">{resolvedSubtitle}</p>
          </div>

          {/* Notice Box */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-3 mb-4 flex items-start gap-2">
            <span className="text-lg flex-shrink-0">{noticeIcon}</span>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">{resolvedNoticeTitle}</p>
              <p className="text-white/80 text-xs leading-relaxed">{resolvedNoticeMessage}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            {/* Mode Tabs */}
            <div className="flex mb-4 border-b border-gray-100">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 pb-2 text-xs font-bold transition-colors ${
                  mode === 'login'
                    ? 'text-[#2D6DB5] border-b-2 border-[#2D6DB5]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('signin.submit')}
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 pb-2 text-xs font-bold transition-colors ${
                  mode === 'register'
                    ? 'text-[#2D6DB5] border-b-2 border-[#2D6DB5]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('signin.register')}
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="signin-email" className="block text-xs text-gray-700 mb-1">
                  {t('signin.email')}
                </label>
                <input
                  type="email"
                  id="signin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm border ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#2D6DB5]'
                  } rounded focus:outline-none focus:ring-2 transition-colors`}
                  placeholder={t('signin.email.placeholder')}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-xs text-gray-700 mb-1">
                  {t('signin.password')}
                </label>
                <input
                  type="password"
                  id="signin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm border ${
                    fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#2D6DB5]'
                  } rounded focus:outline-none focus:ring-2 transition-colors`}
                  placeholder={t('signin.password.placeholder')}
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-xs text-center font-medium mt-1 bg-red-50 border border-red-100 rounded p-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-600 text-xs text-center font-medium mt-1 bg-green-50 border border-green-100 rounded p-2">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#2D6DB5] hover:bg-[#245A94] text-white font-medium py-2 text-sm rounded mt-2 transition-colors cursor-pointer"
              >
                {mode === 'login' ? resolvedSubmitText : t('signin.register')}
              </button>

              {showGuestOption && mode === 'login' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-white/70 hover:text-white text-xs py-1.5 transition-colors hover:underline"
                >
                  {t('signin.guestContinue')}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
