import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  MessageSquare,
  Users2,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { apiFetch, getAuthToken } from '../api';
import { useLanguage } from '../context/LanguageContext';

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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<any>(activeRoom || null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isReplyingId, setIsReplyingId] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  useEffect(() => {
    if (activeRoom) {
      setRoom(activeRoom);
    } else if (roomId) {
      apiFetch(`/rooms/${roomId}`)
        .then((res) => {
          if (res?.data) setRoom(res.data);
        })
        .catch(console.error);
    }
  }, [activeRoom, roomId]);

  const currentRoomId = room?.id || roomId;

  const fetchQuestions = () => {
    if (!currentRoomId) return;
    apiFetch(`/questions?roomId=${currentRoomId}`)
      .then((res) => setDiscussions(res?.data?.items || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentRoomId]);

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



  const handleSubmit = async () => {
    if (!subject.trim() || !question.trim() || !currentRoomId) return;
    try {
      setIsSubmitting(true);
      const res = await apiFetch("/questions", { 
        method: "POST", 
        body: JSON.stringify({ 
          title: subject, 
          content: question, 
          isAnonymous: true,
          roomId: currentRoomId
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
      alert(err.message || t('rooms.err.submit'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (questionId: string) => {
    const content = replyInputs[questionId];
    if (!content?.trim() || isReplyingId) return;
    setIsReplyingId(questionId);
    
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
      alert(err.message || t('rooms.err.reply'));
    } finally {
      setIsReplyingId(null);
    }
  };

  const renderRoomInfo = () => (
    <div className="bg-[#2D6DB5] rounded-lg p-5 text-white">
      <h3 className="font-bold text-base mb-2">{t('rooms.aboutTitle')}</h3>
      <p className="text-white/80 text-sm leading-relaxed mb-4">
        {room?.description || t('rooms.aboutDesc')}
      </p>
      <div className="flex items-center gap-4 text-xs text-white/70">
        <span className="flex items-center gap-1.5">
          <Users2 size={14} />
          {room?.members || 1} {t('rooms.students')}
        </span>
        {(room?.staffVerified ?? true) && (
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            {t('rooms.staffVerified')}
          </span>
        )}
      </div>
    </div>
  );

  const renderAskForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-[#2D6DB5]" />
        <h3 className="font-bold text-gray-900">{t('rooms.askTitle')}</h3>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-[#E07B2A] mb-1.5">{t('rooms.subject')}</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder={t('rooms.subjectPlaceholder')}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#E07B2A] mb-1.5">{t('rooms.yourQuestion')}</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={t('rooms.questionPlaceholder')}
          rows={5}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] focus:border-transparent text-gray-700"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!subject.trim() || !question.trim() || isSubmitting}
        className="w-full bg-[#F5A623] hover:bg-[#E09612] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-wide text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSubmitting ? t('rooms.submitting') : t('rooms.submitQuestion')}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">
        {t('rooms.visibleHint')}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#2D6DB5] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold flex-1">GIBI-GUBAE</h1>
        </div>
      </header>

      {/* Room Banner */}
      <section className="bg-[#2D6DB5] px-6 py-10 text-center text-white">
        {room?.category && (
          <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {room.category}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
          {room?.name || t('rooms.defaultName')}
        </h2>
        <p className="text-white/85 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-5">
          {room?.description || t('rooms.defaultDesc')}
        </p>
        <p className="text-white/60 text-xs md:text-sm italic max-w-lg mx-auto leading-relaxed font-light">
          {t('rooms.verse').split('መጽሐፈ')[0]}
          <br />
          <span className="not-italic">መጽሐፈ{t('rooms.verse').split('መጽሐፈ')[1]}</span>
        </p>
      </section>

      {/* Body */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-8">
        <div className="flex gap-6 items-start">

          {/* Left — Active Discussions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#2D6DB5] text-base">{t('rooms.activeTitle')}</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                {discussions.length} {t('rooms.activeBadge')}
              </span>
            </div>

            <div className="space-y-4">
              {discussions.length === 0 ? (
                 <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-400">
                    {t('rooms.empty')}
                 </div>
              ) : discussions.map(d => (
                <div key={d.id} className="bg-white rounded-lg shadow-sm px-6 py-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-[#2D6DB5]">
                        {typeof d.author === 'object' ? (d.author?.anonymousId || d.author?.name || t('rooms.anonymous')) : (d.author || t('rooms.anonymous'))}
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
                      {d.status === "ANSWERED" ? t('rooms.status.answered') : d.status === "APPROVED" ? t('rooms.status.approved') : t('rooms.status.pending')}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 mb-1.5 leading-snug">{d.title || t('rooms.discussion')}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-wrap">{d.content}</p>

                  {d.answers && d.answers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {d.answers.map((ans: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border border-gray-100 rounded-md p-3 text-sm text-gray-700">
                          <span className="font-bold text-[#2D6DB5] block mb-1 text-xs">{t('rooms.officialReply')}</span>
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
                          placeholder={t('rooms.replyPlaceholder')}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6DB5] text-gray-700"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleReplySubmit(d.id);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleReplySubmit(d.id)}
                        disabled={!replyInputs[d.id]?.trim() || isReplyingId === d.id}
                        className="bg-[#2D6DB5] hover:bg-[#235892] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold p-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <Send size={18} />
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
    </div>
  );
}

