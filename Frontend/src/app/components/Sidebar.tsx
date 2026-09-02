import { useState } from 'react';
import { mezmur } from '../../../Saints/mezmur';
import saintImage from '../../../Saints/1 Lideta Mariam – Birth of St. Mary.jpg';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-4 sticky top-4 h-fit">
      <div className="flex flex-col items-center">
        <img 
          src={saintImage} 
          alt="Lideta Mariam" 
          className="w-full h-auto rounded-lg mb-4 shadow-sm object-cover"
        />
        <h3 className="font-bold text-center mb-3 text-gray-800 leading-tight">
          {mezmur.title}
        </h3>
        
        <div className="text-sm text-gray-700 w-full whitespace-pre-wrap text-center bg-gray-50 rounded-lg p-3">
          {isExpanded 
            ? mezmur.song[0].lines.join('\n\n') 
            : mezmur.song[0].lines[0]}
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-[#2D6DB5] text-sm font-medium hover:underline w-full text-center py-1"
        >
          {isExpanded ? 'LESS' : 'MORE'}
        </button>
      </div>
    </aside>
  );
}
