import { useState } from 'react';
import JSZip from 'jszip';

export default function Editor() {
    const [questions, setQuestions] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Wczytywanie paczki ZIP
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.zip')) return alert("Wybierz poprawny plik .zip!");

        const zip = new JSZip();
        try {
            const unzipped = await zip.loadAsync(file);
            const json = await unzipped.file("data.json").async("string");
            setQuestions(JSON.parse(json));
            setIsLoaded(true);
        } catch (err) {
            alert("Coś poszło nie tak przy odczycie ZIP-a.");
        }
    };

    // Zapis zmian w konkretnym pytaniu
    const handleQuestionChange = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    // Zapis odpowiedzi w konkretnym pytaniu
    const handleAnswerChange = (qIndex, aIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].answers[aIndex][field] = value;
        setQuestions(updated);
    };

    // Pobieranie poprawionego ZIP-a
    const handleDownload = async () => {
        const zip = new JSZip();
        zip.file("data.json", JSON.stringify(questions, null, 2));
        const content = await zip.generateAsync({ type: "blob" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "quiz_master_poprawiony.zip";
        link.click();
    };

    if (!isLoaded) {
        return (
            <div className="text-center space-y-6">
                <h1 className="text-3xl font-bold text-blue-600">Edytor Quizów</h1>
                <div className="border-2 border-dashed border-slate-300 bg-slate-50 p-10 rounded-2xl">
                    <p className="text-slate-500 mb-4 font-medium">Wgraj plik ZIP do edycji</p>
                    <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Edytujesz: {questions.length} pytań</h1>
                <button
                    onClick={handleDownload}
                    className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition-colors"
                >
                    Zapisz i pobierz ZIP
                </button>
            </div>

            <div className="space-y-4">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-bold text-blue-600">Pytanie #{qIndex + 1}</span>
                            <button
                                onClick={() => setEditingIndex(editingIndex === qIndex ? null : qIndex)}
                                className="text-sm font-semibold text-slate-500 hover:text-blue-600"
                            >
                                {editingIndex === qIndex ? 'Zwiń' : 'Edytuj'}
                            </button>
                        </div>

                        {editingIndex === qIndex ? (
                            <div className="space-y-4">
                <textarea
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="2"
                />

                                <div className="space-y-2">
                                    {q.answers.map((ans, aIndex) => (
                                        <div key={aIndex} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={ans.correct}
                                                onChange={(e) => handleAnswerChange(qIndex, aIndex, 'correct', e.target.checked)}
                                                className="w-5 h-5 text-blue-600"
                                            />
                                            <input
                                                type="text"
                                                value={ans.text}
                                                onChange={(e) => handleAnswerChange(qIndex, aIndex, 'text', e.target.value)}
                                                className="flex-1 p-2 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-700">{q.question}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}