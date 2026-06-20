import { useState } from 'react';
import JSZip from 'jszip';

export default function Editor() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);

    const [currentQuestion, setCurrentQuestion] = useState({
        question: '', explanation: '', questionImage: '', image: '', isOpen: false, requiredAnswersCount: 1,
        answers: [{ text: '', correct: false }, { text: '', correct: false }]
    });

    const [showQImage, setShowQImage] = useState(false);
    const [showExpl, setShowExpl] = useState(false);
    const [showExplImage, setShowExplImage] = useState(false);

    // Wczytywanie i konwersja ZIP-a na format edytowalny
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.zip')) return alert("Wybierz poprawny plik .zip!");

        const zip = new JSZip();
        try {
            const unzipped = await zip.loadAsync(file);
            const json = await unzipped.file("data.json").async("string");
            const parsedData = JSON.parse(json);

            for (let q of parsedData) {
                // Ekstrakcja zdjęć do Base64 (aby można było je edytować i zapisać ponownie)
                if (q.questionImage && unzipped.file(q.questionImage)) {
                    const base64 = await unzipped.file(q.questionImage).async("base64");
                    q.questionImage = "data:image/jpeg;base64," + base64;
                } else { q.questionImage = ""; }

                if (q.image && unzipped.file(q.image)) {
                    const base64 = await unzipped.file(q.image).async("base64");
                    q.image = "data:image/jpeg;base64," + base64;
                } else { q.image = ""; }

                // Kompatybilność ze starymi paczkami
                if (q.isOpen === undefined) q.isOpen = (q.answers.length === 1 && q.answers[0].correct);
                if (q.requiredAnswersCount === undefined) q.requiredAnswersCount = 1;
            }

            setQuestions(parsedData);
            setIsLoaded(true);
        } catch (err) {
            alert("Błąd odczytu paczki ZIP.");
        }
    };

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

    const handleEditQuestion = (index) => {
        const q = questions[index];
        setEditingIndex(index);
        setCurrentQuestion(q);
        setShowQImage(!!q.questionImage);
        setShowExpl(!!q.explanation);
        setShowExplImage(!!q.image);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setCurrentQuestion({
            question: '', explanation: '', questionImage: '', image: '', isOpen: false, requiredAnswersCount: 1,
            answers: [{ text: '', correct: false }, { text: '', correct: false }]
        });
        setShowQImage(false);
        setShowExpl(false);
        setShowExplImage(false);
    };

    const saveQuestion = () => {
        if (!currentQuestion.question || currentQuestion.answers.length === 0) return;
        const hasCorrect = currentQuestion.answers.some(a => a.correct && a.text.trim() !== '');
        if (!hasCorrect) return alert("Musisz podać co najmniej jedną poprawną odpowiedź!");
        if (currentQuestion.isOpen && currentQuestion.requiredAnswersCount > currentQuestion.answers.length) {
            return alert("Wymagana liczba odpowiedzi nie może być większa niż zdefiniowana pula!");
        }

        if (editingIndex !== null) {
            const updated = [...questions];
            updated[editingIndex] = currentQuestion;
            setQuestions(updated);
        } else {
            setQuestions([...questions, currentQuestion]);
        }

        handleCancelEdit();
    };

    const handleDownload = async () => {
        const zip = new JSZip();
        const imgFolder = zip.folder("images");
        const exportData = [];

        questions.forEach((q, index) => {
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
        link.download = "quiz_master_poprawiony.zip";
        link.click();
    };

    // ----------------------------------------------------
    // RENDEROWANIE WIDOKÓW
    // ----------------------------------------------------

    if (!isLoaded) {
        return (
            <div className="text-center space-y-6">
                <h1 className="text-3xl font-bold text-blue-600">Edytor Quizów</h1>
                <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 p-10 rounded-2xl">
                    <p className="text-slate-500 mb-4 font-medium">Wgraj plik ZIP, aby rozpocząć edycję</p>
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

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-blue-600 mb-1">Edytor Quizów</h1>
                    <p className="text-slate-500 text-sm">Edytujesz i modyfikujesz wgrany zestaw.</p>
                </div>
                <button onClick={() => setIsLoaded(false)} className="text-sm font-semibold text-slate-500 hover:text-red-500">
                    ✖ Zamknij zestaw
                </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <textarea
            value={currentQuestion.question}
            onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" rows="3" placeholder="Treść pytania..."
        />

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="openToggleEdit" checked={currentQuestion.isOpen} onChange={(e) => toggleOpenQuestion(e.target.checked)} className="w-5 h-5 text-blue-600"/>
                        <label htmlFor="openToggleEdit" className="font-semibold text-slate-700 cursor-pointer text-sm">Pytanie otwarte</label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                        <button onClick={() => handleToggleField('questionImage', showQImage, setShowQImage)} className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${showQImage || currentQuestion.questionImage ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                            {showQImage || currentQuestion.questionImage ? '✖ Usuń zdjęcie pytania' : '➕ Zdjęcie pytania'}
                        </button>
                        <button onClick={() => handleToggleField('explanation', showExpl, setShowExpl)} className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${showExpl || currentQuestion.explanation ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {showExpl || currentQuestion.explanation ? '✖ Usuń wyjaśnienie' : '➕ Wyjaśnienie tekstem'}
                        </button>
                        <button onClick={() => handleToggleField('image', showExplImage, setShowExplImage)} className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${showExplImage || currentQuestion.image ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                            {showExplImage || currentQuestion.image ? '✖ Usuń zdjęcie wyj.' : '➕ Zdjęcie do wyj.'}
                        </button>
                    </div>
                </div>

                {(showQImage || showExpl || showExplImage || currentQuestion.questionImage || currentQuestion.explanation || currentQuestion.image) && (
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                        {(showQImage || currentQuestion.questionImage) && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Zdjęcie do pytania:</label>
                                <input type="file" accept="image/*" onChange={(e) => { if(e.target.files.length) compressImage(e.target.files[0], 'questionImage') }} className="text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                                {currentQuestion.questionImage && <img src={currentQuestion.questionImage} alt="Podgląd" className="mt-2 max-h-32 rounded-lg object-contain bg-slate-50 border border-slate-100" />}
                            </div>
                        )}
                        {(showExpl || currentQuestion.explanation) && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Wyjaśnienie (tekst):</label>
                                <textarea value={currentQuestion.explanation} onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" rows="2" placeholder="Wyjaśnienie..." />
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

                {currentQuestion.isOpen && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <label className="block text-sm font-bold text-blue-800 mb-2">Ile poprawnych odpowiedzi wymaga zaliczenie?</label>
                        <input type="number" min="1" max={currentQuestion.answers.length} value={currentQuestion.requiredAnswersCount} onChange={(e) => setCurrentQuestion({...currentQuestion, requiredAnswersCount: parseInt(e.target.value) || 1})} className="p-2 w-24 rounded-lg border border-blue-200 outline-none" />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{currentQuestion.isOpen ? 'Pula poprawnych odpowiedzi:' : 'Odpowiedzi:'}</label>
                    <div className="space-y-3">
                        {currentQuestion.answers.map((ans, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {!currentQuestion.isOpen && (
                                    <input type="checkbox" checked={ans.correct} onChange={(e) => {
                                        const newAns = [...currentQuestion.answers]; newAns[idx].correct = e.target.checked;
                                        setCurrentQuestion({...currentQuestion, answers: newAns});
                                    }} className="w-6 h-6 text-blue-600 rounded" />
                                )}
                                <input type="text" value={ans.text} onChange={(e) => {
                                    const newAns = [...currentQuestion.answers]; newAns[idx].text = e.target.value;
                                    if(currentQuestion.isOpen) newAns[idx].correct = true;
                                    setCurrentQuestion({...currentQuestion, answers: newAns});
                                }} placeholder={currentQuestion.isOpen ? `Poprawna odpowiedź ${idx + 1}` : `Odpowiedź ${idx + 1}`} className={`flex-1 p-3 rounded-lg border outline-none ${currentQuestion.isOpen || ans.correct ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setCurrentQuestion(p => ({...p, answers: [...p.answers, {text: '', correct: p.isOpen}]}))} className="mt-4 text-sm font-semibold text-blue-600">
                        + Dodaj kolejną opcję
                    </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={saveQuestion} className={`flex-1 font-bold py-3 rounded-xl transition-colors ${editingIndex !== null ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                        {editingIndex !== null ? '💾 Zapisz zmiany w pytaniu' : '➕ Dodaj jako nowe pytanie'}
                    </button>
                    {editingIndex !== null && <button onClick={handleCancelEdit} className="px-6 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300">Anuluj</button>}
                </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-800 mb-4">Zawartość paczki ({questions.length})</h3>

                {questions.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 border border-slate-100 rounded-xl p-3 bg-white shadow-inner">
                        {questions.map((q, idx) => (
                            <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-all shadow-sm">
                                <div className="space-y-1 flex-1">
                                    <p className="font-semibold text-slate-800 text-base">{idx + 1}. {q.question || <span className="text-slate-400 italic">Brak treści</span>}</p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.isOpen ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {q.isOpen ? `Otwarte (wymaga: ${q.requiredAnswersCount})` : 'Zamknięte'}
                    </span>
                                        {q.questionImage && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">🖼️ Foto pyt.</span>}
                                        {q.explanation && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">📝 Wyjaśnienie</span>}
                                        {q.image && <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">🖼️ Foto wyj.</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4 shrink-0">
                                    <button onClick={() => handleEditQuestion(idx)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">Edytuj</button>
                                    <button onClick={() => setQuestions(questions.filter((_, i) => i !== idx))} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition">Usuń</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm italic">Paczka jest pusta.</p>
                )}

                {questions.length > 0 && (
                    <button onClick={handleDownload} className="mt-4 w-full md:w-auto bg-green-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition shadow-md">
                        Pobierz zaktualizowany ZIP
                    </button>
                )}
            </div>
        </div>
    );
}