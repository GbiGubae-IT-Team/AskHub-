import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Menu, X, Bell } from 'lucide-react';
import { SignInModal } from './SignInModal';
import { NotificationModal } from './NotificationModal';
import { SuccessModal } from './SuccessModal';
import { apiFetch, getAuthToken } from '../api';
import { useEffect } from 'react';

interface HeaderProps {
  onGoToStaff?: () => void;
  onGoToRoom?: () => void;
  onGoToSignIn?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Header({ onGoToStaff, onGoToRoom, onGoToSignIn, activeTab: externalTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState('All');
  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isStaffSignInModalOpen, setIsStaffSignInModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiFetch('/notifications');
        if (res?.data?.items) {
          const fetchedNotifications = res.data.items.map((n: any) => ({
            id: n.id,
            message: n.content,
            time: new Date(n.createdAt).toLocaleString(),
            read: n.isRead
          }));
          setNotifications(fetchedNotifications.filter((n: any) => !n.read));
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = ['All', 'Faith', 'Bible', 'Prayer', 'Relationships', 'Struggles', 'General'];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleTabClick = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
    setIsDrawerOpen(false);
    if (tab === 'Rooms') onGoToRoom?.();
  };

  const handleStaffSignIn = () => {
    setIsDrawerOpen(false);
    navigate('/signin');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true })
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch(`/notifications/read-all`, { method: 'PATCH' });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) return;
    

    try {
      setIsSubmitting(true);
      await apiFetch('/questions', {
        method: 'POST',
        body: JSON.stringify({ content: questionText, isAnonymous: true }),
      });
      setQuestionText('');
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to submit question:', error);
      alert(error.message || 'Failed to submit question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="w-full bg-[#2D6DB5]">
        {/* Top Section with Logo and Search */}
        <div className="px-4 py-3">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="md:hidden text-white p-1"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>

            <h1 className="text-white text-2xl font-bold whitespace-nowrap flex-1">
              GIBI-GUBAE
            </h1>

            {/* Notification Icon - Mobile */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="md:hidden relative p-1 text-white"
              aria-label="Notifications"
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Search box on desktop - inline with title */}
            <div className="hidden md:flex flex-1 gap-2 items-center">
              <input
                type="text"
                placeholder="Ask us anything"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                className="flex-1 px-4 py-2 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={handleAskQuestion}
                disabled={isSubmitting}
                className="bg-[#F5A623] hover:bg-[#E09612] text-white font-bold px-6 py-2 rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'GO'}
              </button>
              {/* Notification Icon */}
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const token = getAuthToken();
                  if (token) {
                    try {
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      if (['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(payload?.role)) {
                        navigate('/staff');
                        return;
                      }
                    } catch (e) {}
                  }
                  navigate('/signin');
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Staff Sign In
              </button>
            </div>
          </div>

          {/* Search box on mobile - below title */}
          <div className="flex md:hidden gap-2">
            <input
              type="text"
              placeholder="Ask us anything"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              className="flex-1 px-4 py-2 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleAskQuestion}
              disabled={isSubmitting}
              className="bg-[#F5A623] hover:bg-[#E09612] text-white font-bold px-6 py-2 rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'GO'}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:block bg-[#2D6DB5] overflow-x-auto">
          <div className="flex min-w-max px-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-[#2D6DB5] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-white font-bold">Menu</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-white p-1"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="py-2 flex-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`w-full text-left px-6 py-4 transition-colors ${
                activeTab === tab
                  ? 'bg-white/20 text-white font-medium border-l-4 border-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
        {/* Staff Sign In Button at Bottom */}
        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleStaffSignIn}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded transition-colors text-sm"
          >
            Staff Sign In
          </button>
        </div>
      </div>

      {/* Student Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      {/* Staff Sign In Modal */}
      <SignInModal
        isOpen={isStaffSignInModalOpen}
        onClose={() => setIsStaffSignInModalOpen(false)}
        subtitle="Staff Login"
        noticeIcon="ℹ️"
        noticeTitle="Admin Approval Required"
        noticeMessage="New staff login requires admin approval. You will be notified once your account is approved."
        showGuestOption={false}
        submitButtonText="Request Access"
        onSubmit={() => {
          setIsStaffSignInModalOpen(false);
          onGoToStaff?.();
        }}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={getAuthToken() ? handleMarkAsRead : undefined}
        onMarkAllAsRead={getAuthToken() ? handleMarkAllAsRead : undefined}
      />

      {/* Success Modal */}
      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => setIsSuccessModalOpen(false)} 
      />
    </>
  );
}
