import { useState } from 'react';
import JSZip from 'jszip';

const getEditDistance = (a, b) => {
    if (a.length === 0) return b.length; if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill().map((_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
};

const isAnswerCloseEnough = (user, correct) => {
    const u = user.toLowerCase().trim(); const c = correct.toLowerCase().trim();
    if (u === c) return 'exact';
    const allowedDist = Math.max(1, Math.floor(c.length / 5));
    return getEditDistance(u, c) <= allowedDist ? 'close' : 'wrong';
};

export default function Player() {
    const [quizState, setQuizState] = useState('menu');
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);

    const [showExplanation, setShowExplanation] = useState(false);
    const [openAnswers, setOpenAnswers] = useState(['']); // Tablica wejść dla pytań otwartych
    const [lastMatchStatus, setLastMatchStatus] = useState(null);
    const [matchedDetails, setMatchedDetails] = useState([]); // Do pokazania gdzie był błąd

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.zip')) return alert("Wybierz plik .zip!");
        const zip = new JSZip();
        try {
            const unzipped = await zip.loadAsync(file);
            const json = await unzipped.file("data.json").async("string");
            const parsedData = JSON.parse(json);
            for (let q of parsedData) {
                if (q.questionImage && unzipped.file(q.questionImage)) q.questionImage = URL.createObjectURL(await unzipped.file(q.questionImage).async("blob"));
                if (q.image && unzipped.file(q.image)) q.image = URL.createObjectURL(await unzipped.file(q.image).async("blob"));
            }
            setQuestions(parsedData);
            setCurrentIndex(0); setScore(0); setQuizState('playing');
            initOpenAnswers(parsedData[0]);
        } catch (err) { alert("Błąd odczytu paczki ZIP."); }
    };

    const initOpenAnswers = (q) => {
        const required = q.requiredAnswersCount || 1;
        setOpenAnswers(Array(required).fill(''));
        setShowExplanation(false); setLastMatchStatus(null);
    };

    const handleCheckAnswer = (ans = null) => {
        const currentQ = questions[currentIndex];
        const isOpenQuestion = currentQ.isOpen || (currentQ.answers.length === 1 && currentQ.answers[0].correct);
        let matchResult = 'wrong';

        if (isOpenQuestion) {
            const required = currentQ.requiredAnswersCount || 1;
            const pool = currentQ.answers.filter(a => a.correct).map(a => a.text);
            let matchedCount = 0;
            let usedPoolIndices = new Set();
            let details = [];

            // Sprawdzamy wpisane wartości przez usera
            for (let uAns of openAnswers) {
                if (!uAns.trim()) continue;
                let bestMatchIdx = -1;
                let isClose = false;

                for (let i = 0; i < pool.length; i++) {
                    if (usedPoolIndices.has(i)) continue; // żeby nie zaliczyć 2x tego samego słowa
                    const status = isAnswerCloseEnough(uAns, pool[i]);
                    if (status === 'exact') { bestMatchIdx = i; isClose = false; break; }
                    if (status === 'close' && bestMatchIdx === -1) { bestMatchIdx = i; isClose = true; }
                }

                if (bestMatchIdx !== -1) {
                    matchedCount++;
                    usedPoolIndices.add(bestMatchIdx);
                    details.push({ user: uAns, correct: pool[bestMatchIdx], status: isClose ? 'close' : 'exact' });
                } else {
                    details.push({ user: uAns, status: 'wrong' });
                }
            }

            if (matchedCount >= required) {
                matchResult = details.some(d => d.status === 'close') ? 'close' : 'exact';
            }
            setMatchedDetails(details);
        } else {
            matchResult = ans.correct ? 'exact' : 'wrong';
        }

        if (matchResult === 'exact' || matchResult === 'close') setScore(s => s + 1);
        setLastMatchStatus(matchResult);
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(i => i + 1);
            initOpenAnswers(questions[currentIndex + 1]);
        } else {
            setQuizState('results');
        }
    };

    if (quizState === 'menu') return (
        <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-purple-600">Twoja Biblioteka</h1>
            <div className="border-2 border-dashed border-purple-200 bg-purple-50 p-10 rounded-2xl hover:bg-purple-100">
                <p className="text-slate-500 mb-4 font-medium">Wgraj plik ZIP, aby zagrać</p>
                <input type="file" accept=".zip" onChange={handleFileUpload} className="block w-full text-sm font-semibold file:bg-purple-600 file:text-white file:border-0 file:rounded-full file:px-6 file:py-2" />
            </div>
        </div>
    );

    if (quizState === 'playing') {
        const currentQ = questions[currentIndex];
        const isCorrect = lastMatchStatus === 'exact' || lastMatchStatus === 'close';
        const isOpenQuestion = currentQ.isOpen || (currentQ.answers.length === 1 && currentQ.answers[0].correct);
        const required = currentQ.requiredAnswersCount || 1;

        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between text-sm font-semibold text-slate-400">
                    <span>Pytanie {currentIndex + 1} z {questions.length}</span>
                    <button onClick={() => setQuizState('menu')} className="hover:text-red-500">Wyjdź</button>
                </div>

                {currentQ.questionImage && <img src={currentQ.questionImage} alt="Pytanie" className="w-full max-h-64 object-contain rounded-xl border border-slate-100" />}

                <h2 className="text-2xl font-bold text-slate-800">
                    {currentQ.question}
                    {isOpenQuestion && required > 1 && <span className="block text-sm text-purple-500 mt-1">Wymień {required} poprawne.</span>}
                </h2>

                {!showExplanation ? (
                    <div className="space-y-3">
                        {isOpenQuestion ? (
                            <div className="space-y-4">
                                {openAnswers.map((ans, i) => (
                                    <input key={i} type="text" value={ans}
                                           onChange={(e) => { const newA = [...openAnswers]; newA[i] = e.target.value; setOpenAnswers(newA); }}
                                           onKeyDown={(e) => e.key === 'Enter' && i === required - 1 && handleCheckAnswer()}
                                           placeholder={`Odpowiedź ${i + 1}...`}
                                           className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 outline-none text-lg" autoFocus={i===0}
                                    />
                                ))}
                                <button onClick={() => handleCheckAnswer()} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700">Sprawdź</button>
                            </div>
                        ) : (
                            currentQ.answers.map((ans, idx) => (
                                <button key={idx} onClick={() => handleCheckAnswer(ans)} className="w-full text-left p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:bg-purple-50 font-medium">
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
                            <div className="text-sm space-y-2">
                                {matchedDetails.map((d, i) => (
                                    <p key={i}>
                                        {d.status === 'wrong' ? <span className="text-red-600">❌ {d.user || '(pusto)'}</span> :
                                            d.status === 'close' ? <span className="text-green-600">✅ {d.user} <span className="opacity-70">(literówka, miało być: {d.correct})</span></span> :
                                                <span className="text-green-600">✅ {d.user}</span>}
                                    </p>
                                ))}
                                {!isCorrect && <p className="text-slate-600 mt-2">Dopuszczalne odpowiedzi to m.in.: <b>{currentQ.answers.map(a=>a.text).join(', ')}</b></p>}
                            </div>
                        )}

                        {(currentQ.explanation || currentQ.image) && (
                            <div className="space-y-4 border-t border-slate-200 pt-4"><p>{currentQ.explanation}</p> {currentQ.image && <img src={currentQ.image} className="w-full rounded-lg" />}</div>
                        )}

                        <button onClick={handleNext} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">Dalej ➔</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-center space-y-6"><h2 className="text-4xl font-bold">Koniec Quizu!</h2><div className="text-7xl font-black text-purple-600">{score} <span className="text-3xl">/ {questions.length}</span></div><button onClick={() => setQuizState('menu')} className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold">Wróć do menu</button></div>
    );
}