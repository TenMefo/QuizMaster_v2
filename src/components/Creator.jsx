import { useState } from 'react';
import JSZip from 'jszip';

export default function Creator() {
    const [createdQuestions, setCreatedQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        explanation: '',
        questionImage: '',
        image: '',
        isOpen: false,
        answers: [{ text: '', correct: false }, { text: '', correct: false }]
    });

    // Kompresja zdjęć w locie (identycznie jak w Twoim starym skrypcie)
    const compressImage = (file, field) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                setCurrentQuestion(prev => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.8) }));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = (e, field) => {
        if (e.target.files.length > 0) {
            compressImage(e.target.files[0], field);
        }
    };

    const toggleOpenQuestion = (isOpen) => {
        setCurrentQuestion({
            ...currentQuestion,
            isOpen,
            answers: isOpen ? [{ text: '', correct: true }] : [{ text: '', correct: false }, { text: '', correct: false }]
        });
    };

    const saveQuestion = () => {
        if (!currentQuestion.question || currentQuestion.answers.length === 0) return;

        // Walidacja czy zaznaczono poprawną odpowiedź (dla zamkniętych) lub czy wpisano tekst (dla otwartych)
        const hasCorrect = currentQuestion.answers.some(a => a.correct && a.text.trim() !== '');
        if (!hasCorrect && !currentQuestion.isOpen) return alert("Wpisz treść i zaznacz przynajmniej jedną poprawną odpowiedź!");
        if (currentQuestion.isOpen && currentQuestion.answers[0].text.trim() === '') return alert("Wpisz poprawną odpowiedź dla pytania otwartego!");

        setCreatedQuestions([...createdQuestions, currentQuestion]);
        setCurrentQuestion({
            question: '', explanation: '', questionImage: '', image: '', isOpen: false,
            answers: [{ text: '', correct: false }, { text: '', correct: false }]
        });
    };

    const handleDownload = async () => {
        const zip = new JSZip();
        const imgFolder = zip.folder("images");
        const exportData = [];

        createdQuestions.forEach((q, index) => {
            const questionData = {
                question: q.question,
                answers: q.answers,
                explanation: q.explanation,
                questionImage: "",
                image: ""
            };

            if (q.questionImage && q.questionImage.startsWith('data:image')) {
                const fileName = `q_${index}_polecenie.jpg`;
                imgFolder.file(fileName, q.questionImage.split(',')[1], {base64: true});
                questionData.questionImage = `images/${fileName}`;
            }

            if (q.image && q.image.startsWith('data:image')) {
                const fileName = `q_${index}_wyjasnienie.jpg`;
                imgFolder.file(fileName, q.image.split(',')[1], {base64: true});
                questionData.image = `images/${fileName}`;
            }

            exportData.push(questionData);
        });

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
                <h1 className="text-3xl font-bold text-purple-600 mb-2">Kreator Pytań</h1>
                <p className="text-slate-500">Stwórz pytania, dodaj zdjęcia, a na końcu pobierz gotowy plik ZIP.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">

                {/* Treść i zdjęcie pytania */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Treść pytania:</label>
                    <textarea
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        rows="3"
                        placeholder="np. Jaka jest stolica Polski?"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Zdjęcie do pytania (opcjonalnie):</label>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'questionImage')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200" />
                        {currentQuestion.questionImage && <img src={currentQuestion.questionImage} alt="Podgląd" className="mt-2 h-32 rounded-lg object-cover" />}
                    </div>
                </div>

                {/* Tryb odpowiedzi */}
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 w-max">
                    <input
                        type="checkbox"
                        id="openQuestionToggle"
                        checked={currentQuestion.isOpen}
                        onChange={(e) => toggleOpenQuestion(e.target.checked)}
                        className="w-5 h-5 text-purple-600"
                    />
                    <label htmlFor="openQuestionToggle" className="font-semibold text-slate-700 cursor-pointer text-sm">Pytanie otwarte (wymaga wpisania tekstu)</label>
                </div>

                {/* Odpowiedzi */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Odpowiedzi:</label>
                    <div className="space-y-3">
                        {currentQuestion.answers.map((ans, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {!currentQuestion.isOpen && (
                                    <input
                                        type="checkbox"
                                        checked={ans.correct}
                                        onChange={(e) => {
                                            const newAns = [...currentQuestion.answers];
                                            newAns[idx].correct = e.target.checked;
                                            setCurrentQuestion({...currentQuestion, answers: newAns});
                                        }}
                                        className="w-6 h-6 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                    />
                                )}
                                <input
                                    type="text"
                                    value={ans.text}
                                    onChange={(e) => {
                                        const newAns = [...currentQuestion.answers];
                                        newAns[idx].text = e.target.value;
                                        setCurrentQuestion({...currentQuestion, answers: newAns});
                                    }}
                                    placeholder={currentQuestion.isOpen ? "Wpisz poprawną odpowiedź..." : `Odpowiedź ${idx + 1}`}
                                    className={`flex-1 p-3 rounded-lg border outline-none ${currentQuestion.isOpen || ans.correct ? 'border-purple-300 bg-purple-50' : 'border-slate-200 focus:border-purple-500'}`}
                                />
                            </div>
                        ))}
                    </div>
                    {!currentQuestion.isOpen && (
                        <button onClick={() => setCurrentQuestion(p => ({...p, answers: [...p.answers, {text: '', correct: false}]}))} className="mt-4 text-sm font-semibold text-purple-600 hover:text-purple-800">
                            + Dodaj kolejną odpowiedź
                        </button>
                    )}
                </div>

                {/* Wyjaśnienie */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Wyjaśnienie (pojawia się po udzieleniu odpowiedzi):</label>
                    <textarea
                        value={currentQuestion.explanation}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        rows="2"
                    />
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Zdjęcie do wyjaśnienia (opcjonalnie):</label>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
                        {currentQuestion.image && <img src={currentQuestion.image} alt="Podgląd" className="mt-2 h-32 rounded-lg object-cover" />}
                    </div>
                </div>

                <button
                    onClick={saveQuestion}
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors shadow-md"
                >
                    Dodaj pytanie do zestawu
                </button>
            </div>

            <div className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-800 mb-4">Twoja lista ({createdQuestions.length})</h3>
                {createdQuestions.length > 0 && (
                    <button
                        onClick={handleDownload}
                        className="bg-green-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition-colors shadow-md"
                    >
                        Pobierz paczkę ZIP
                    </button>
                )}
            </div>
        </div>
    );
}