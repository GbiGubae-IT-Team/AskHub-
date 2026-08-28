export function Sidebar() {
  const categories = [
    'Home',
    'Browse categories',
    'Faith',
    'Bible',
    'Prayer',
    'Relationships',
    'Struggles',
    'General'
  ];

  return (
    <aside className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-4 sticky top-4 h-fit">
      <nav>
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category}>
              <button className="w-full text-left px-4 py-2 rounded text-sm hover:bg-gray-100 transition-colors">
                {category}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
