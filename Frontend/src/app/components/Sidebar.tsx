import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { getTodaysMezmur } from '../utils/ethiopianCalendar';
import { getSaintImageUrl } from '../utils/saintImages';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate today's Ethiopian date and corresponding mezmur once per render
  const { ethDate, mezmur } = useMemo(() => getTodaysMezmur(), []);

  const imageUrl = getSaintImageUrl(mezmur.picture);

  // Combine all lines for expanded view, or pick the first line for collapsed view
  const allLines = mezmur.song.flatMap(verse => verse.lines);
  const previewText = allLines.length > 0 ? allLines[0] : '';
  const fullText = allLines.join('\n\n');

  return (
    <aside className="block w-full lg:w-72 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:sticky top-4 h-fit transition-all duration-300 hover:shadow-md">
      {/* Date Header */}
      <div className="bg-[#1a4f8a] text-white px-4 py-3 flex items-center justify-center gap-2">
        <Calendar size={18} className="text-[#F5A623]" />
        <span className="font-bold text-sm tracking-wide">{ethDate.formatted}</span>
      </div>

      <div className="flex flex-col items-center p-4">
        {/* Saint Commemoration */}
        <div className="mb-4 text-center">
          <h2 className="text-lg font-extrabold text-[#2D6DB5]">{mezmur.saint}</h2>
        </div>

        {/* Saint Image */}
        {imageUrl ? (
          <div className="relative w-full aspect-square mb-5 rounded-lg overflow-hidden shadow-sm group">
            <img 
              src={imageUrl} 
              alt={mezmur.saint} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full aspect-square mb-5 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
            No Image Available
          </div>
        )}

        {/* Song Title */}
        <h3 className="font-bold text-center mb-3 text-gray-800 leading-tight">
          {mezmur.title}
        </h3>
        
        {/* Lyrics Container */}
        <div 
          className={`text-sm text-gray-700 w-full whitespace-pre-wrap text-center bg-gray-50 border border-gray-100 rounded-lg p-3 transition-all duration-300 ${
            isExpanded ? 'max-h-[500px] overflow-y-auto' : 'max-h-24 overflow-hidden'
          }`}
        >
          {isExpanded ? fullText : previewText}
        </div>

        {/* Toggle Button */}
        {allLines.length > 1 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-[#2D6DB5] text-sm font-bold hover:text-[#1a4f8a] hover:underline w-full text-center py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D6DB5]/20 active:scale-95"
          >
            {isExpanded ? 'LESS' : 'MORE'}
          </button>
        )}
      </div>
    </aside>
  );
}
