interface HotQuestion {
  title: string;
  category: string;
}

export function HotQuestions() {
  const hotQuestions: HotQuestion[] = [
    { title: 'How do I strengthen my faith during difficult times?', category: 'Faith' },
    { title: 'What does the Bible say about forgiveness?', category: 'Bible' },
    { title: 'How should I pray when I feel distant from God?', category: 'Prayer' },
    { title: 'How to handle conflicts in relationships?', category: 'Relationships' },
    { title: 'Dealing with anxiety and worry', category: 'Struggles' }
  ];

  return (
    <aside className="hidden xl:block w-80 bg-white rounded-lg shadow-sm p-6 sticky top-4 h-fit">
      <h2 className="font-bold mb-4 text-lg">Hot Questions</h2>
      <div className="space-y-4">
        {hotQuestions.map((question, index) => (
          <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <button className="text-left hover:text-[#2D6DB5] transition-colors">
              <p className="text-sm font-medium mb-1">{question.title}</p>
              <span className="text-xs text-gray-500">{question.category}</span>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
