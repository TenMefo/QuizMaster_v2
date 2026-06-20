import { useState } from 'react';
import JSZip from 'jszip';

export default function Creator() {
    const [createdQuestions, setCreatedQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        explanation: '',
        answers: [{ text: '', correct: false }, { text: '', correct: false }]
    });

    const addAnswerField = () => {
        setCurrentQuestion({
            ...currentQuestion,
            answers: [...currentQuestion.answers, { text: '', correct: false }]
        });
    };

    const saveQuestion = () => {
        if (!currentQuestion.question || currentQuestion.answers.length === 0) return;
        setCreatedQuestions([...createdQuestions, currentQuestion]);
        setCurrentQuestion({ question: '', explanation: '', answers: [{ text: '', correct: false }, { text: '', correct: false }] });
    };

    const handleDownload = async () => {
        const zip = new JSZip();
        // Konwersja do oczekiwanego formatu JSON
        const exportData = createdQuestions.map(q => ({
            ...q, questionImage: "", image: ""
        }));

        zip.file("data.json", JSON.stringify(exportData, null, 2));
        const content = await zip.generateAsync({ type: "blob" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "quiz_master_zestaw.zip";
        link.click();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-blue-600 mb-2">Kreator Pytań</h1>
                <p className="text-slate-500">Dodaj pytania, a na końcu pobierz gotowy plik ZIP.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Treść pytania:</label>
                    <textarea
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows="3"
                        placeholder="np. Jaka jest stolica Polski?"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Odpowiedzi:</label>
                    <div className="space-y-3">
                        {currentQuestion.answers.map((ans, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={ans.correct}
                                    onChange={(e) => {
                                        const newAns = [...currentQuestion.answers];
                                        newAns[idx].correct = e.target.checked;
                                        setCurrentQuestion({...currentQuestion, answers: newAns});
                                    }}
                                    className="w-6 h-6 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={ans.text}
                                    onChange={(e) => {
                                        const newAns = [...currentQuestion.answers];
                                        newAns[idx].text = e.target.value;
                                        setCurrentQuestion({...currentQuestion, answers: newAns});
                                    }}
                                    placeholder={`Odpowiedź ${idx + 1}`}
                                    className="flex-1 p-3 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={addAnswerField} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">
                        + Dodaj kolejną odpowiedź
                    </button>
                </div>

                <button
                    onClick={saveQuestion}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                    Dodaj pytanie do listy
                </button>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-800 mb-4">Twoja lista ({createdQuestions.length})</h3>
                {createdQuestions.length > 0 && (
                    <button
                        onClick={handleDownload}
                        className="bg-green-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition-colors"
                    >
                        Pobierz plik ZIP
                    </button>
                )}
            </div>
        </div>
    );
}