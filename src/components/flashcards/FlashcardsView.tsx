import React, { useState } from 'react';
import { FlashcardDeck, Flashcard, Discipline } from '../../types';
import { StorageService } from '../../lib/storage';
import {
  Brain,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Star,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowLeft,
  Search,
  Filter,
  Check,
  X,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlashcardsViewProps {
  initialDeckId?: string | null;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ initialDeckId }) => {
  const db = StorageService.getDatabase();
  const currentSemesterId = db.profile.activeSemesterId;

  const [activeDeckId, setActiveDeckId] = useState<string | null>(initialDeckId || null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyStats, setStudyStats] = useState({ easy: 0, medium: 0, hard: 0, again: 0 });
  const [studyCompleted, setStudyCompleted] = useState(false);

  // Modals
  const [newDeckModalOpen, setNewDeckModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckDisciplineId, setNewDeckDisciplineId] = useState('');

  const [newCardModalOpen, setNewCardModalOpen] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTag, setCardTag] = useState('');

  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [aiCardCount, setAiCardCount] = useState(6);
  const [aiLoading, setAiLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const decks = db.flashcardDecks.filter((d) => d.semesterId === currentSemesterId).filter((d) => {
    if (!searchQuery.trim()) return true;
    return (
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeDeck = db.flashcardDecks.find((d) => d.id === activeDeckId);
  const currentCard = activeDeck?.cards[currentCardIndex];

  // Start study session
  const startStudying = (deckId: string) => {
    setActiveDeckId(deckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyStats({ easy: 0, medium: 0, hard: 0, again: 0 });
    setStudyCompleted(false);
    setIsStudyMode(true);
  };

  // Grade card with Leitner spaced repetition interval calculation
  const handleGradeCard = (rating: 'again' | 'hard' | 'medium' | 'easy') => {
    if (!activeDeck || !currentCard) return;

    let newInterval = 1;
    let newState = currentCard.state;

    if (rating === 'again') {
      newInterval = 1;
      newState = 'learning';
      setStudyStats((prev) => ({ ...prev, again: prev.again + 1 }));
    } else if (rating === 'hard') {
      newInterval = Math.max(1, Math.round(currentCard.intervalDays * 1.2));
      newState = 'review';
      setStudyStats((prev) => ({ ...prev, hard: prev.hard + 1 }));
    } else if (rating === 'medium') {
      newInterval = Math.max(2, Math.round(currentCard.intervalDays * 1.8));
      newState = 'review';
      setStudyStats((prev) => ({ ...prev, medium: prev.medium + 1 }));
    } else if (rating === 'easy') {
      newInterval = Math.max(4, Math.round((currentCard.intervalDays || 1) * 2.5));
      newState = 'mastered';
      setStudyStats((prev) => ({ ...prev, easy: prev.easy + 1 }));
    }

    const today = new Date();
    today.setDate(today.getDate() + newInterval);
    const nextDate = today.toISOString().split('T')[0];

    StorageService.update((draft) => {
      const d = draft.flashcardDecks.find((deck) => deck.id === activeDeck.id);
      if (d) {
        d.lastStudiedAt = new Date().toISOString();
        const c = d.cards.find((card) => card.id === currentCard.id);
        if (c) {
          c.intervalDays = newInterval;
          c.repetitions = (c.repetitions || 0) + 1;
          c.state = newState;
          c.nextReviewDate = nextDate;
          c.lastReviewedAt = new Date().toISOString();
        }
      }
    });

    if (currentCardIndex + 1 < activeDeck.cards.length) {
      setIsFlipped(false);
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setStudyCompleted(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;

    const disc = db.disciplines.find((d) => d.id === newDeckDisciplineId);
    const newDeck: FlashcardDeck = {
      id: `deck-${Date.now()}`,
      semesterId: currentSemesterId,
      disciplineId: newDeckDisciplineId || undefined,
      name: newDeckName.trim(),
      description: newDeckDesc.trim(),
      tags: [disc?.name?.toLowerCase() || 'geral'],
      color: disc?.color || '#4A6B53',
      icon: 'Brain',
      cards: [],
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.flashcardDecks.push(newDeck);
    });

    setNewDeckName('');
    setNewDeckDesc('');
    setNewDeckModalOpen(false);
    setActiveDeckId(newDeck.id);
  };

  const handleAddCard = () => {
    if (!activeDeck || !cardFront.trim() || !cardBack.trim()) return;

    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      deckId: activeDeck.id,
      front: cardFront.trim(),
      back: cardBack.trim(),
      tag: cardTag.trim() || 'Conceito',
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString().split('T')[0],
      state: 'new',
    };

    StorageService.update((draft) => {
      const d = draft.flashcardDecks.find((deck) => deck.id === activeDeck.id);
      if (d) d.cards.push(newCard);
    });

    setCardFront('');
    setCardBack('');
    setCardTag('');
    setNewCardModalOpen(false);
  };

  const handleAiGenerateDeck = async () => {
    if (!aiPromptTopic.trim()) return;
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: aiPromptTopic,
          subjectName: 'Estudos Universitários',
          contentText: aiPromptTopic,
          count: Number(aiCardCount),
        }),
      });

      const data = await response.json();
      if (data.success && data.flashcards?.length > 0) {
        const newDeckId = `deck-${Date.now()}`;
        const newDeck: FlashcardDeck = {
          id: newDeckId,
          semesterId: currentSemesterId,
          name: `Deck: ${aiPromptTopic}`,
          description: `Gerado por IA sobre ${aiPromptTopic}`,
          tags: ['#ia', '#revisao'],
          color: '#4A6B53',
          icon: 'Brain',
          cards: data.flashcards.map((f: any, i: number) => ({
            id: `card-${Date.now()}-${i}`,
            deckId: newDeckId,
            front: f.front,
            back: f.back,
            tag: f.tag || 'Conceito',
            repetitions: 0,
            intervalDays: 1,
            easeFactor: 2.5,
            nextReviewDate: new Date().toISOString().split('T')[0],
            state: 'new',
          })),
          createdAt: new Date().toISOString(),
        };

        StorageService.update((draft) => {
          draft.flashcardDecks.push(newDeck);
        });

        confetti({ particleCount: 80, spread: 70 });
        setAiGeneratorOpen(false);
        setActiveDeckId(newDeckId);
      } else {
        alert('Erro ao gerar com IA: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (!activeDeck) return;
    StorageService.update((draft) => {
      const d = draft.flashcardDecks.find((deck) => deck.id === activeDeck.id);
      if (d) d.cards = d.cards.filter((c) => c.id !== cardId);
    });
  };

  return (
    <div className="space-y-6">
      {/* If currently in Active Study Mode */}
      {isStudyMode && activeDeck ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Top study header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsStudyMode(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#919196] hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sair da Sessão
            </button>
            <div className="text-center">
              <h2 className="text-sm font-bold text-white">
                {activeDeck.name}
              </h2>
              <p className="text-[11px] text-[#919196]">
                Carta {currentCardIndex + 1} de {activeDeck.cards.length}
              </p>
            </div>
            <div className="w-16" />
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#1C1C1F] border border-[#242427] h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{
                width: `${((currentCardIndex + (studyCompleted ? 1 : 0)) / activeDeck.cards.length) * 100}%`,
              }}
            />
          </div>

          {!studyCompleted && currentCard ? (
            <div className="space-y-6">
              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[300px] sm:min-h-[360px] w-full bg-[#121214] rounded-3xl border border-[#242427] shadow-xl p-8 sm:p-10 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 hover:border-blue-500/40 group"
                style={{ perspective: '1000px' }}
              >
                {/* Top card indicator */}
                <div className="flex items-center justify-between text-xs text-[#919196] border-b border-[#242427] pb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1F] border border-[#242427] text-white font-bold uppercase text-[10px]">
                    {currentCard.tag || 'Flashcard'}
                  </span>
                  <span className="text-[11px] flex items-center gap-1 text-[#919196]">
                    <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    {isFlipped ? 'Verso (Resposta)' : 'Frente (Pergunta)'} — Clique para virar
                  </span>
                </div>

                {/* Card Content (Front or Back) */}
                <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                        {currentCard.front}
                      </p>
                      <p className="text-xs text-[#636366] pt-2">Clique na carta para ver a resposta</p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                        Resposta & Explicação
                      </span>
                      <p className="text-base sm:text-lg text-[#EDEDED] whitespace-pre-wrap leading-relaxed">
                        {currentCard.back}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom card hint */}
                <div className="text-center text-[11px] text-[#636366] border-t border-[#242427] pt-3">
                  Intervalo atual: {currentCard.intervalDays || 1} dias • Repetições: {currentCard.repetitions || 0}
                </div>
              </div>

              {/* Response Grading Buttons (Only visible when flipped) */}
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 animate-in fade-in duration-200">
                  <button
                    onClick={() => handleGradeCard('again')}
                    className="p-3 rounded-2xl bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/40 transition flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-xs font-bold">🔴 Não Lembro</span>
                    <span className="text-[10px] opacity-80 mt-0.5 text-red-300">1 min (Repetir)</span>
                  </button>

                  <button
                    onClick={() => handleGradeCard('hard')}
                    className="p-3 rounded-2xl bg-orange-950/30 text-orange-400 border border-orange-900/50 hover:bg-orange-900/40 transition flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-xs font-bold">🟠 Difícil</span>
                    <span className="text-[10px] opacity-80 mt-0.5 text-orange-300">1 dia</span>
                  </button>

                  <button
                    onClick={() => handleGradeCard('medium')}
                    className="p-3 rounded-2xl bg-blue-950/30 text-blue-400 border border-blue-900/50 hover:bg-blue-900/40 transition flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-xs font-bold">🟡 Bom</span>
                    <span className="text-[10px] opacity-80 mt-0.5 text-blue-300">3 dias</span>
                  </button>

                  <button
                    onClick={() => handleGradeCard('easy')}
                    className="p-3 rounded-2xl bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/40 transition flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-xs font-bold">🟢 Fácil</span>
                    <span className="text-[10px] opacity-80 mt-0.5 text-emerald-300">7 dias</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Revelar Resposta
                </button>
              )}
            </div>
          ) : (
            /* Study Session Completed Screen */
            <div className="bg-[#121214] rounded-3xl border border-[#242427] p-8 sm:p-10 text-center space-y-6 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                🏆
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Sessão Concluída!
                </h3>
                <p className="text-xs sm:text-sm text-[#919196] mt-1">
                  Você revisou todas as {activeDeck.cards.length} cartas do baralho "{activeDeck.name}".
                </p>
              </div>

              {/* Performance breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center p-4 bg-[#1C1C1F] border border-[#242427] rounded-2xl">
                <div>
                  <p className="text-xs text-[#919196]">Fácil</p>
                  <p className="text-lg font-bold text-emerald-400">{studyStats.easy}</p>
                </div>
                <div>
                  <p className="text-xs text-[#919196]">Bom</p>
                  <p className="text-lg font-bold text-blue-400">{studyStats.medium}</p>
                </div>
                <div>
                  <p className="text-xs text-[#919196]">Difícil</p>
                  <p className="text-lg font-bold text-orange-400">{studyStats.hard}</p>
                </div>
                <div>
                  <p className="text-xs text-[#919196]">Repetir</p>
                  <p className="text-lg font-bold text-red-400">{studyStats.again}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => startStudying(activeDeck.id)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Estudar Novamente
                </button>
                <button
                  onClick={() => setIsStudyMode(false)}
                  className="px-5 py-2.5 bg-[#1C1C1F] text-white border border-[#242427] text-xs font-bold rounded-xl hover:bg-[#242427] transition cursor-pointer"
                >
                  Voltar aos Baralhos
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeDeck && !isStudyMode ? (
        /* Deck Details and Cards List */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveDeckId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#919196] hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Todos os Baralhos
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewCardModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Carta
              </button>
              <button
                onClick={() => startStudying(activeDeck.id)}
                disabled={activeDeck.cards.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Iniciar Estudo ({activeDeck.cards.length})
              </button>
            </div>
          </div>

          <div className="bg-[#121214] p-6 rounded-3xl border border-[#242427] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-xs"
                style={{ backgroundColor: activeDeck.color }}
              >
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {activeDeck.name}
                </h1>
                <p className="text-xs text-[#919196]">{activeDeck.description}</p>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">
              Cartas no Baralho ({activeDeck.cards.length})
            </h3>

            {activeDeck.cards.length === 0 ? (
              <div className="text-center py-12 bg-[#121214] rounded-2xl border border-dashed border-[#242427] p-6">
                <p className="text-xs text-[#919196] mb-3">Nenhum flashcard neste baralho.</p>
                <button
                  onClick={() => setNewCardModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  + Adicionar Primeira Carta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeDeck.cards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl border border-[#242427] bg-[#121214] space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#919196] border-b border-[#242427] pb-1.5">
                      <span className="font-bold text-blue-400">#{idx + 1} • {card.tag || 'Conceito'}</span>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#919196] hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">
                        Pergunta: {card.front}
                      </p>
                      <p className="text-xs text-[#919196] leading-relaxed">
                        Resposta: {card.back}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Decks Overview Grid */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Flashcards & Repetição Espaçada
              </h1>
              <p className="text-xs sm:text-sm text-[#919196] mt-1">
                Memorize termos técnicos, anatomia, fórmulas e conceitos com o algoritmo Leitner
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiGeneratorOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Gerar com IA
              </button>
              <button
                onClick={() => setNewDeckModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Baralho
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar baralho de estudo..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-[#242427] bg-[#121214] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Decks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => {
              const discipline = db.disciplines.find((d) => d.id === deck.disciplineId);
              const masteredCount = deck.cards.filter((c) => c.state === 'mastered').length;

              return (
                <div
                  key={deck.id}
                  onClick={() => setActiveDeckId(deck.id)}
                  className="p-5 rounded-3xl bg-[#121214] border border-[#242427] shadow-xs hover:border-[#3A3A3E] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-1 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: deck.color }}
                      >
                        <Brain className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-[#919196] bg-[#1C1C1F] border border-[#242427] px-2.5 py-1 rounded-full">
                        {deck.cards.length} {deck.cards.length === 1 ? 'carta' : 'cartas'}
                      </span>
                    </div>

                    <div>
                      {discipline && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {discipline.name}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition mt-0.5">
                        {deck.name}
                      </h3>
                      <p className="text-xs text-[#919196] line-clamp-2 mt-1">
                        {deck.description || 'Baralho de estudos e memorização'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#242427] flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ {masteredCount} dominadas
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startStudying(deck.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Estudar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Deck Modal */}
      {newDeckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
              <h3 className="text-base font-bold text-white">
                Novo Baralho de Flashcards
              </h3>
              <button onClick={() => setNewDeckModalOpen(false)} className="text-[#919196] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Nome do Baralho *
                </label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Ex: Anatomia Topográfica — Membros"
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Disciplina Vinculada
                </label>
                <select
                  value={newDeckDisciplineId}
                  onChange={(e) => setNewDeckDisciplineId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
                >
                  <option value="">Geral</option>
                  {db.disciplines.filter((d) => d.semesterId === currentSemesterId).map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="Ex: Músculos, inervações e artérias"
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#242427]">
                <button
                  onClick={() => setNewDeckModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  Criar Baralho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Card Modal */}
      {newCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
              <h3 className="text-base font-bold text-white">
                Adicionar Flashcard ao Baralho
              </h3>
              <button onClick={() => setNewCardModalOpen(false)} className="text-[#919196] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Frente (Pergunta ou Conceito) *
                </label>
                <textarea
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="Ex: Qual o principal ramo da artéria carótida comum em equinos?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Verso (Resposta e Explicação) *
                </label>
                <textarea
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="Ex: Artéria carótida externa e interna..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Etiqueta / Tag (Opcional)
                </label>
                <input
                  type="text"
                  value={cardTag}
                  onChange={(e) => setCardTag(e.target.value)}
                  placeholder="Ex: Vasos Sanguíneos"
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#242427]">
                <button
                  onClick={() => setNewCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCard}
                  disabled={!cardFront.trim() || !cardBack.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  Adicionar Carta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Flashcard Generator Modal */}
      {aiGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Gerar Baralho Completo com IA
                </h3>
              </div>
              <button onClick={() => setAiGeneratorOpen(false)} className="text-[#919196] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#919196]">
                Digite o tema, ementa ou cole tópicos de uma aula para que a IA crie perguntas e respostas automáticas.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Tema / Conteúdo para o Baralho *
                </label>
                <textarea
                  value={aiPromptTopic}
                  onChange={(e) => setAiPromptTopic(e.target.value)}
                  placeholder="Ex: Farmacologia dos Anti-inflamatórios Não Esteroidais (AINEs): mecanismo de ação COX-1 e COX-2, efeitos colaterais e doses em cães e gatos."
                  rows={4}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#242427]">
                <button
                  onClick={() => setAiGeneratorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAiGenerateDeck}
                  disabled={!aiPromptTopic.trim() || aiLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiLoading ? 'Gerando com Gemini...' : 'Gerar Flashcards'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
