interface QuestionCardProps {
  category: string;
  title: string;
  preview: string;
  isAnswered: boolean;
}

export function QuestionCard({ category, title, preview, isAnswered }: QuestionCardProps) {
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
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-3">{preview}</p>
      <button className="text-[#2D6DB5] text-sm font-medium hover:underline">
        MORE
      </button>
    </div>
  );
}
