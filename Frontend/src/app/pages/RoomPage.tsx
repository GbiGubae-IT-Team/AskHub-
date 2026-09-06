import { useState, useEffect } from 'react';
import { Menu, Search, MessageSquare, Grid, Users, User, Users2, ShieldCheck, Send } from 'lucide-react';
import { apiFetch, getAuthToken } from '../api';

interface RoomPageProps {
  onBack?: () => void;
  activeRoom?: {
    id: string | number;
    name: string;
    description?: string | null;
    category?: string | null;
    code?: string | null;
    staffVerified?: boolean;
    members?: number;
  } | null;
}

export function RoomPage({ onBack, activeRoom }: RoomPageProps) {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState('Rooms');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const token = getAuthToken();
  let isStaff = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isStaff = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(payload.role);
    } catch (e) {
      console.error("Failed to parse token", e);
    }
  }

  const fetchQuestions = () => {
    if (!activeRoom?.id) return;
    apiFetch(`/questions?roomId=${activeRoom.id}`)
      .then(res => setDiscussions(res?.data?.items || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchQuestions();
  }, [activeRoom?.id]);

  const navItems = [
    { label: 'Questions', icon: MessageSquare },
    { label: 'Rooms', icon: Grid },
    { label: 'Staff', icon: Users },
    { label: 'Profile', icon: User }
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !question.trim() || !activeRoom?.id) return;
    try {
      setIsSubmitting(true);
      const res = await apiFetch("/questions", { 
        method: "POST", 
        body: JSON.stringify({ 
          title: subject, 
          content: question, 
          isAnonymous: true,
          roomId: activeRoom.id
        }) 
      });
      setSubject('');
      setQuestion('');
      
      if (res?.data) {
        setDiscussions(prev => [res.data, ...prev]);
      } else {
        fetchQuestions();
      }
    } catch(err: any) {
      alert(err.message || "Failed to submit question. Please log in.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (questionId: string) => {
    const content = replyInputs[questionId];
    if (!content?.trim()) return;
    
    try {
      await apiFetch("/answers", {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), questionId }),
      });
      await apiFetch(`/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ANSWERED" }),
      });
      
      setReplyInputs(prev => ({ ...prev, [questionId]: '' }));
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || "Failed to submit reply.");
    }
  };

  const renderRoomInfo = () => (
    <div className="bg-[#2D6DB5] rounded-lg p-5 text-white">
      <h3 className="font-bold text-base mb-2">About this Room</h3>
      <p className="text-white/80 text-sm leading-relaxed mb-4">
        {activeRoom?.description || 'This room is a space for open dialogue. Feel free to ask questions and share your thoughts with the community.'}
      </p>
      <div className="flex items-center gap-4 text-xs text-white/70">
        <span className="flex items-center gap-1.5">
          <Users2 size={14} />
          {activeRoom?.members || 1} Students
        </span>
        {(activeRoom?.staffVerified ?? true) && (
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Staff Verified
          </span>
        )}
      </div>
    </div>
  );

  const renderAskForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-[#2D6DB5]" />
        <h3 className="font-bold text-gray-900">Ask a Question</h3>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-[#E07B2A] mb-1.5">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Briefly state your topic..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#E07B2A] mb-1.5">Your Question</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Share your thoughts or ask for guidance..."
          rows={5}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!subject.trim() || !question.trim() || isSubmitting}
        className="w-full bg-[#F5A623] hover:bg-[#E09612] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-wide text-sm flex items-center justify-center gap-2"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Question'}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">
        Your post will be visible to all members of this room.
      </p>
    </div>
  );

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
          <button onClick={() => setIsDrawerOpen(false)} className="text-white p-1 text-xl font-bold">✕</button>
        </div>
        {onBack && (
          <div className="p-4 border-t border-white/20 mt-auto">
            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Room Banner */}
      <section className="bg-[#2D6DB5] px-6 py-10 text-center text-white">
        {activeRoom?.category && (
          <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {activeRoom.category}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
          {activeRoom?.name || 'The Path to Spiritual Growth'}
        </h2>
        <p className="text-white/85 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-5">
          {activeRoom?.description || 'A space for students to discuss faith, challenges, and growth in a supportive community.'}
        </p>
        <p className="text-white/60 text-xs md:text-sm italic max-w-lg mx-auto leading-relaxed font-light">
          የሰነፍ መንገድ በዓይኑ የቀናች ናት፤ ጠቢብ ግን ምክርን ይሰማል።
          <br />
          <span className="not-italic">መጽሐፈ ምሳሌ 12 ፥ 15</span>
        </p>
      </section>

      {/* Body */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-10 py-6 pb-24 md:pb-8">
        <div className="flex gap-6 items-start">

          {/* Left — Active Discussions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#2D6DB5] text-base">Active Discussions</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                {discussions.length} Active
              </span>
            </div>

            <div className="space-y-4">
              {discussions.length === 0 ? (
                 <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-400">
                    No discussions found in this room yet. Be the first to ask!
                 </div>
              ) : discussions.map(d => (
                <div key={d.id} className="bg-white rounded-lg shadow-sm px-6 py-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-[#2D6DB5]">
                        {typeof d.author === 'object' ? (d.author?.anonymousId || d.author?.name || 'Anonymous') : (d.author || 'Anonymous')}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {d.timeAgo || (d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded uppercase tracking-wider ${
                      d.status === "ANSWERED"
                        ? 'bg-green-100 text-green-700'
                        : d.status === "APPROVED" 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 mb-1.5 leading-snug">{d.title || 'Discussion'}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-wrap">{d.content}</p>

                  {d.answers && d.answers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {d.answers.map((ans: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border border-gray-100 rounded-md p-3 text-sm text-gray-700">
                          <span className="font-bold text-[#2D6DB5] block mb-1 text-xs">Official Reply:</span>
                          <p className="whitespace-pre-wrap leading-relaxed">{ans.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {isStaff && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-end gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={replyInputs[d.id] || ''}
                          onChange={(e) => setReplyInputs(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Write an official reply..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] text-gray-700"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleReplySubmit(d.id);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleReplySubmit(d.id)}
                        disabled={!replyInputs[d.id]?.trim()}
                        className="bg-[#2D6DB5] hover:bg-[#235892] disabled:bg-gray-300 text-white px-3 py-2 rounded-md transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden md:flex flex-col gap-4 w-72 flex-shrink-0 sticky top-4">
            {renderRoomInfo()}
            {renderAskForm()}
          </aside>
        </div>

        <div className="md:hidden mt-6 space-y-4">
          {renderRoomInfo()}
          {renderAskForm()}
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveNav(label)}
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
