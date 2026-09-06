import { useState, useEffect } from 'react';
import { Menu, Search, Plus, MessageSquare, Grid, Users, User, X } from 'lucide-react';
import { apiFetch } from '../api';

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

interface StaffPageProps {
  onBack?: () => void;
  onGoToRoom?: () => void;
}

export function StaffPage({ onBack, onGoToRoom }: StaffPageProps) {
  const [activeTab, setActiveTab] = useState('QUESTIONS');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Questions');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuestionStatusType>('ALL');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const [questions, setQuestions] = useState<StaffQuestion[]>([]);

  const fetchQuestions = async () => {
    try {
      const res = await apiFetch("/questions");
      setQuestions(res?.data?.items || []);
    } catch(err) {
      console.error("Failed to load questions:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      await apiFetch("/rooms", { method: "POST", body: JSON.stringify({ name: roomName, description: roomDescription, type: "FREE_CHAT" }) });
    } catch(err) {
      console.error(err);
    }
    setRoomName('');
    setRoomDescription('');
    setIsCreateRoomOpen(false);
  };

  const handleAnswerChange = (id: string, value: string) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, answer: value } : q));
  };

  const handleStatusChange = async (id: string, newStatus: QuestionStatusType) => {
    setIsUpdatingStatus(id);
    // Optimistic UI update
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, status: newStatus } : q));
    try {
      await apiFetch(`/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
    } catch(err) {
      console.error("Failed to update status:", err);
      // Rollback by refetching
      fetchQuestions();
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleSubmitAnswer = async (id: string) => {
    const q = questions.find(x => x.id === id);
    if (!q || !(q.answer || '').trim()) return;
    const answerContent = q.answer.trim();
    try {
      await apiFetch("/answers", { method: "POST", body: JSON.stringify({ content: answerContent, questionId: id }) });
      await apiFetch(`/questions/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ANSWERED" }) });
      
      setQuestions(qs => qs.map(x => {
        if (x.id !== id) return x;
        const currentAnswers = x.answers || [];
        return {
          ...x,
          status: "ANSWERED",
          answer: '',
          answers: [...currentAnswers, { id: 'new', content: answerContent, createdAt: new Date().toISOString() }]
        };
      }));
    } catch(err) {
      console.error(err);
    }
  };

  const pendingCount = questions.filter(q => q.status === 'PENDING').length;
  const approvedCount = questions.filter(q => q.status === 'APPROVED').length;
  const answeredCount = questions.filter(q => q.status === 'ANSWERED').length;
  const rejectedCount = questions.filter(q => q.status === 'REJECTED').length;
  const allCount = questions.length;

  const filteredQuestions = statusFilter === 'ALL'
    ? questions
    : questions.filter(q => q.status === statusFilter);

  const navItems = [
    { label: 'Questions', icon: MessageSquare },
    { label: 'Rooms', icon: Grid },
    { label: 'Staff', icon: Users },
    { label: 'Profile', icon: User }
  ];

  const tabs = ['QUESTIONS', 'ROOMS', 'STAFF', 'HISTORY'];

  const filterTabs: { id: 'ALL' | QuestionStatusType; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: allCount },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'APPROVED', label: 'Approved', count: approvedCount },
    { id: 'ANSWERED', label: 'Answered', count: answeredCount },
    { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
  ];

  const getStatusBadge = (status: QuestionStatusType) => {
    switch (status) {
      case "APPROVED":
        return { label: "Approved (Public)", classes: "bg-blue-50 text-blue-700 border border-blue-200" };
      case "ANSWERED":
        return { label: "Answered (Public)", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      case "REJECTED":
        return { label: "Rejected (Hidden)", classes: "bg-rose-50 text-rose-700 border border-rose-200" };
      case "PENDING":
      default:
        return { label: "Pending Moderation", classes: "bg-amber-50 text-amber-700 border border-amber-200" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#2D6DB5] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="text-white p-1"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-white text-xl font-bold flex-1">GIBI-GUBAE</h1>
          <button className="text-white p-1" aria-label="Search">
            <Search size={22} />
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

        {/* Tabs */}
        <nav className="flex border-t border-white/20">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'ROOMS') onGoToRoom?.(); }}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-[#F5A623]'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#2D6DB5] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-white font-bold">Menu</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="text-white p-1">
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>
        <nav className="py-2 flex-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setIsDrawerOpen(false); }}
              className={`w-full text-left px-6 py-4 transition-colors ${
                activeTab === tab
                  ? 'bg-white/20 text-white font-medium border-l-4 border-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        {onBack && (
          <div className="p-4 border-t border-white/20">
            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-10 lg:px-20 py-4 pb-24 md:pb-6 max-w-5xl mx-auto w-full">
        {/* Dashboard Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-xl">Staff Moderation Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Decide question visibility and write answers. Questions with <span className="font-semibold text-blue-600">APPROVED</span> or <span className="font-semibold text-emerald-600">ANSWERED</span> are visible to the public.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchQuestions()}
              className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-2xs transition-colors"
              title="Refresh questions"
            >
              Refresh
            </button>
            <button
              onClick={() => setIsCreateRoomOpen(true)}
              className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#E09612] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm shadow-2xs"
            >
              <Plus size={16} />
              ROOM
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {filterTabs.map(tab => (
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
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Question Cards */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-2xs text-gray-400">
            <p className="font-medium text-gray-600">No questions found</p>
            <p className="text-sm mt-1">There are no questions with status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map(question => {
              const badge = getStatusBadge(question.status);
              return (
                <div key={question.id} className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow">
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
                          year: 'numeric'
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
                        Set Question Status:
                      </span>
                      <div className="inline-flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                        {(["PENDING", "APPROVED", "ANSWERED", "REJECTED"] as const).map(st => {
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
                  </div>

                  {/* Existing Answers if any */}
                  {question.answers && question.answers.length > 0 && (
                    <div className="mb-4 pt-2 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Existing Replies ({question.answers.length})
                      </h4>
                      <div className="space-y-2">
                        {question.answers.map((ans, idx) => (
                          <div key={idx} className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/60 text-xs text-gray-700">
                            <p className="whitespace-pre-wrap leading-relaxed">{ans.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Write Response Box */}
                  <div className="border-t border-gray-100 pt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Write response (submitting automatically marks status as <span className="font-semibold text-emerald-600">ANSWERED</span>)
                    </label>
                    <textarea
                      value={question.answer || ''}
                      onChange={e => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Type your official answer here..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-800 bg-white"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={!(question.answer || '').trim()}
                        className="bg-[#2D6DB5] hover:bg-[#235892] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors uppercase tracking-wider cursor-pointer shadow-2xs"
                      >
                        Submit Answer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating + Button — small screens only */}
      <button
        onClick={() => setIsCreateRoomOpen(true)}
        className="md:hidden fixed bottom-20 right-5 w-12 h-12 bg-[#F5A623] hover:bg-[#E09612] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30"
        aria-label="Create room"
      >
        <Plus size={24} />
      </button>

      {/* Create Room Modal */}
      {isCreateRoomOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsCreateRoomOpen(false)}
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:rounded-2xl">
            {/* Handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-6 pt-4 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Create Discussion Room</h2>
                <button
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Room Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#E07B2A] mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g., Weekly Bible Study"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#E07B2A] mb-1.5">
                  Description
                </label>
                <textarea
                  value={roomDescription}
                  onChange={e => setRoomDescription(e.target.value)}
                  placeholder="What will this room focus on?"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
                className="w-full bg-[#2D6DB5] hover:bg-[#245A94] disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors tracking-wide uppercase text-sm"
              >
                Create Room
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation — small screens only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => {
              setActiveNav(label);
              if (label === 'Rooms') onGoToRoom?.();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              activeNav === label ? 'text-[#2D6DB5]' : 'text-gray-400 hover:text-gray-600'
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
