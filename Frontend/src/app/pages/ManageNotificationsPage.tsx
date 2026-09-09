import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Bell,
  Send,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  LogOut,
  RefreshCw,
  Users,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch, removeAuthToken } from '../api';
import { useLanguage } from '../context/LanguageContext';

interface NotificationItem {
  id: string;
  content: string;
  targetType: 'PUBLIC' | 'STAFF' | 'USER';
  isActive: boolean;
  createdAt: string;
  createdById: string | null;
}

interface ManageNotificationsPageProps {
  onBack?: () => void;
}

export function ManageNotificationsPage({ onBack }: ManageNotificationsPageProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // List state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Send panel state
  const [notificationTarget, setNotificationTarget] = useState<string>('');
  const [notificationContent, setNotificationContent] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toggle visibility state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const editRef = useRef<HTMLTextAreaElement>(null);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/superadmin');
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // scope=sent returns only notifications created by the logged-in user (this super admin)
      const res = await apiFetch('/notifications?scope=sent&limit=100');
      if (res?.data?.items) {
        setNotifications(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ── Send Notification ──────────────────────────────────────────────────────
  const handleSend = async () => {
    setSendError(null);
    setSendSuccess(false);

    if (!notificationTarget) {
      setSendError(t('notif.err.noTarget'));
      return;
    }
    if (notificationContent.trim().length < 10) {
      setSendError(t('notif.err.tooShort'));
      return;
    }

    setIsSending(true);
    try {
      const res = await apiFetch('/notifications', {
        method: 'POST',
        body: JSON.stringify({ content: notificationContent.trim(), targetType: notificationTarget }),
      });
      if (res?.data) {
        setNotifications((prev) => [res.data, ...prev]);
      }
      setNotificationContent('');
      setNotificationTarget('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (e: any) {
      setSendError(e.message || t('notif.err.sendFail'));
    } finally {
      setIsSending(false);
    }
  };

  // ── Toggle Visibility ──────────────────────────────────────────────────────
  const handleToggleActive = async (notif: NotificationItem) => {
    setTogglingId(notif.id);
    const newActive = !notif.isActive;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isActive: newActive } : n))
    );
    try {
      await apiFetch(`/notifications/${notif.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newActive }),
      });
    } catch (e) {
      console.error('Failed to toggle visibility:', e);
      // rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isActive: !newActive } : n))
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── Inline Edit ────────────────────────────────────────────────────────────
  const startEdit = (notif: NotificationItem) => {
    setEditingId(notif.id);
    setEditContent(notif.content);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    if (editContent.trim().length < 1) return;
    setIsSavingEdit(true);
    try {
      await apiFetch(`/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editContent.trim() }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, content: editContent.trim() } : n))
      );
      setEditingId(null);
    } catch (e) {
      console.error('Failed to save edit:', e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const targetBadge = (target: string) => {
    if (target === 'PUBLIC') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Globe size={10} /> {t('notif.badge.public')}
      </span>
    );
    if (target === 'STAFF') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        <Users size={10} /> {t('notif.badge.staff')}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
        {t('notif.badge.user')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#2D6DB5] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold flex-1 flex items-center gap-2">
            <Bell size={20} />
            {t('notif.title')}
          </h1>
          <button
            onClick={() => { removeAuthToken(); navigate('/'); }}
            className="text-white/80 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title={t('superadmin.signOut')}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t('superadmin.signOut')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-[1100px] w-full mx-auto">

        {/* ── Push Notification Panel ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <span className="text-[#2D6DB5]">📨</span>
              {t('notif.pushTitle')}
            </h2>
            <div>
              {sendError && (
                <span className="text-sm text-red-500 font-medium">{sendError}</span>
              )}
              {sendSuccess && (
                <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
                  <ShieldCheck size={16} /> {t('notif.sendSuccess')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <textarea
                value={notificationContent}
                onChange={(e) => {
                  setNotificationContent(e.target.value);
                  setSendError(null);
                }}
                placeholder={t('notif.placeholder')}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] resize-none h-24"
              />
            </div>
            <div className="flex flex-col justify-between w-full md:w-64">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('notif.target')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={notificationTarget}
                  onChange={(e) => {
                    setNotificationTarget(e.target.value);
                    setSendError(null);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6DB5]"
                >
                  <option value="" disabled>{t('notif.selectTarget')}</option>
                  <option value="PUBLIC">{t('notif.publicTarget')}</option>
                  <option value="STAFF">{t('notif.staffTarget')}</option>
                </select>
              </div>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="mt-4 w-full bg-[#2D6DB5] hover:bg-[#245A94] disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={16} />
                {isSending ? t('notif.sending') : t('notif.sendBtn')}
              </button>
            </div>
          </div>
        </div>

        {/* ── Notifications Table ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">{t('notif.allTitle')}</h2>
            <button
              onClick={fetchNotifications}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title={t('superadmin.refresh')}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              {t('notif.loading')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              <Bell size={32} className="text-gray-300 mx-auto mb-2" />
              {t('notif.empty')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3 ${
                    !notif.isActive ? 'opacity-50 bg-gray-50' : ''
                  }`}
                >
                  {/* Content / Edit area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {targetBadge(notif.targetType)}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        notif.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {notif.isActive ? <><Eye size={10} /> {t('notif.visible')}</> : <><EyeOff size={10} /> {t('notif.hidden')}</>}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {editingId === notif.id ? (
                      <div className="mt-1">
                        <textarea
                          ref={editRef}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border border-[#2D6DB5] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => saveEdit(notif.id)}
                            disabled={isSavingEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Check size={12} /> {t('notif.save')}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-md transition-colors cursor-pointer"
                          >
                            <X size={12} /> {t('notif.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 mt-1 leading-relaxed">{notif.content}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== notif.id && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(notif)}
                        className="p-1.5 text-gray-400 hover:text-[#2D6DB5] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title={t('notif.editHint')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(notif)}
                        disabled={togglingId === notif.id}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                          notif.isActive
                            ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={notif.isActive ? t('notif.hideHint') : t('notif.showHint')}
                      >
                        {notif.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
