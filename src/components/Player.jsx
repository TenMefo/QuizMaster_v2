import { useState } from 'react';
import JSZip from 'jszip';

export default function Player() {
    const [quizState, setQuizState] = useState('menu'); // 'menu', 'playing', 'results'
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.zip')) return alert("Wybierz plik .zip!");

        const zip = new JSZip();
        try {
            const unzipped = await zip.loadAsync(file);
            const json = await unzipped.file("data.json").async("string");
            const parsedData = JSON.parse(json);
            // Tutaj w przyszłości możesz dodać logikę rozpakowywania zdjęć z zipa do URL.createObjectURL

            setQuestions(parsedData);
            setQuizState('playing');
            setCurrentIndex(0);
            setScore(0);
        } catch (err) {
            alert("Błąd odczytu paczki ZIP.");
        }
    };

    const handleAnswer = (isCorrect) => {
        if (isCorrect) setScore(s => s + 1);
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(i => i + 1);
        } else {
            setQuizState('results');
        }
    };

    if (quizState === 'menu') {
        return (
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-blue-600">Twoja Biblioteka</h1>
                <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 p-10 rounded-2xl hover:bg-blue-50 transition-colors">
                    <p className="text-slate-500 mb-4 font-medium">Wgraj plik ZIP, aby zagrać</p>
                    <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                </div>
            </div>
        );
    }

    if (quizState === 'playing') {
        const currentQ = questions[currentIndex];
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between text-sm font-semibold text-slate-400">
                    <span>Pytanie {currentIndex + 1} z {questions.length}</span>
                    <button onClick={() => setQuizState('menu')} className="hover:text-red-500 transition">Wyjdź</button>
                </div>

                <h2 className="text-2xl font-bold text-slate-800">{currentQ.question}</h2>

                <div className="space-y-3">
                    {currentQ.answers.map((ans, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(ans.correct)}
                            className="w-full text-left p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 transition-all active:scale-[0.98]"
                        >
                            {ans.text}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-bold text-slate-800">Koniec Quizu!</h2>
            <div className="text-7xl font-black text-blue-600 my-8">
                {score} <span className="text-3xl text-slate-400">/ {questions.length}</span>
            </div>
            <button
                onClick={() => setQuizState('menu')}
                className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-700 transition-colors"
            >
                Wróć do menu
            </button>
        </div>
    );
}