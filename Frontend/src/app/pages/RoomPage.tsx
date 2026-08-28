import { useState, useEffect } from 'react';
import { Menu, Search, MessageSquare, Grid, Users, User, Users2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../api';

interface Discussion {
  id: number;
  author: string;
  timeAgo: string;
  isAnswered: boolean;
  title: string;
  preview: string;
}

interface RoomPageProps {
  onBack?: () => void;
}

const DISCUSSIONS: Discussion[] = [
  {
    id: 1,
    author: 'Anonymous',
    timeAgo: '2 hours ago',
    isAnswered: true,
    title: 'How can we balance academic pressure with daily prayer habits?',
    preview: "I've been struggling lately to find enough time for consistent reflection during the exam season. Does anyone have specific routines that work well for them during high-stress..."
  },
  {
    id: 2,
    author: 'Anonymous',
    timeAgo: '5 hours ago',
    isAnswered: false,
    title: 'Understanding the role of modern science in scriptural interpretation',
    preview: "I was reading a paper on biology and it made me wonder how we should approach ancient texts when they seem to conflict with modern discoveries. Are there..."
  },
  {
    id: 3,
    author: 'Anonymous',
    timeAgo: '1 day ago',
    isAnswered: true,
    title: 'What does spiritual growth look like in everyday life?',
    preview: "I feel like spiritual growth is talked about a lot but I rarely see practical examples. How do you personally measure or notice growth in your own walk..."
  },
  {
    id: 4,
    author: 'Anonymous',
    timeAgo: '2 days ago',
    isAnswered: false,
    title: 'Is it okay to feel angry at God during hard times?',
    preview: "I went through a really difficult season recently and I found myself feeling genuinely angry. I wasn't sure if that was a sign of weak faith or something..."
  }
];

export function RoomPage({ onBack }: RoomPageProps) {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState('Rooms');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    apiFetch("/questions")
      .then(res => setDiscussions(res.data.items))
      .catch(console.error);
  }, []);

  const navItems = [
    { label: 'Questions', icon: MessageSquare },
    { label: 'Rooms', icon: Grid },
    { label: 'Staff', icon: Users },
    { label: 'Profile', icon: User }
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !question.trim()) return;
    try {
      await apiFetch("/questions", { method: "POST", body: JSON.stringify({ title: subject, content: question, isAnonymous: true }) });
    } catch(err) {
      console.error(err);
    }
    setSubject('');
    setQuestion('');
  };

  const AskForm = () => (
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
        disabled={!subject.trim() || !question.trim()}
        className="w-full bg-[#F5A623] hover:bg-[#E09612] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-wide text-sm"
      >
        Submit Question
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
        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
          The Path to Spiritual Growth
        </h2>
        <p className="text-white/85 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-5">
          A space for students to discuss faith, challenges, and growth in a supportive community.
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
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#2D6DB5] text-base">Active Discussions</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                {discussions.length} Active
              </span>
            </div>

            {/* Discussion cards */}
            <div className="space-y-4">
              {discussions.map(d => (
                <div key={d.id} className="bg-white rounded-lg shadow-sm px-6 py-4 hover:shadow-md transition-shadow">
                  {/* Meta row */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-[#2D6DB5]">{d.author}</span>
                      <span className="text-xs text-gray-400 ml-2">{d.timeAgo}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                      d.status === "ANSWERED"
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {d.status === "ANSWERED" ? 'Answered' : 'Unanswered'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-gray-900 mb-1.5 leading-snug">{d.title}</h4>

                  {/* Preview */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{d.content}</p>

                  <button className="text-[#2D6DB5] text-sm font-medium hover:underline">
                    MORE ›
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar — desktop only */}
          <aside className="hidden md:flex flex-col gap-4 w-72 flex-shrink-0 sticky top-4">
            {/* About this Room */}
            <div className="bg-[#2D6DB5] rounded-lg p-5 text-white">
              <h3 className="font-bold text-base mb-2">About this Room</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Moderated by our Staff Chaplains, this room is dedicated to open, honest dialogue about the intersection of student life and faith.
              </p>
              <div className="flex items-center gap-4 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <Users2 size={14} />
                  128 Students
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Staff Verified
                </span>
              </div>
            </div>

            {/* Ask a Question */}
            <AskForm />
          </aside>
        </div>

        {/* Mobile-only sidebar content — below discussions */}
        <div className="md:hidden mt-6 space-y-4">
          {/* About this Room */}
          <div className="bg-[#2D6DB5] rounded-lg p-5 text-white">
            <h3 className="font-bold text-base mb-2">About this Room</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              Moderated by our Staff Chaplains, this room is dedicated to open, honest dialogue about the intersection of student life and faith.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <Users2 size={14} />
                128 Students
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Staff Verified
              </span>
            </div>
          </div>

          <AskForm />
        </div>
      </div>

      {/* Bottom Navigation — small screens only */}
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
