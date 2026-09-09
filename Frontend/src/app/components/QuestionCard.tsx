import { useState } from 'react';
import { ChevronDown, CornerDownRight, MessageSquareReply } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface QuestionCardProps {
  category: string;
  title: string;
  preview: string;
  isAnswered: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "ANSWERED";
  answers?: { content: string; createdAt: string }[];
}

export function QuestionCard({ category, title, preview, isAnswered, status, answers }: QuestionCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const TEXT_LIMIT = 150;
  
  const safePreview = preview || '';
  const isLongText = safePreview.length > TEXT_LIMIT;
  const displayText = (isExpanded || !isLongText) ? safePreview : safePreview.slice(0, TEXT_LIMIT).trim() + '...';
  const hasAnswers = Boolean(answers && answers.length > 0);

  const getStatusBadge = () => {
    const effectiveStatus = status || (isAnswered ? "ANSWERED" : "PENDING");
    switch (effectiveStatus) {
      case "ANSWERED":
        return { label: t('question.status.answered'), classes: "bg-emerald-50 text-emerald-700 border border-emerald-200/60" };
      case "APPROVED":
        return { label: t('question.status.approved'), classes: "bg-blue-50 text-blue-700 border border-blue-200/60" };
      case "REJECTED":
        return { label: t('question.status.rejected'), classes: "bg-rose-50 text-rose-700 border border-rose-200/60" };
      case "PENDING":
      default:
        return { label: t('question.status.pending'), classes: "bg-amber-50 text-amber-700 border border-amber-200/60" };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 mb-4 hover:shadow-md transition-all duration-200">
      {/* Category & Status Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge.classes}`}>
          {statusBadge.label}
        </span>
        {category && category.trim().length > 0 && (
          <span className="text-sm font-medium text-gray-500">· {category}</span>
        )}
      </div>

      {/* Question Title & Content */}
      {title && <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{title}</h3>}
      {safePreview && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {displayText}
        </p>
      )}
      
      {/* Actions Row */}
      <div className="flex items-center gap-4">
        {isLongText && (
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#2D6DB5] text-sm font-semibold hover:text-[#1e4d82] hover:underline cursor-pointer transition-colors"
          >
            {isExpanded ? t('question.less') : t('question.more')}
          </button>
        )}

        {hasAnswers && (
          <button 
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-[#2D6DB5] text-sm font-semibold hover:text-[#1e4d82] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{showAnswer ? t('question.hideAnswer') : t('question.answer')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAnswer ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Expandable Answers Section */}
      {showAnswer && hasAnswers && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D6DB5] bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200/60 shadow-2xs">
              <CornerDownRight className="w-3.5 h-3.5 text-[#2D6DB5]" />
              <span>{t('question.reply')}</span>
            </div>
            <div className="h-px bg-gradient-to-r from-blue-200/80 to-transparent flex-1" />
          </div>

          <div className="relative space-y-4">
            <div className="absolute left-[7px] -top-3 h-3 w-[2px] bg-blue-300/80" />
            {answers!.map((ans, idx) => {
              const isLast = idx === answers!.length - 1;
              return (
                <div key={idx} className="relative pl-8">
                  {!isLast && (
                    <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-blue-300/80" />
                  )}
                  <svg className="absolute left-[3px] top-0 w-8 h-6 pointer-events-none" viewBox="0 0 32 24" fill="none">
                    <path d="M 4 0 L 4 10 C 4 14 7 16 11 16 L 27 16" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 22 12 L 26 16 L 22 20" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="bg-gradient-to-br from-blue-50/70 via-slate-50/50 to-blue-50/30 rounded-xl p-4 border border-blue-100/90 shadow-2xs hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#2D6DB5] flex items-center gap-1.5">
                        <MessageSquareReply className="w-3.5 h-3.5" />
                        {t('question.reply')}
                      </span>
                      {ans.createdAt && (
                        <span className="text-[11px] text-gray-400 font-medium">
                          {new Date(ans.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{ans.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
