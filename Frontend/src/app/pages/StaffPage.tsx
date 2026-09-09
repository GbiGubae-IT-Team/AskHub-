import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Grid,
  Users,
  X,
  KeyRound,
  Copy,
  Check,
  DoorOpen,
  ExternalLink,
  ShieldCheck,
  Archive,
  History,
  History,
  LogOut,
} from 'lucide-react';
import { apiFetch, removeAuthToken, isApprovedStaff, getCurrentUser } from '../api';
import { useLanguage } from '../context/LanguageContext';

type QuestionStatusType = "PENDING" | "APPROVED" | "REJECTED" | "ANSWERED";

interface StaffQuestion {
  id: string;
  category?: string;
  title?: string;
  content: string;
  status: QuestionStatusType;
  answer?: string;
  answers?: { id: string; content: string; createdAt: string }[];
  createdAt?: string;
  isAnonymous?: boolean;
}

export interface StaffRoom {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string;
  staffVerified: boolean;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  members?: number;
}

interface StaffPageProps {
  onBack?: () => void;
  onGoToRoom?: (room?: StaffRoom) => void;
}

export function StaffPage({ onBack, onGoToRoom }: StaffPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('QUESTIONS');
  const user = getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  useEffect(() => {
    if (!isApprovedStaff()) {
      navigate('/signin');
      return;
    }
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab')?.toUpperCase();
    if (tabParam && ['QUESTIONS', 'ROOMS', 'STAFF', 'HISTORY'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Room modal & state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomCategory, setRoomCategory] = useState('Faith & Study');
  const [rooms, setRooms] = useState<StaffRoom[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newlyCreatedRoom, setNewlyCreatedRoom] = useState<{ name: string; code: string } | null>(null);

  // Question filter & state
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuestionStatusType>('ALL');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [questions, setQuestions] = useState<StaffQuestion[]>([]);

  const fetchQuestions = async () => {
    try {
      const res = await apiFetch("/questions");
      setQuestions(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await apiFetch("/rooms");
      setRooms(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchRooms();
  }, []);

  const handleCopyKey = (code?: string | null) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const [createRoomError, setCreateRoomError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setCreateRoomError(null);
    try {
      const res = await apiFetch("/rooms", {
        method: "POST",
        body: JSON.stringify({
          name: roomName.trim(),
          description: roomDescription.trim() || undefined,
          category: roomCategory.trim() || "General",
          type: "FREE_CHAT",
        }),
      });

      const created = res?.data;
      if (created?.code) {
        setNewlyCreatedRoom({ name: created.name, code: created.code });
      }

      setRoomName('');
      setRoomDescription('');
      setIsCreateRoomOpen(false);
      fetchRooms();
    } catch (err: any) {
      console.error("Failed to create room:", err);
      setCreateRoomError(err.message || "Failed to create room. You may lack permission.");
    }
  };

  const handleAnswerChange = (id: string, value: string) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, answer: value } : q)));
  };

  const handleStatusChange = async (id: string, newStatus: QuestionStatusType) => {
    setIsUpdatingStatus(id);
    // Optimistic UI update
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
    try {
      await apiFetch(`/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Rollback
      fetchQuestions();
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleCategoryChange = async (id: string, newCategory: string) => {
    // Optimistic UI update
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, category: newCategory } : q)));
    try {
      await apiFetch(`/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ category: newCategory }),
      });
    } catch (err) {
      console.error("Failed to update category:", err);
      // Rollback
      fetchQuestions();
    }
  };

  const handleSubmitAnswer = async (id: string) => {
    const q = questions.find((x) => x.id === id);
    if (!q || !(q.answer || '').trim()) return;
    const answerContent = q.answer.trim();
    try {
      await apiFetch("/answers", {
        method: "POST",
        body: JSON.stringify({ content: answerContent, questionId: id }),
      });
      await apiFetch(`/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ANSWERED" }),
      });

      setQuestions((qs) =>
        qs.map((x) => {
          if (x.id !== id) return x;
          const currentAnswers = x.answers || [];
          return {
            ...x,
            status: "ANSWERED",
            answer: '',
            answers: [
              ...currentAnswers,
              { id: 'new', content: answerContent, createdAt: new Date().toISOString() },
            ],
          };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = questions.filter((q) => q.status === 'PENDING').length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;
  const answeredCount = questions.filter((q) => q.status === 'ANSWERED').length;
  const rejectedCount = questions.filter((q) => q.status === 'REJECTED').length;
  const allCount = questions.length;

  const filteredQuestions =
    statusFilter === 'ALL'
      ? questions
      : questions.filter((q) => q.status === statusFilter);

  const navItems = [
    { label: t('staff.questions'), icon: MessageSquare, tab: 'QUESTIONS' },
    { label: t('staff.rooms'), icon: Grid, tab: 'ROOMS' },
    { label: t('staff.staff'), icon: Users, tab: 'STAFF' },
    { label: t('staff.history'), icon: History, tab: 'HISTORY' },
  ];

  const tabs = ['QUESTIONS', 'ROOMS', 'STAFF', 'HISTORY'];

  const filterTabs: { id: 'ALL' | QuestionStatusType; label: string; count: number }[] = [
    { id: 'ALL', label: t('staff.filter.all'), count: allCount },
    { id: 'PENDING', label: t('staff.filter.pending'), count: pendingCount },
    { id: 'APPROVED', label: t('staff.filter.approved'), count: approvedCount },
    { id: 'ANSWERED', label: t('staff.filter.answered'), count: answeredCount },
    { id: 'REJECTED', label: t('staff.filter.rejected'), count: rejectedCount },
  ];

  const getStatusBadge = (status: QuestionStatusType) => {
    switch (status) {
      case "APPROVED":
        return { label: t('staff.badge.approved'), classes: "bg-blue-50 text-blue-700 border border-blue-200" };
      case "ANSWERED":
        return { label: t('staff.badge.answered'), classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      case "REJECTED":
        return { label: t('staff.badge.rejected'), classes: "bg-rose-50 text-rose-700 border border-rose-200" };
      case "PENDING":
      default:
        return { label: t('staff.badge.pending'), classes: "bg-amber-50 text-amber-700 border border-amber-200" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#2D6DB5] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label={t('auth.backToHome')}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold flex-1">{t('signin.title')}</h1>
          <button
            onClick={() => {
              removeAuthToken();
              navigate('/');
            }}
            className="text-white/80 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title={t('staff.signOut')}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t('staff.signOut')}</span>
          </button>
        </div>

        {/* Amharic Psalm */}
        <div className="bg-[#1a4f8a] text-center px-4 py-2">
          <p className="text-white/80 text-xs italic leading-relaxed">
            አቤቱ፥ የሥርዓትህን መንገድ አስተምረኝ፥ ሁልጊዜም እፈልገዋለሁ።
            <br />
            እንዳስተውል አድርገኝ፥ ሕግህንም እፈልጋለሁ፤ በፍጹም ልቤም እጠብቀዋለሁ።
            <br />
            <span className="not-italic font-medium text-white/60">መዝሙረ ዳዊት 119:33,34</span>
          </p>
        </div>

        {/* Tabs - Hidden on mobile, flex on desktop */}
        <nav className="hidden md:flex border-t border-white/20">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'text-white border-b-2 border-[#F5A623]'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              {tab === 'QUESTIONS' ? t('staff.questions') :
               tab === 'ROOMS' ? t('staff.rooms') :
               tab === 'STAFF' ? t('staff.staff') :
               t('staff.history')}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-8 max-w-[1500px] w-full mx-auto">
        {/* TAB 1: QUESTIONS */}
        {activeTab === 'QUESTIONS' && (
          <div>
            {/* Dashboard Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-xl">{t('staff.dash.title')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('staff.dash.desc')}{' '}
                  <span className="font-semibold text-blue-600">{t('staff.dash.descApproved')}</span> {t('staff.dash.descOr')}{' '}
                  <span className="font-semibold text-emerald-600">{t('staff.dash.descAnswered')}</span> {t('staff.dash.descVisible')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchQuestions()}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title={t('staff.refresh')}
                >
                  {t('staff.refresh')}
                </button>
                <button
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#E09612] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm shadow-2xs cursor-pointer"
                >
                  <Plus size={16} />
                  {t('staff.room')}
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => navigate('/superadmin')}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm shadow-2xs cursor-pointer ml-2"
                  >
                    <ShieldCheck size={16} />
                    {t('staff.superadmin')}
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-[#2D6DB5] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Question Cards */}
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-2xs text-gray-400">
                <p className="font-medium text-gray-600">{t('staff.noQuestions')}</p>
                <p className="text-sm mt-1">{t('staff.noQuestionsStatus')} "{tabLabel}".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => {
                  const badge = getStatusBadge(question.status);
                  return (
                    <div
                      key={question.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Status & Category Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.classes}`}>
                            {badge.label}
                          </span>
                          {question.category && (
                            <span className="text-sm font-medium text-gray-500">· {question.category}</span>
                          )}
                        </div>
                        {question.createdAt && (
                          <span className="text-[11px] text-gray-400">
                            {new Date(question.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      {question.title && (
                        <h3 className="font-semibold text-gray-900 text-base mb-1.5">{question.title}</h3>
                      )}

                      {/* Question Content */}
                      <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {question.content}
                      </p>

                      {/* Status Moderation Controls */}
                      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-700">
                            {t('staff.setStatus')}
                          </span>
                          <div className="inline-flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                            {(["PENDING", "APPROVED", "ANSWERED", "REJECTED"] as const).map((st) => {
                              const isActive = question.status === st;
                              let activeClass = "";
                              if (st === "APPROVED") activeClass = "bg-blue-600 text-white shadow-xs";
                              else if (st === "ANSWERED") activeClass = "bg-emerald-600 text-white shadow-xs";
                              else if (st === "REJECTED") activeClass = "bg-rose-600 text-white shadow-xs";
                              else activeClass = "bg-amber-500 text-white shadow-xs";

                              return (
                                <button
                                  key={st}
                                  disabled={isUpdatingStatus === question.id}
                                  onClick={() => handleStatusChange(question.id, st)}
                                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    isActive
                                      ? activeClass
                                      : "text-gray-600 hover:bg-gray-100"
                                  } disabled:opacity-50`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Category Moderation Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-700">
                            {t('staff.setCategory')}
                          </span>
                          <select
                            value={question.category?.toUpperCase() || 'GENERAL'}
                            onChange={(e) => handleCategoryChange(question.id, e.target.value)}
                            className="px-2 py-1 text-xs font-semibold border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-[#2D6DB5] focus:ring-1 focus:ring-[#2D6DB5] cursor-pointer"
                          >
                            <option value="FAITH">FAITH</option>
                            <option value="BIBLE">BIBLE</option>
                            <option value="PRAYER">PRAYER</option>
                            <option value="RELATIONSHIPS">RELATIONSHIPS</option>
                            <option value="STRUGGLES">STRUGGLES</option>
                            <option value="GENERAL">GENERAL</option>
                          </select>
                        </div>
                      </div>

                      {/* Existing Answers if any */}
                      {question.answers && question.answers.length > 0 && (
                        <div className="mb-4 pt-2 border-t border-gray-100">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            {t('staff.existingReplies')} ({question.answers.length})
                          </h4>
                          <div className="space-y-2">
                            {question.answers.map((ans, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/60 text-xs text-gray-700"
                              >
                                <p className="whitespace-pre-wrap leading-relaxed">{ans.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Write Response Box */}
                      <div className="border-t border-gray-100 pt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          {t('staff.writeResponse')}{' '}
                          <span className="font-semibold text-emerald-600">{t('staff.dash.descAnswered')}</span>)
                        </label>
                        <textarea
                          value={question.answer || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder={t('staff.placeholder')}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-800 bg-white"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleSubmitAnswer(question.id)}
                            disabled={!(question.answer || '').trim()}
                            className="bg-[#2D6DB5] hover:bg-[#235892] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors uppercase tracking-wider cursor-pointer shadow-2xs"
                          >
                            {t('staff.submitAnswer')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROOMS */}
        {activeTab === 'ROOMS' && (
          <div>
            {/* Rooms Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-200 pb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                  <DoorOpen className="text-[#2D6DB5]" />
                  {t('staff.rooms.title')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('staff.rooms.desc')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchRooms()}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-none transition-colors cursor-pointer"
                  title={t('staff.refresh')}
                >
                  {t('staff.refresh')}
                </button>
                <button
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#E09612] text-white font-bold px-4 py-2 rounded-none transition-colors text-sm cursor-pointer"
                >
                  <Plus size={16} />
                  {t('staff.createRoom')}
                </button>
              </div>
            </div>

            {/* Rooms List - Horizontal Cards with Sharp Borders & No Shadows */}
            {rooms.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-300 rounded-none text-gray-400">
                <DoorOpen size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">{t('staff.noRooms')}</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {t('staff.noRoomsDesc')}
                </p>
                <button
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#2D6DB5] text-white font-bold text-xs px-4 py-2 rounded-none hover:bg-[#235892] transition-colors cursor-pointer"
                >
                  <Plus size={14} /> {t('staff.createRoom')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white border border-gray-300 rounded-none px-4 py-2.5 sm:px-5 sm:py-3 hover:border-gray-400 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    {/* Left Details Section */}
                    <div className="flex-1 min-w-0 pr-0 lg:pr-4">
                      {/* Meta badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        {room.category && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-2 py-0.2 rounded-none">
                            {room.category}
                          </span>
                        )}
                        {room.staffVerified && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.2 rounded-none flex items-center gap-1">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-none border ${
                            room.isActive
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}
                        >
                          {room.isActive ? t('staff.status.active') : t('staff.status.inactive')}
                        </span>
                        {room.createdAt && (
                          <span className="text-[10px] text-gray-400 ml-1">
                            {t('staff.status.created')} {new Date(room.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Room Title */}
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                        {room.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-500 leading-normal mt-0.5 max-w-4xl line-clamp-1">
                        {room.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Right Horizontal Key & Action Section */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 flex-shrink-0">
                      {/* 6-Digit Room Key Box - Compact & Sharp */}
                      <div className="bg-amber-50/90 border border-amber-300 rounded-none px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <KeyRound size={13} className="text-[#E07B2A]" />
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800 block leading-none mb-0.5">
                              {t('staff.roomKey')}
                            </span>
                            <span className="text-sm font-mono font-bold tracking-wider text-gray-900 leading-none">
                              {room.code || '------'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyKey(room.code)}
                          className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300 rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                          title={t('staff.copyKey')}
                        >
                          {copiedCode === room.code ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-700">{t('staff.copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>{t('staff.copyKey')}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Enter Room Button - Compact & Sharp */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onGoToRoom) onGoToRoom(room);
                          else navigate(`/rooms/${room.id}`);
                        }}
                        className="px-3.5 py-1.5 bg-[#2D6DB5] hover:bg-[#245A94] text-white text-xs font-bold rounded-none transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>{t('staff.enterRoom')}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STAFF */}
        {activeTab === 'STAFF' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
              <Users className="text-[#2D6DB5]" />
              {t('staff.staff.title')}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {t('staff.staff.desc')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <span className="text-xs font-bold text-[#2D6DB5] block mb-1">{t('staff.staff.box1Title')}</span>
                <p className="text-xs text-gray-600">
                  {t('staff.staff.box1Desc')}
                </p>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                <span className="text-xs font-bold text-[#E07B2A] block mb-1">{t('staff.staff.box2Title')}</span>
                <p className="text-xs text-gray-600">
                  {t('staff.staff.box2Desc')}
                </p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                <span className="text-xs font-bold text-emerald-700 block mb-1">{t('staff.staff.box3Title')}</span>
                <p className="text-xs text-gray-600">
                  {t('staff.staff.box3Desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'HISTORY' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                <History className="text-[#2D6DB5]" />
                {t('staff.history.title')}
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                {questions.filter((q) => q.status === 'ANSWERED' || q.status === 'APPROVED').length} {t('staff.history.archived')}
              </span>
            </div>

            <div className="space-y-4">
              {questions
                .filter((q) => q.status === 'ANSWERED' || q.status === 'APPROVED')
                .map((q) => (
                  <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {q.status}
                      </span>
                      {q.createdAt && (
                        <span className="text-[11px] text-gray-400">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{q.title || 'Question'}</h3>
                    <p className="text-xs text-gray-600 mb-3">{q.content}</p>
                    {q.answers && q.answers.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-gray-700">
                        <span className="font-bold text-[#2D6DB5] block mb-1">{t('staff.history.reply')}</span>
                        {q.answers[q.answers.length - 1].content}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating + Button — small screens only */}
      <button
        onClick={() => setIsCreateRoomOpen(true)}
        className="md:hidden fixed bottom-20 right-5 w-12 h-12 bg-[#F5A623] hover:bg-[#E09612] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30"
        aria-label={t('staff.createRoom')}
      >
        <Plus size={24} />
      </button>

      {/* Create Room Modal */}
      {isCreateRoomOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsCreateRoomOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-none border border-gray-400 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md">
            <div className="px-6 pt-5 pb-6">
              <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-3">
                <h2 className="text-lg font-bold text-gray-900">{t('staff.modal.createTitle')}</h2>
                <button
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Room Name */}
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E07B2A] mb-1.5">
                  {t('staff.modal.roomName')}
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={t('staff.modal.namePlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-[#2D6DB5] text-gray-700"
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E07B2A] mb-1.5">
                  {t('staff.modal.category')}
                </label>
                <select
                  value={roomCategory}
                  onChange={(e) => setRoomCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-[#2D6DB5] text-gray-700 bg-white"
                >
                  <option value="Faith & Study">Faith & Study</option>
                  <option value="Campus Life">Campus Life</option>
                  <option value="Relationships & Growth">Relationships & Growth</option>
                  <option value="Theology & Scripture">Theology & Scripture</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E07B2A] mb-1.5">
                  {t('staff.modal.description')}
                </label>
                <textarea
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder={t('staff.modal.descPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none resize-none focus:outline-none focus:border-[#2D6DB5] text-gray-700"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-300 rounded-none mb-4 text-xs text-amber-900 flex items-center gap-2">
                <KeyRound size={16} className="text-[#E07B2A] flex-shrink-0" />
                <span>{t('staff.modal.keyNotice')}</span>
              </div>

              {createRoomError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
                  {createRoomError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
                className="w-full bg-[#2D6DB5] hover:bg-[#245A94] disabled:bg-gray-300 text-white font-bold py-2.5 rounded-none transition-colors tracking-wide uppercase text-xs cursor-pointer"
              >
                {t('staff.modal.createBtn')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Newly Created Room 6-Digit Code Popup */}
      {newlyCreatedRoom && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-gray-400 max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 text-[#E07B2A] rounded-none flex items-center justify-center mx-auto mb-3">
              <KeyRound size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{t('staff.modal.successTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">
              {t('staff.room')}: <strong className="text-gray-800">{newlyCreatedRoom.name}</strong>
            </p>

            <div className="bg-amber-50/90 border border-amber-300 rounded-none p-4 mb-4">
              <span className="text-[11px] uppercase font-bold text-amber-800 tracking-wider block mb-1">
                {t('staff.modal.shareableKey')}
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-gray-900 my-1">
                {newlyCreatedRoom.code}
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {t('staff.modal.joinNotice')}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopyKey(newlyCreatedRoom.code)}
                className="flex-1 bg-[#2D6DB5] hover:bg-[#235892] text-white text-xs font-bold py-2.5 px-4 rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode === newlyCreatedRoom.code ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode === newlyCreatedRoom.code ? t('staff.copied') : t('staff.copyKey')}</span>
              </button>
              <button
                onClick={() => setNewlyCreatedRoom(null)}
                className="py-2.5 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-none border border-gray-300 transition-colors cursor-pointer"
              >
                {t('staff.modal.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation — small screens only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {navItems.map(({ label, icon: Icon, tab }) => (
          <button
            key={label}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors cursor-pointer ${
              activeTab === tab ? 'text-[#2D6DB5]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
