import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext';

export function HotQuestions() {
  const { t } = useLanguage();
  const [hotQuestions, setHotQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/questions?roomId=null')
      .then(res => {
        if (res?.data?.items) {
          const publicQuestions = res.data.items.filter(
            (q: any) => q.status === "APPROVED" || q.status === "ANSWERED"
          );
          setHotQuestions(publicQuestions.slice(0, 5));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="hidden xl:block w-80 bg-white rounded-lg shadow-sm p-6 sticky top-4 h-fit">
      <h2 className="font-bold mb-4 text-lg">{t('hotquestions.title')}</h2>
      
      {loading ? (
        <div className="text-sm text-gray-500">{t('hotquestions.loading')}</div>
      ) : hotQuestions.length === 0 ? (
        <div className="text-sm text-gray-500">{t('hotquestions.empty')}</div>
      ) : (
        <div className="space-y-4">
          {hotQuestions.map((question) => (
            <div key={question.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <button className="text-left hover:text-[#2D6DB5] transition-colors w-full">
                <p className="text-sm font-medium mb-1 line-clamp-2">
                  {question.title || question.content}
                </p>
                <span className="text-xs text-gray-500">{question.category || t('hotquestions.general')}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
