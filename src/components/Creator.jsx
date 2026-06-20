import { useState } from 'react';
import JSZip from 'jszip';

export default function Creator() {
    const [createdQuestions, setCreatedQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '', explanation: '', questionImage: '', image: '', isOpen: false, requiredAnswersCount: 1,
        answers: [{ text: '', correct: false }, { text: '', correct: false }]
    });

    const [showQImage, setShowQImage] = useState(false);
    const [showExpl, setShowExpl] = useState(false);
    const [showExplImage, setShowExplImage] = useState(false);

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
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                setCurrentQuestion(prev => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.8) }));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const toggleOpenQuestion = (isOpen) => {
        setCurrentQuestion({
            ...currentQuestion, isOpen, requiredAnswersCount: 1,
            answers: isOpen ? [{ text: '', correct: true }] : [{ text: '', correct: false }, { text: '', correct: false }]
        });
    };

    const handleToggleField = (field, isShown, setShown) => {
        if (isShown || currentQuestion[field]) {
            setShown(false);
            setCurrentQuestion(prev => ({ ...prev, [field]: '' }));
        } else {
            setShown(true);
        }
    };

    const saveQuestion = () => {
        if (!currentQuestion.question || currentQuestion.answers.length === 0) return;
        const hasCorrect = currentQuestion.answers.some(a => a.correct && a.text.trim() !== '');
        if (!hasCorrect) return alert("Musisz podać co najmniej jedną poprawną odpowiedź!");
        if (currentQuestion.isOpen && currentQuestion.requiredAnswersCount > currentQuestion.answers.length) {
            return alert("Wymagana liczba odpowiedzi nie może być większa niż zdefiniowana pula!");
        }

        setCreatedQuestions([...createdQuestions, currentQuestion]);

        setCurrentQuestion({
            question: '', explanation: '', questionImage: '', image: '', isOpen: false, requiredAnswersCount: 1,
            answers: [{ text: '', correct: false }, { text: '', correct: false }]
        });
        setShowQImage(false);
        setShowExpl(false);
        setShowExplImage(false);
    };

    const handleDownload = async () => {
        const zip = new JSZip();
        const imgFolder = zip.folder("images");
        const exportData = [];

        createdQuestions.forEach((q, index) => {
            const questionData = { ...q, questionImage: "", image: "" };
            if (q.questionImage?.startsWith('data:image')) {
                const fileName = `q_${index}_polecenie.jpg`;
                imgFolder.file(fileName, q.questionImage.split(',')[1], {base64: true});
                questionData.questionImage = `images/${fileName}`;
            }
            if (q.image?.startsWith('data:image')) {
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
                <p className="text-slate-500">Stwórz pytania, określ wymogi i pobierz ZIP.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">

                {/* Treść pytania */}
                <textarea
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                    className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" rows="3" placeholder="Treść pytania..."
                />

                {/* PASEK NARZĘDZI */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                    {/* Checkbox */}
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="openToggle" checked={currentQuestion.isOpen} onChange={(e) => toggleOpenQuestion(e.target.checked)} className="w-5 h-5 text-purple-600"/>
                        <label htmlFor="openToggle" className="font-semibold text-slate-700 cursor-pointer text-sm">Pytanie otwarte</label>
                    </div>

                    {/* Przyciski w nowej linii */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                        <button onClick={() => handleToggleField('questionImage', showQImage, setShowQImage)} className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${showQImage || currentQuestion.questionImage ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                            {showQImage || currentQuestion.questionImage ? '✖ Usuń zdjęcie pytania' : '➕ Zdjęcie pytania'}
                        </button>

                        <button onClick={() => handleToggleField('explanation', showExpl, setShowExpl)} className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${showExpl || currentQuestion.explanation ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                            {showExpl || currentQuestion.explanation ? '✖ Usuń wyjaśnienie' : '➕ Wyjaśnienie tekstem'}
                        </button>

                        <button onClick={() => handleToggleField('image', showExplImage, setShowExplImage)} className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${showExplImage || currentQuestion.image ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {showExplImage || currentQuestion.image ? '✖ Usuń zdjęcie wyj.' : '➕ Zdjęcie do wyj.'}
                        </button>
                    </div>
                </div>

                {/* Dynamicznie renderowane opcjonalne pola */}
                {(showQImage || showExpl || showExplImage || currentQuestion.questionImage || currentQuestion.explanation || currentQuestion.image) && (
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 animate-in fade-in duration-200">
                        {(showQImage || currentQuestion.questionImage) && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Zdjęcie do pytania:</label>
                                <input type="file" accept="image/*" onChange={(e) => { if(e.target.files.length) compressImage(e.target.files[0], 'questionImage') }} className="text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200" />
                                {currentQuestion.questionImage && <img src={currentQuestion.questionImage} alt="Podgląd" className="mt-2 max-h-32 rounded-lg object-contain bg-slate-50 border border-slate-100" />}
                            </div>
                        )}

                        {(showExpl || currentQuestion.explanation) && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Wyjaśnienie (tekst):</label>
                                <textarea
                                    value={currentQuestion.explanation}
                                    onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                    rows="2" placeholder="Wyjaśnienie widoczne po udzieleniu odpowiedzi..."
                                />
                            </div>
                        )}

                        {(showExplImage || currentQuestion.image) && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Zdjęcie do wyjaśnienia:</label>
                                <input type="file" accept="image/*" onChange={(e) => { if(e.target.files.length) compressImage(e.target.files[0], 'image') }} className="text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
                                {currentQuestion.image && <img src={currentQuestion.image} alt="Podgląd" className="mt-2 max-h-32 rounded-lg object-contain bg-slate-50 border border-slate-100" />}
                            </div>
                        )}
                    </div>
                )}

                {/* Dodatkowe opcje dla pytania otwartego */}
                {currentQuestion.isOpen && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <label className="block text-sm font-bold text-purple-800 mb-2">Ile poprawnych odpowiedzi wymaga zaliczenie?</label>
                        <input
                            type="number" min="1" max={currentQuestion.answers.length}
                            value={currentQuestion.requiredAnswersCount}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, requiredAnswersCount: parseInt(e.target.value) || 1})}
                            className="p-2 w-24 rounded-lg border border-purple-200 outline-none"
                        />
                    </div>
                )}

                {/* Odpowiedzi */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {currentQuestion.isOpen ? 'Pula poprawnych odpowiedzi (wymień wszystkie akceptowalne):' : 'Odpowiedzi:'}
                    </label>
                    <div className="space-y-3">
                        {currentQuestion.answers.map((ans, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {!currentQuestion.isOpen && (
                                    <input type="checkbox" checked={ans.correct} onChange={(e) => {
                                        const newAns = [...currentQuestion.answers]; newAns[idx].correct = e.target.checked;
                                        setCurrentQuestion({...currentQuestion, answers: newAns});
                                    }} className="w-6 h-6 text-purple-600 rounded" />
                                )}
                                <input type="text" value={ans.text} onChange={(e) => {
                                    const newAns = [...currentQuestion.answers]; newAns[idx].text = e.target.value;
                                    if(currentQuestion.isOpen) newAns[idx].correct = true;
                                    setCurrentQuestion({...currentQuestion, answers: newAns});
                                }} placeholder={currentQuestion.isOpen ? `Poprawna odpowiedź ${idx + 1}` : `Odpowiedź ${idx + 1}`}
                                       className={`flex-1 p-3 rounded-lg border outline-none ${currentQuestion.isOpen || ans.correct ? 'border-purple-300 bg-purple-50' : 'border-slate-200'}`}
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setCurrentQuestion(p => ({...p, answers: [...p.answers, {text: '', correct: p.isOpen}]}))} className="mt-4 text-sm font-semibold text-purple-600">
                        + Dodaj kolejną opcję
                    </button>
                </div>

                <button onClick={saveQuestion} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700">
                    Dodaj pytanie do zestawu
                </button>
            </div>

            <div className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-800 mb-4">Twoja lista ({createdQuestions.length})</h3>
                {createdQuestions.length > 0 && (
                    <button onClick={handleDownload} className="bg-green-500 text-white font-bold py-3 px-8 rounded-xl">Pobierz paczkę ZIP</button>
                )}
            </div>
        </div>
    );
}