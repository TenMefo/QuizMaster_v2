import { useState } from 'react';
import JSZip from 'jszip';

// --- ALGORYTMY TOLERANCJI BŁĘDÓW (LEVENSHTEIN) ---
const getEditDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const isAnswerCloseEnough = (user, correct) => {
    const u = user.toLowerCase().trim();
    const c = correct.toLowerCase().trim();
    if (u === c) return 'exact';

    const dist = getEditDistance(u, c);
    const allowedDist = Math.max(1, Math.floor(c.length / 5));
    return dist <= allowedDist ? 'close' : 'wrong';
};
// -------------------------------------------------

export default function Player() {
    const [quizState, setQuizState] = useState('menu');
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);

    const [showExplanation, setShowExplanation] = useState(false);
    const [openAnswer, setOpenAnswer] = useState('');
    const [lastMatchStatus, setLastMatchStatus] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.zip')) return alert("Wybierz plik .zip!");

        const zip = new JSZip();
        try {
            const unzipped = await zip.loadAsync(file);
            const json = await unzipped.file("data.json").async("string");
            const parsedData = JSON.parse(json);

            for (let q of parsedData) {
                if (q.questionImage && unzipped.file(q.questionImage)) {
                    const blob = await unzipped.file(q.questionImage).async("blob");
                    q.questionImage = URL.createObjectURL(blob);
                }
                if (q.image && unzipped.file(q.image)) {
                    const blob = await unzipped.file(q.image).async("blob");
                    q.image = URL.createObjectURL(blob);
                }
            }

            setQuestions(parsedData);
            setQuizState('playing');
            setCurrentIndex(0);
            setScore(0);
            setShowExplanation(false);
        } catch (err) {
            alert("Błąd odczytu paczki ZIP.");
        }
    };

    const handleCheckAnswer = (ans = null) => {
        const currentQ = questions[currentIndex];
        // Wykrywanie pytania otwartego (jak w starym kodzie)
        const isOpenQuestion = currentQ.isOpen || (currentQ.answers.length === 1 && currentQ.answers[0].correct);
        let matchResult = 'wrong';

        if (isOpenQuestion) {
            const correctText = currentQ.answers[0].text;
            matchResult = isAnswerCloseEnough(openAnswer, correctText);
        } else {
            matchResult = ans.correct ? 'exact' : 'wrong';
        }

        if (matchResult === 'exact' || matchResult === 'close') {
            setScore(s => s + 1);
        }

        setLastMatchStatus(matchResult);
        setShowExplanation(true);
    };

    const handleNext = () => {
        setShowExplanation(false);
        setOpenAnswer('');
        setLastMatchStatus(null);
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(i => i + 1);
        } else {
            setQuizState('results');
        }
    };

    if (quizState === 'menu') {
        return (
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-purple-600">Twoja Biblioteka</h1>
                <div className="border-2 border-dashed border-purple-200 bg-purple-50/50 p-10 rounded-2xl hover:bg-purple-50 transition-colors">
                    <p className="text-slate-500 mb-4 font-medium">Wgraj plik ZIP, aby zagrać</p>
                    <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                </div>
            </div>
        );
    }

    if (quizState === 'playing') {
        const currentQ = questions[currentIndex];
        const isCorrect = lastMatchStatus === 'exact' || lastMatchStatus === 'close';
        // Wykrywanie pytania otwartego do widoku (jak w starym kodzie)
        const isOpenQuestion = currentQ.isOpen || (currentQ.answers.length === 1 && currentQ.answers[0].correct);

        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between text-sm font-semibold text-slate-400">
                    <span>Pytanie {currentIndex + 1} z {questions.length}</span>
                    <button onClick={() => setQuizState('menu')} className="hover:text-red-500 transition">Wyjdź</button>
                </div>

                {currentQ.questionImage && (
                    <img src={currentQ.questionImage} alt="Pytanie" className="w-full max-h-64 object-contain rounded-xl bg-slate-50 border border-slate-100" />
                )}

                <h2 className="text-2xl font-bold text-slate-800">{currentQ.question}</h2>

                {!showExplanation ? (
                    <div className="space-y-3">
                        {isOpenQuestion ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={openAnswer}
                                    onChange={(e) => setOpenAnswer(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                                    placeholder="Wpisz odpowiedź..."
                                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 outline-none text-lg transition-colors"
                                    autoFocus
                                />
                                <button onClick={() => handleCheckAnswer()} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors">
                                    Sprawdź
                                </button>
                            </div>
                        ) : (
                            currentQ.answers.map((ans, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleCheckAnswer(ans)}
                                    className="w-full text-left p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 font-medium text-slate-700 transition-all active:scale-[0.98]"
                                >
                                    {ans.text}
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className={`space-y-6 p-6 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`text-xl font-black ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Dobrze! 🎉' : 'Źle! 😔'}
                        </div>

                        {isOpenQuestion && (
                            <div className="text-sm">
                                {lastMatchStatus === 'close' && (
                                    <p className="text-green-700 font-medium">Zaliczono! Dokładna odpowiedź to: <strong>{currentQ.answers[0].text}</strong></p>
                                )}
                                {lastMatchStatus === 'wrong' && (
                                    <p className="text-red-700 font-medium">Poprawna odpowiedź: <strong>{currentQ.answers[0].text}</strong></p>
                                )}
                            </div>
                        )}

                        {(currentQ.explanation || currentQ.image) && (
                            <div className="space-y-4 border-t border-slate-200/50 pt-4 mt-4">
                                <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">Wyjaśnienie</h3>
                                {currentQ.explanation && <p className="text-slate-700">{currentQ.explanation}</p>}
                                {currentQ.image && <img src={currentQ.image} alt="Wyjaśnienie" className="w-full rounded-lg" />}
                            </div>
                        )}

                        <button onClick={handleNext} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">
                            Dalej ➔
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-bold text-slate-800">Koniec Quizu!</h2>
            <div className="text-7xl font-black text-purple-600 my-8">
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