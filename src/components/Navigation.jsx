export default function Navigation({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'player', label: 'Rozwiąż Quiz' },
        { id: 'editor', label: 'Edytuj Zestaw' },
        { id: 'creator', label: 'Stwórz Nowy' }
    ];

    return (
        <nav className="bg-white p-2 rounded-full shadow-sm mb-8 flex gap-2 border border-slate-100">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 ${
                        activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md transform scale-105'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}