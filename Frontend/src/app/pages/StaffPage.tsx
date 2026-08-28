import { useState, useEffect } from 'react';
import { Menu, Search, Plus, MessageSquare, Grid, Users, User, X } from 'lucide-react';
import { apiFetch } from '../api';

interface PendingQuestion {
  id: number;
  category: string;
  title: string;
  preview: string;
  answer: string;
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

  const [questions, setQuestions] = useState<PendingQuestion[]>([]);

  useEffect(() => {
    apiFetch("/questions?status=PENDING")
      .then(res => setQuestions(res?.data?.items || []))
      .catch(console.error);
  }, []);

  const pendingCount = questions?.length || 0;

  const handleAnswerChange = (id: number, value: string) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, answer: value } : q));
  };

  const handleSubmitAnswer = async (id: number) => {
    const q = questions.find(x => x.id === id);
    if (!q || !(q.answer || '').trim()) return;
    try {
      await apiFetch("/answers", { method: "POST", body: JSON.stringify({ content: q.answer, questionId: id }) });
      await apiFetch(`/questions/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ANSWERED" }) });
      setQuestions(qs => qs.filter(x => x.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Questions', icon: MessageSquare },
    { label: 'Rooms', icon: Grid },
    { label: 'Staff', icon: Users },
    { label: 'Profile', icon: User }
  ];

  const tabs = ['QUESTIONS', 'ROOMS', 'STAFF', 'HISTORY'];

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Staff Dashboard</h2>
            <p className="text-xs text-gray-500">Pending moderation: {pendingCount}</p>
          </div>
          <button
            onClick={() => setIsCreateRoomOpen(true)}
            className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#E09612] text-white font-bold px-4 py-2 rounded transition-colors text-sm"
          >
            <Plus size={16} />
            ROOM
          </button>
        </div>

        {/* Question Cards */}
        {questions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">No pending questions to moderate.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {questions.map(question => (
              <div key={question.id} className="bg-white rounded-lg shadow-sm px-6 py-4 mb-4 hover:shadow-md transition-shadow">
                {/* Tags — matches QuestionCard style */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Pending
                  </span>
                  <span className="text-sm text-gray-600">· {question.category}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold mb-1.5">{question.title}</h3>

                {/* Preview */}
                <p className="text-gray-600 text-sm mb-2">{question.preview || (question as any).content}</p>

                {/* Answer Box */}
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Write your response
                  </label>
                  <textarea
                    value={question.answer || ''}
                    onChange={e => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type answer here..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleSubmitAnswer(question.id)}
                      disabled={!(question.answer || '').trim()}
                      className="text-sm font-medium text-[#2D6DB5] hover:underline disabled:text-gray-300 transition-colors uppercase"
                    >
                      Submit Answer
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
