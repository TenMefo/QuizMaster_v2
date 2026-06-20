import { useState } from 'react';
import Navigation from './components/Navigation';
import Player from './components/Player';
import Creator from './components/Creator';
import Editor from './components/Editor';

export default function App() {
  const [activeTab, setActiveTab] = useState('player');

  return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans flex flex-col items-center">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="w-full max-w-3xl bg-white p-6 md:p-10 rounded-3xl shadow-xl transition-all duration-300">
          {activeTab === 'player' && <Player />}
          {activeTab === 'editor' && <Editor />}
          {activeTab === 'creator' && <Creator />}
        </main>
      </div>
  );
}