import { useState } from 'react';

interface QuestionCardProps {
  category: string;
  title: string;
  preview: string;
  isAnswered: boolean;
}

export function QuestionCard({ category, title, preview, isAnswered }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TEXT_LIMIT = 150;
  
  const safePreview = preview || '';
  const isLongText = safePreview.length > TEXT_LIMIT;
  const displayText = (isExpanded || !isLongText) ? safePreview : safePreview.slice(0, TEXT_LIMIT).trim() + '...';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-3 py-1 rounded text-xs font-medium ${
          isAnswered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isAnswered ? 'Answered' : 'Pending'}
        </span>
        <span className="text-sm text-gray-600">· {category}</span>
      </div>
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      {safePreview && <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{displayText}</p>}
      
      {isLongText && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#2D6DB5] text-sm font-medium hover:underline"
        >
          {isExpanded ? 'LESS' : 'MORE'}
        </button>
      )}
    </div>
  );
}
