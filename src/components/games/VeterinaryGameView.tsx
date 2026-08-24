import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../../lib/storage';
import { Lesson, FlashcardDeck } from '../../types';
import {
  Brain,
  Sparkles,
  Trophy,
  Timer,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  BookOpen,
  Layers,
  Award,
  ChevronRight,
  Settings as SettingsIcon,
  PlusCircle,
  Clock,
  Star,
  ExternalLink,
  BookOpenCheck,
  Check,
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- STUB / INTERFACE FOR COMPATIBILITY ---
// We keep this exported so that ThreeDCharacterCanvas.tsx continues to compile perfectly.
export interface CharacterConfig {
  gender: 'male' | 'female' | 'explorer';
  hair: 'short' | 'long' | 'curly' | 'bun';
  hairColor: string;
  clothing: 'lab_coat' | 'green_scrubs' | 'blue_scrubs' | 'safari';
  accessory: 'stethoscope' | 'goggles' | 'clipboard' | 'none';
  skinColor: string;
  [key: string]: any;
}

// --- PRE-MADE ACADEMIC CARD PAIRS FOR ALL SUBJECTS ---
interface BuiltInPair {
  id: string;
  front: string;
  back: string;
  category: string;
  explanation: string;
  icon?: string;
}

const BUILTIN_PAIRS: BuiltInPair[] = [
  // ANATOMIA
  {
    id: 'anat-1',
    category: 'Anatomia',
    front: 'Fêmur',
    back: 'Maior osso longo do esqueleto apendicular em mamíferos.',
    explanation: 'O fêmur articula-se proximalmente com o acetábulo do quadril e distalmente com a tíbia e patela.',
    icon: '🦴'
  },
  {
    id: 'anat-2',
    category: 'Anatomia',
    front: 'Miocárdio',
    back: 'Camada muscular intermediária e espessa do coração.',
    explanation: 'Formado por tecido muscular estriado cardíaco, é responsável pela contração involuntária (sístole).',
    icon: '🫀'
  },
  {
    id: 'anat-3',
    category: 'Anatomia',
    front: 'Nervo Vago',
    back: 'Décimo par de nervo craniano, principal via parassimpática.',
    explanation: 'Controla funções viscerais involuntárias como frequência cardíaca, peristaltismo e secreção glandular.',
    icon: '🧠'
  },
  {
    id: 'anat-4',
    category: 'Anatomia',
    front: 'Néfron',
    back: 'Unidade funcional e estrutural dos rins.',
    explanation: 'Cada rim contém milhares de néfrons que filtram o sangue, reabsorvem nutrientes e excretam urina.',
    icon: '💧'
  },
  
  // PATOLOGIA
  {
    id: 'pat-1',
    category: 'Patologia',
    front: 'Apoptose',
    back: 'Morte celular programada e controlada que não gera inflamação.',
    explanation: 'Ocorre com condensação da cromatina e formação de corpos apoptóticos que são fagocitados de forma limpa.',
    icon: '🔬'
  },
  {
    id: 'pat-2',
    category: 'Patologia',
    front: 'Necrose',
    back: 'Morte celular acidental acompanhada de lise e inflamação.',
    explanation: 'Geralmente causada por fatores nocivos graves como hipóxia severa, toxinas ou trauma físico.',
    icon: '🦠'
  },
  {
    id: 'pat-3',
    category: 'Patologia',
    front: 'Hipertrofia',
    back: 'Aumento do tamanho das células, resultando em aumento do órgão.',
    explanation: 'Causada por maior demanda funcional ou estimulação hormonal, comum em tecidos musculares.',
    icon: '💪'
  },
  {
    id: 'pat-4',
    category: 'Patologia',
    front: 'Isquemia',
    back: 'Redução do fluxo sanguíneo arterial para um tecido ou órgão.',
    explanation: 'Priva as células de oxigênio e nutrientes essenciais, podendo evoluir para infarto celular caso persista.',
    icon: '🛑'
  },

  // FISIOLOGIA
  {
    id: 'fis-1',
    category: 'Fisiologia',
    front: 'Insulina',
    back: 'Hormônio pancreático que reduz a glicose no sangue.',
    explanation: 'Secretado pelas células beta das ilhotas de Langerhans, promove o armazenamento de glicose nas células.',
    icon: '🧪'
  },
  {
    id: 'fis-2',
    category: 'Fisiologia',
    front: 'Hemoglobina',
    back: 'Proteína eritrocitária que transporta oxigênio e gás carbônico.',
    explanation: 'Contém ferro em sua estrutura heme, permitindo a ligação reversível com as moléculas de oxigênio.',
    icon: '🩸'
  },
  {
    id: 'fis-3',
    category: 'Fisiologia',
    front: 'Sinapse',
    back: 'Região de comunicação química ou elétrica entre dois neurônios.',
    explanation: 'Os neurotransmissores são liberados na fenda sináptica para estimular ou inibir o neurônio pós-sináptico.',
    icon: '⚡'
  },

  // PARASITOLOGIA
  {
    id: 'par-1',
    category: 'Parasitologia',
    front: 'Dictyocaulus viviparus',
    back: 'Parasita associado à broncopneumonia parasitária em bovinos.',
    explanation: 'Este nematódeo habita a traqueia e brônquios de ruminantes, provocando tosse crônica e dispneia.',
    icon: '🐾'
  },
  {
    id: 'par-2',
    category: 'Parasitologia',
    front: 'Toxoplasma gondii',
    back: 'Protozoário intracelular que tem felídeos como hospedeiros definitivos.',
    explanation: 'Causa a toxoplasmose, doença zoonótica que pode afetar o feto durante a gestação em humanos e ovelhas.',
    icon: '🐱'
  },

  // FARMACOLOGIA
  {
    id: 'far-1',
    category: 'Farmacologia',
    front: 'Dipirona',
    back: 'Analgésico, antipirético e espasmolítico amplamente prescrito.',
    explanation: 'Atua no sistema nervoso central inibindo a síntese de prostaglandinas e regulando a temperatura corporal.',
    icon: '💊'
  },
  {
    id: 'far-2',
    category: 'Farmacologia',
    front: 'Meloxicam',
    back: 'Anti-inflamatório não esteroidal (AINE) preferencial para COX-2.',
    explanation: 'Bloqueia seletivamente a ciclooxigenase-2 reduzindo a inflamação, com menos efeitos colaterais gástricos.',
    icon: '🧫'
  },

  // MICROBIOLOGIA
  {
    id: 'mic-1',
    category: 'Microbiologia',
    front: 'Pasteurização',
    back: 'Tratamento térmico de líquidos para destruir patógenos sem alterar o sabor.',
    explanation: 'Desenvolvido por Louis Pasteur, eleva a temperatura de alimentos de forma controlada seguida de resfriamento rápido.',
    icon: '🥛'
  },
  {
    id: 'mic-2',
    category: 'Microbiologia',
    front: 'Plasmídeo',
    back: 'Molécula de DNA dupla fita extracromossômica circular bacteriana.',
    explanation: 'Frequentemente carrega genes de resistência a antibióticos e pode ser transferido por conjugação.',
    icon: '🧬'
  }
];

// --- SOUND SPREE SYNTHESIZER ---
// Emits real academic-grade retro synth audio to keep the app 100% self-contained!
const playSound = (type: 'flip' | 'match' | 'error' | 'victory' | 'levelup') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'flip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'match') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.setValueAtTime(440.00, now + 0.08); // A4
      osc.frequency.setValueAtTime(523.25, now + 0.16); // C5
      osc.frequency.setValueAtTime(698.46, now + 0.24); // F5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'victory') {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const oscNode = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscNode.type = 'sine';
        oscNode.frequency.setValueAtTime(freq, now + idx * 0.07);
        gainNode.gain.setValueAtTime(0.07, now + idx * 0.07);
        gainNode.gain.linearRampToValueAtTime(0.005, now + idx * 0.07 + 0.25);
        oscNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscNode.start(now + idx * 0.07);
        oscNode.stop(now + idx * 0.07 + 0.3);
      });
    } else if (type === 'levelup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1174, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn('Audio feedback blocked or not supported:', e);
  }
};

// --- GAME CARD REPRESENTATION ---
interface MemoryCard {
  uniqueId: string; // unique identifier in current grid
  pairId: string;   // links front and back
  content: string;
  type: 'front' | 'back';
  isFlipped: boolean;
  isMatched: boolean;
  category: string;
  explanation: string;
  icon?: string;
  sourceName?: string;
}

// --- HISTORIC SESSIONS ---
interface GameSession {
  id: string;
  date: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'challenge';
  attempts: number;
  errors: number;
  timeSeconds: number;
  score: number;
  xp: number;
  accuracy: number;
}

// --- MANUAL CARD PAIR ---
interface CustomPair {
  id: string;
  front: string;
  back: string;
  category: string;
  explanation: string;
  icon?: string;
}

export const VeterinaryGameView: React.FC = () => {
  // --- STATE LISTING ---
  const [gameTab, setGameTab] = useState<'home' | 'play' | 'select_content' | 'custom_cards' | 'stats'>('home');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [cardStyle, setCardStyle] = useState<'minimalist' | 'academic' | 'terroso' | 'pastel' | 'veterinario' | 'papel' | 'caderno'>('veterinario');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'challenge'>('medium');
  const [studyMode, setStudyMode] = useState<'resumo' | 'perguntas' | 'revisao' | 'personalizado'>('resumo');
  
  // Game Live state
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastMatchText, setLastMatchText] = useState<{ front: string; back: string; explanation: string; source?: string } | null>(null);
  
  // Dynamic Academic Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('Todas');
  const [selectedContentSource, setSelectedContentSource] = useState<'all' | 'custom_only' | 'resumos_only'>('all');

  // Manual Card Creation State
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newCategory, setNewCategory] = useState('Anatomia');
  const [newExplanation, setNewExplanation] = useState('');
  const [newIcon, setNewIcon] = useState('🧠');

  // Custom pairs & persistent stats
  const [customPairs, setCustomPairs] = useState<CustomPair[]>([]);
  const [struggledConcepts, setStruggledConcepts] = useState<{ [id: string]: { name: string; count: number; category: string } }>({});
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [totalXp, setTotalXp] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load database structures to populate menus dynamically
  const academicDb = StorageService.getDatabase();
  const allDisciplines = academicDb.disciplines || [];
  const allLessons = academicDb.lessons || [];
  const allFlashcardDecks = academicDb.flashcardDecks || [];

  // --- INITIAL EFFECT: LOAD FROM LOCAL STORAGE ---
  useEffect(() => {
    // Custom manual cards
    const savedCustom = localStorage.getItem('unidoc_memory_custom_pairs');
    if (savedCustom) {
      try { setCustomPairs(JSON.parse(savedCustom)); } catch (e) { console.error(e); }
    }

    // Struggled cards tracking
    const savedStruggled = localStorage.getItem('unidoc_memory_struggled');
    if (savedStruggled) {
      try { setStruggledConcepts(JSON.parse(savedStruggled)); } catch (e) { console.error(e); }
    }

    // Sessions History
    const savedSessions = localStorage.getItem('unidoc_memory_sessions');
    if (savedSessions) {
      try { 
        const parsed = JSON.parse(savedSessions);
        setGameSessions(parsed);
        const xpSum = parsed.reduce((sum: number, s: any) => sum + (s.xp || 0), 0);
        setTotalXp(xpSum);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (isPlaying && timerEnabled) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timerEnabled]);

  // --- REVISÃO INTELIGENTE: SAVE DIFFICULT CONCEPTS ---
  const registerAttemptResult = (pairId: string, isCorrect: boolean, conceptName: string, categoryName: string) => {
    if (!isCorrect) {
      setStruggledConcepts((prev) => {
        const current = prev[pairId] || { name: conceptName, count: 0, category: categoryName };
        const updated = {
          ...prev,
          [pairId]: {
            ...current,
            count: current.count + 1
          }
        };
        localStorage.setItem('unidoc_memory_struggled', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // --- AUTO CARD ENGINE ---
  // Analyzes user notes, summaries, and flashcards, blending with built-in database
  const generateDeck = (subjectFilter: string, sourceMode: 'all' | 'custom_only' | 'resumos_only', isErrorReview: boolean = false) => {
    let pool: { id: string; front: string; back: string; category: string; explanation: string; icon?: string; sourceName?: string }[] = [];

    // 1. Incorporate Flashcard Decks (Automatic Integration of Flashcards)
    if (sourceMode !== 'custom_only') {
      allFlashcardDecks.forEach((deck: FlashcardDeck) => {
        const disciplineName = allDisciplines.find(d => d.id === deck.disciplineId)?.name || 'Geral';
        if (subjectFilter === 'Todas' || disciplineName.toLowerCase() === subjectFilter.toLowerCase()) {
          deck.cards.forEach((card) => {
            pool.push({
              id: `flash-${card.id}`,
              front: card.front,
              back: card.back,
              category: disciplineName,
              explanation: `Flashcard importado do deck "${deck.name}".`,
              icon: '🧬',
              sourceName: `Flashcards — ${deck.name}`
            });
          });
        }
      });
    }

    // 2. Incorporate Notebook Lessons (Automatic Integration of Summaries)
    if (sourceMode !== 'custom_only') {
      allLessons.forEach((lesson: Lesson) => {
        const disciplineName = allDisciplines.find(d => d.id === lesson.disciplineId)?.name || 'Geral';
        if (subjectFilter === 'Todas' || disciplineName.toLowerCase() === subjectFilter.toLowerCase()) {
          // Check if lesson has bullet summaries or standard reviewNotes
          if (lesson.summary && lesson.summary.trim().length > 10) {
            // Smart Extraction: split lines to find definition patterns
            const lines = lesson.summary.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes(':') && line.length > 15 && line.length < 180) {
                const parts = line.split(':');
                const term = parts[0].replace(/[-*•]/g, '').trim();
                const def = parts.slice(1).join(':').trim();
                if (term.length > 2 && def.length > 10) {
                  pool.push({
                    id: `lesson-sum-${lesson.id}-${idx}`,
                    front: term,
                    back: def,
                    category: disciplineName,
                    explanation: `Conceito extraído automaticamente do resumo da aula: "${lesson.title}".`,
                    icon: '📚',
                    sourceName: `Resumo — ${lesson.title}`
                  });
                }
              }
            });
          }
        }
      });
    }

    // 3. Incorporate Manual Custom Cards
    if (sourceMode !== 'resumos_only') {
      customPairs.forEach((pair) => {
        if (subjectFilter === 'Todas' || pair.category.toLowerCase() === subjectFilter.toLowerCase()) {
          pool.push({
            id: `custom-${pair.id}`,
            front: pair.front,
            back: pair.back,
            category: pair.category,
            explanation: pair.explanation || 'Carta personalizada criada pelo usuário.',
            icon: pair.icon || '➕',
            sourceName: 'Minhas Cartas Criadas'
          });
        }
      });
    }

    // 4. Fill up pool with built-in academic database so there is always plenty of content
    if (sourceMode === 'all') {
      BUILTIN_PAIRS.forEach((p) => {
        if (subjectFilter === 'Todas' || p.category.toLowerCase() === subjectFilter.toLowerCase()) {
          pool.push(p);
        }
      });
    }

    // If it's smart error review, filter pool to only include errored concepts
    if (isErrorReview) {
      const errorKeys = Object.keys(struggledConcepts);
      if (errorKeys.length > 0) {
        pool = pool.filter((p) => errorKeys.includes(p.id));
      }
    }

    // Fallback if pool is empty
    if (pool.length === 0) {
      pool = BUILTIN_PAIRS;
    }

    // Limit cards count based on difficulty size
    let pairsCount = 8;
    if (difficulty === 'easy') pairsCount = 4;
    if (difficulty === 'medium') pairsCount = 8;
    if (difficulty === 'hard') pairsCount = 12;
    if (difficulty === 'challenge') pairsCount = 16;

    // Shuffle pool and select target quantity
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selectedPairs = shuffledPool.slice(0, Math.min(pairsCount, shuffledPool.length));

    // Convert pairs to memory grid cards (one front card, one back card per pair)
    const finalCards: MemoryCard[] = [];
    selectedPairs.forEach((pair) => {
      // Front card definition
      finalCards.push({
        uniqueId: `${pair.id}-f`,
        pairId: pair.id,
        content: pair.front,
        type: 'front',
        isFlipped: false,
        isMatched: false,
        category: pair.category,
        explanation: pair.explanation,
        icon: pair.icon,
        sourceName: pair.sourceName || 'Geral'
      });

      // Corresponding back definition card
      finalCards.push({
        uniqueId: `${pair.id}-b`,
        pairId: pair.id,
        content: pair.back,
        type: 'back',
        isFlipped: false,
        isMatched: false,
        category: pair.category,
        explanation: pair.explanation,
        icon: pair.icon,
        sourceName: pair.sourceName || 'Geral'
      });
    });

    // Shuffle final deck
    return finalCards.sort(() => Math.random() - 0.5);
  };

  // --- INITIALIZE CONCRETE GAME RUN ---
  const startNewGame = (isErrorReview: boolean = false) => {
    const freshDeck = generateDeck(
      selectedSubject, 
      selectedContentSource, 
      isErrorReview
    );
    
    setCards(freshDeck);
    setSelectedIndices([]);
    setScore(0);
    setAttempts(0);
    setErrors(0);
    setSeconds(0);
    setStreak(0);
    setLastMatchText(null);
    setIsPlaying(true);
    setGameTab('play');
    if (soundEnabled) playSound('levelup');
  };

  // --- CARD SELECT/CLICK FLOW ---
  const handleCardClick = (index: number) => {
    // Block clicks during resolution or on already flipped/matched items
    if (selectedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;

    if (soundEnabled) playSound('flip');

    // Flip target card locally
    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const nextSelection = [...selectedIndices, index];
    setSelectedIndices(nextSelection);

    // Analyze pair matches if two cards are active
    if (nextSelection.length === 2) {
      const firstCard = cards[nextSelection[0]];
      const secondCard = cards[nextSelection[1]];
      setAttempts((a) => a + 1);

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH DETECTED!
        setTimeout(() => {
          const matchedDeck = updated.map((c, i) => {
            if (i === nextSelection[0] || i === nextSelection[1]) {
              return { ...c, isMatched: true };
            }
            return c;
          });
          setCards(matchedDeck);
          
          // Scores (+100 base, +50 streak)
          const bonus = streak * 50;
          setScore((s) => s + 100 + bonus);
          setStreak((st) => st + 1);
          if (soundEnabled) playSound('match');

          // Highlight the completed pair details
          setLastMatchText({
            front: firstCard.type === 'front' ? firstCard.content : secondCard.content,
            back: firstCard.type === 'back' ? firstCard.content : secondCard.content,
            explanation: firstCard.explanation,
            source: firstCard.sourceName
          });

          setSelectedIndices([]);

          // Trigger continuous check for win
          const isFinished = matchedDeck.every((c) => c.isMatched);
          if (isFinished) {
            handleVictory();
          }
        }, 600);

      } else {
        // ERROR MATCH
        registerAttemptResult(firstCard.pairId, false, firstCard.type === 'front' ? firstCard.content : secondCard.content, firstCard.category);
        setStreak(0);
        setErrors((e) => e + 1);

        setTimeout(() => {
          const resetDeck = updated.map((c, i) => {
            if (i === nextSelection[0] || i === nextSelection[1]) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          setCards(resetDeck);
          if (soundEnabled) playSound('error');
          setSelectedIndices([]);
        }, 1100);
      }
    }
  };

  // --- VICTORY RESOLUTION ---
  const handleVictory = () => {
    setIsPlaying(false);
    if (soundEnabled) playSound('victory');
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    // Calculate dynamic XP and metrics
    const basePairs = cards.length / 2;
    const accuracyPercent = Math.round((basePairs / attempts) * 100) || 100;
    const gainedXp = Math.round((basePairs * 15) + (accuracyPercent * 0.8));

    const newSession: GameSession = {
      id: `session-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      subject: selectedSubject,
      difficulty: difficulty,
      attempts: attempts + 1, // include final matching attempt
      errors: errors,
      timeSeconds: seconds,
      score: score + 200, // victory bonus
      xp: gainedXp,
      accuracy: accuracyPercent
    };

    const updatedSessions = [newSession, ...gameSessions];
    setGameSessions(updatedSessions);
    setTotalXp((x) => x + gainedXp);
    localStorage.setItem('unidoc_memory_sessions', JSON.stringify(updatedSessions));
  };

  // --- MANUAL CREATION ACTIONS ---
  const handleCreateCustomPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newPair: CustomPair = {
      id: `pair-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      category: newCategory,
      explanation: newExplanation.trim() || 'Anotação de revisão personalizada.',
      icon: newIcon
    };

    const updated = [newPair, ...customPairs];
    setCustomPairs(updated);
    localStorage.setItem('unidoc_memory_custom_pairs', JSON.stringify(updated));

    // Clear Form inputs
    setNewFront('');
    setNewBack('');
    setNewExplanation('');
    
    if (soundEnabled) playSound('levelup');
  };

  const deleteCustomPair = (id: string) => {
    const filtered = customPairs.filter((p) => p.id !== id);
    setCustomPairs(filtered);
    localStorage.setItem('unidoc_memory_custom_pairs', JSON.stringify(filtered));
  };

  // Clear tracking of struggled cards
  const clearStruggledRegistry = () => {
    setStruggledConcepts({});
    localStorage.removeItem('unidoc_memory_struggled');
  };

  // Visual style mappings for theme backgrounds
  const getCardStyleClasses = (flipped: boolean, matched: boolean) => {
    let base = "w-full aspect-[4/5] rounded-2xl cursor-pointer select-none relative transition-all duration-500 transform-style-3d shadow-md ";
    
    if (matched) {
      base += "border-2 border-emerald-500 scale-95 opacity-80 ";
    } else if (flipped) {
      base += "scale-100 ";
    } else {
      base += "hover:-translate-y-1 hover:shadow-lg ";
    }

    let styleSpecific = "";
    if (cardStyle === 'minimalist') {
      styleSpecific = flipped 
        ? "bg-slate-50 text-slate-800 border border-slate-300" 
        : "bg-slate-800 text-slate-100 border border-slate-700";
    } else if (cardStyle === 'academic') {
      styleSpecific = flipped 
        ? "bg-amber-50 text-amber-950 border-2 border-amber-800 font-serif" 
        : "bg-gradient-to-br from-indigo-900 to-slate-900 text-amber-100 border-2 border-amber-600/30 font-serif";
    } else if (cardStyle === 'terroso') {
      styleSpecific = flipped 
        ? "bg-[#FAF6EE] text-amber-950 border-2 border-[#8C6239]" 
        : "bg-[#8C6239] text-[#FAF6EE] border-2 border-[#EAE3D5]";
    } else if (cardStyle === 'pastel') {
      styleSpecific = flipped 
        ? "bg-purple-50 text-purple-950 border border-purple-200" 
        : "bg-gradient-to-br from-indigo-100 to-purple-100 text-purple-900 border border-indigo-200";
    } else if (cardStyle === 'papel') {
      styleSpecific = flipped 
        ? "bg-white text-stone-900 border-2 border-dashed border-stone-300 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" 
        : "bg-stone-100 text-stone-600 border-2 border-dashed border-stone-300";
    } else if (cardStyle === 'caderno') {
      styleSpecific = flipped 
        ? "bg-amber-50/70 text-stone-900 border-l-4 border-red-500 border-y border-r border-amber-200/50" 
        : "bg-amber-100 text-amber-900 border-2 border-amber-200";
    } else {
      // VETERINARIO (Default)
      styleSpecific = flipped 
        ? "bg-emerald-50 text-emerald-950 border-2 border-emerald-700" 
        : "bg-gradient-to-br from-emerald-800 to-teal-900 text-emerald-50 border-2 border-emerald-600/30";
    }

    return base + " " + styleSpecific;
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="memory_game_wrapper" className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* HEADER BANNER */}
      <div id="memory_game_header" className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5 animate-pulse" />
            Fixação Inteligente
          </div>
          <h1 className="text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            🧠 Jogo da Memória
          </h1>
          <p className="text-stone-500 dark:text-stone-400 max-w-xl text-sm leading-relaxed">
            Substituímos o antigo simulador por este novo ecossistema integrado: suas anotações, flashcards e resumos da faculdade são convertidos automaticamente em desafios práticos de memorização.
          </p>
        </div>

        {/* PROFILE STAT PANEL */}
        <div className="flex items-center gap-4 bg-white dark:bg-[#1E1E22] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm min-w-[200px]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl shadow-md">
            🏆
          </div>
          <div>
            <div className="text-xs text-stone-400">Total Acumulado</div>
            <div className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">{totalXp} XP</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 fill-emerald-500 stroke-none" />
              Mestre em Anatomia
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL TAB SELECTOR */}
      <div id="memory_game_tabs" className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setGameTab('home')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            gameTab === 'home' || gameTab === 'play'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850'
          }`}
        >
          🎮 Jogar Partida
        </button>
        <button
          onClick={() => setGameTab('select_content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            gameTab === 'select_content'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850'
          }`}
        >
          📚 Escolher Matéria
        </button>
        <button
          onClick={() => setGameTab('custom_cards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            gameTab === 'custom_cards'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850'
          }`}
        >
          ➕ Criar Cartas ({customPairs.length})
        </button>
        <button
          onClick={() => setGameTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            gameTab === 'stats'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850'
          }`}
        >
          📊 Desempenho & Revisão
        </button>
      </div>

      {/* TAB CONTENTS */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: HOME PAGE (PRE-SETUP & GAME LAUNCHER) */}
        {gameTab === 'home' && (
          <motion.div
            key="tab-home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* SETUP CONTAINER */}
            <div className="lg:col-span-2 bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 space-y-6">
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                ⚙️ Configurações da Rodada
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* DIFFICULTY */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider text-stone-400 block">Dificuldade & Tabuleiro</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'easy', label: 'Fácil', pairs: '4 pares (8 cartas)', color: 'text-emerald-500' },
                      { key: 'medium', label: 'Médio', pairs: '8 pares (16 cartas)', color: 'text-amber-500' },
                      { key: 'hard', label: 'Difícil', pairs: '12 pares (24 cartas)', color: 'text-orange-500' },
                      { key: 'challenge', label: 'Desafio', pairs: '16 pares (32 cartas)', color: 'text-red-500' }
                    ].map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDifficulty(d.key as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          difficulty === d.key
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm'
                            : 'bg-white dark:bg-[#1E1E22] border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className={`text-xs font-black uppercase tracking-wider ${d.color}`}>{d.label}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">{d.pairs}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARD STYLE */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider text-stone-400 block">Estilo Temático das Cartas</label>
                  <select
                    value={cardStyle}
                    onChange={(e) => setCardStyle(e.target.value as any)}
                    className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1E22] text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="veterinario">🩺 Estilo Veterinário (Patinhas)</option>
                    <option value="academic">🏛️ Clássico Acadêmico</option>
                    <option value="minimalist">⬜ Minimalista Elegante</option>
                    <option value="terroso">🍂 Tons Terrosos Orgânicos</option>
                    <option value="pastel">🌸 Paleta Pastel Suave</option>
                    <option value="papel">📝 Papel Quadriculado</option>
                    <option value="caderno">📒 Caderno Espiral Legal Pad</option>
                  </select>
                </div>

                {/* DYNAMIC MATERIAL FILTER */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider text-stone-400 block">Filtrar por Disciplina</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1E22] text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Todas">📚 Todas as Matérias</option>
                    {allDisciplines.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    {/* Fallback mock categories if disciplines array is empty */}
                    {allDisciplines.length === 0 && (
                      <>
                        <option value="Anatomia">🦴 Anatomia</option>
                        <option value="Patologia">🔬 Patologia</option>
                        <option value="Fisiologia">🫀 Fisiologia</option>
                        <option value="Parasitologia">🦠 Parasitologia</option>
                        <option value="Farmacologia">💊 Farmacologia</option>
                        <option value="Microbiologia">🧫 Microbiologia</option>
                      </>
                    )}
                  </select>
                </div>

                {/* INTEGRATION SOURCES */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider text-stone-400 block">Fonte das Cartas</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedContentSource('all')}
                      className={`flex-1 py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                        selectedContentSource === 'all'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-400'
                          : 'bg-white dark:bg-[#1E1E22] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      ✨ Completo (Tudo)
                    </button>
                    <button
                      onClick={() => setSelectedContentSource('resumos_only')}
                      className={`flex-1 py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                        selectedContentSource === 'resumos_only'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-400'
                          : 'bg-white dark:bg-[#1E1E22] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      📚 Meus Resumos
                    </button>
                  </div>
                </div>
              </div>

              {/* AUXILIARY CONFIGS */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-stone-200 dark:border-stone-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-400">
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Efeitos Sonoros Synthesized
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    Ativar Cronômetro (Desafio de Tempo)
                  </span>
                </label>
              </div>

              {/* ACTION LAUNCH BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => startNewGame(false)}
                  className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Iniciar Jogo da Memória
                </button>
                
                {Object.keys(struggledConcepts).length > 0 && (
                  <button
                    onClick={() => startNewGame(true)}
                    className="py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    🔁 Revisar Erros ({Object.keys(struggledConcepts).length})
                  </button>
                )}
              </div>
            </div>

            {/* QUICK STATS & INTRO OVERVIEW */}
            <div className="space-y-6">
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-stone-400">Como funciona o Ciclo</h3>
                
                <div className="space-y-4 text-xs font-medium text-stone-600 dark:text-stone-400">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</div>
                    <p>O algoritmo analisa seus resumos, anotações e flashcards cadastrados.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</div>
                    <p>Pares de conceito-definição são fatiados e espalhados pelo tabuleiro.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">3</div>
                    <p>O jogo registra as cartas que você mais erra, criando revisões focadas.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-400">Matérias Ativas</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {allDisciplines.length || 6} Disponíveis
                  </span>
                </div>
              </div>

              {/* SYSTEM NOTICE */}
              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-3xl p-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-400 uppercase tracking-wider">Integração Automática</h4>
                    <p className="text-xs text-amber-800 dark:text-amber-500/90 leading-relaxed">
                      Se você ainda não possui resumos ou flashcards cadastrados no caderno digital, o jogo disponibiliza automaticamente nosso banco de dados acadêmico padrão para você começar hoje mesmo!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: LIVE GRID GAMEPLAY SCREEN */}
        {gameTab === 'play' && (
          <motion.div
            key="tab-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* SCOREBAR & LIVE DASH */}
            <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-4 md:p-6 flex flex-wrap items-center justify-between gap-4">
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">Pontuação</div>
                  <div className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">{score}</div>
                </div>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                
                <div className="text-center">
                  <div className="text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">Tentativas</div>
                  <div className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">{attempts}</div>
                </div>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />

                <div className="text-center">
                  <div className="text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">Erros</div>
                  <div className="text-2xl font-serif font-black text-red-500">{errors}</div>
                </div>

                {timerEnabled && (
                  <>
                    <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">Tempo</div>
                      <div className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100 flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
                        {formatTime(seconds)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {streak > 1 && (
                <div className="px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  🔥 Combo {streak}x!
                </div>
              )}

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setGameTab('home');
                }}
                className="py-2.5 px-4 bg-stone-200 dark:bg-stone-850 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                🏳️ Desistir e Sair
              </button>
            </div>

            {/* CARD GRID LAYOUT */}
            {cards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {cards.map((card, index) => {
                  const isFlipped = card.isFlipped || card.isMatched;
                  return (
                    <div
                      key={card.uniqueId}
                      onClick={() => handleCardClick(index)}
                      className={getCardStyleClasses(isFlipped, card.isMatched)}
                    >
                      {/* CARD FRONT & BACK FLIP CONTAINER */}
                      <div className="w-full h-full relative transition-transform duration-500 select-none">
                        
                        {/* CARD COVER BACK (VIRADA PARA BAIXO) */}
                        {!isFlipped && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center rounded-2xl bg-gradient-to-br from-[#1C4E3A] to-[#0A261C] text-emerald-200 overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:12px_12px]" />
                            <div className="w-10 h-10 rounded-full bg-emerald-700/40 flex items-center justify-center text-lg shadow-inner">
                              🧬
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest mt-3 opacity-80">
                              UniDoc Vet
                            </span>
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 animate-bounce" />
                          </div>
                        )}

                        {/* CARD FACE FRONT (VIRADA PARA CIMA / CONTEÚDO) */}
                        {isFlipped && (
                          <div className="absolute inset-0 flex flex-col justify-between p-3.5 text-center rounded-2xl overflow-hidden">
                            {/* Academic badge on face */}
                            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-stone-400">
                              <span>{card.category}</span>
                              <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1 rounded-sm">
                                {card.type === 'front' ? 'Termo' : 'Def.'}
                              </span>
                            </div>

                            {/* Center textual body */}
                            <div className="flex-1 flex items-center justify-center py-2">
                              <p className="text-xs md:text-sm font-extrabold text-stone-800 dark:text-stone-200 leading-snug break-words">
                                {card.content}
                              </p>
                            </div>

                            {/* Card footprint/icon */}
                            <div className="text-lg opacity-80 mt-1">
                              {card.icon || '🐾'}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-[#1E1E22] rounded-3xl border border-stone-200 dark:border-stone-800 p-8">
                <Brain className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 font-bold">Nenhuma carta encontrada para este filtro.</p>
                <button
                  onClick={() => setGameTab('home')}
                  className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Voltar e Ajustar Filtro
                </button>
              </div>
            )}

            {/* DYNAMIC POST-MATCH EXPLANATORY CARD (Requisito 10) */}
            <AnimatePresence>
              {lastMatchText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-3xl p-5 md:p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                        ✅ Par Encontrado!
                      </h4>
                    </div>
                    {lastMatchText.source && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-2.5 py-1 rounded-full font-black">
                        📖 {lastMatchText.source}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white dark:bg-[#1A1A1E] p-3 rounded-2xl border border-stone-100 dark:border-stone-850">
                      <span className="text-[9px] uppercase font-bold text-stone-400">Conceito / Termo</span>
                      <p className="text-xs font-extrabold text-stone-800 dark:text-stone-200 mt-1">{lastMatchText.front}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1E] p-3 rounded-2xl border border-stone-100 dark:border-stone-850">
                      <span className="text-[9px] uppercase font-bold text-stone-400">Explicação / Significado</span>
                      <p className="text-xs font-medium text-stone-800 dark:text-stone-200 mt-1">{lastMatchText.back}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-100/30 dark:bg-emerald-950/10 p-3.5 rounded-2xl text-xs text-emerald-900 dark:text-emerald-400 font-medium leading-relaxed">
                    <strong>Definição Acadêmica:</strong> {lastMatchText.explanation}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setLastMatchText(null)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Continuar Jogando ➔
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LIVE CONCLUÍDO OVERLAY MODAL (Victory Popup) */}
            {!isPlaying && cards.length > 0 && cards.every((c) => c.isMatched) && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 animate-pulse" />
                  
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
                    🎉
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif font-black text-stone-950 dark:text-stone-100">
                      Rodada Concluída!
                    </h2>
                    <p className="text-stone-400 text-xs">Parabéns! Excelente fixação dos conteúdos.</p>
                  </div>

                  {/* SCORE LOG METRICS */}
                  <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl text-left">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-black block">Pares Encontrados</span>
                      <strong className="text-sm font-black text-stone-900 dark:text-stone-100">
                        {cards.length / 2}/{cards.length / 2}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-black block">Tentativas totais</span>
                      <strong className="text-sm font-black text-stone-900 dark:text-stone-100">
                        {attempts}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-black block">Tempo de Jogo</span>
                      <strong className="text-sm font-black text-stone-900 dark:text-stone-100">
                        {formatTime(seconds)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-black block">Recompensa</span>
                      <strong className="text-sm font-black text-emerald-600 flex items-center gap-1">
                        +{Math.round((cards.length / 2) * 15 + 80)} XP
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setGameTab('stats')}
                      className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      📊 Ver Desempenho
                    </button>
                    <button
                      onClick={() => {
                        setGameTab('home');
                        setCards([]);
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-600/10 cursor-pointer"
                    >
                      🔄 Nova Partida
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: SUBJECT SELECT & ACADEMIC SOURCES */}
        {gameTab === 'select_content' && (
          <motion.div
            key="tab-select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-serif font-black text-stone-900 dark:text-stone-100">
                📚 Escolha Sua Matéria Ativa
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-xs">
                Selecione qual assunto ou matéria específica você deseja focar na próxima rodada do Jogo da Memória. O sistema priorizará os resumos associados.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <button
                  onClick={() => {
                    setSelectedSubject('Todas');
                    setGameTab('home');
                  }}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedSubject === 'Todas'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1E22]'
                  }`}
                >
                  <div className="text-xl">🎓</div>
                  <div className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 mt-2">Todas as Matérias</div>
                  <p className="text-[10px] text-stone-400 mt-1">Mistura todo o conteúdo para um desafio mais amplo.</p>
                </button>

                {allDisciplines.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedSubject(d.name);
                      setGameTab('home');
                    }}
                    className={`p-4 rounded-2xl border text-left transition ${
                      selectedSubject === d.name
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1E22]'
                    }`}
                  >
                    <div className="text-xl" style={{ color: d.color }}>🧬</div>
                    <div className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 mt-2">{d.name}</div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {allLessons.filter(l => l.disciplineId === d.id).length} resumo(s) • {allFlashcardDecks.filter(f => f.disciplineId === d.id).length} deck(s)
                    </p>
                  </button>
                ))}

                {/* Fallback mockup materias if empty */}
                {allDisciplines.length === 0 && [
                  { name: 'Anatomia', icon: '🦴', count: '4 resumos' },
                  { name: 'Patologia', icon: '🔬', count: '6 resumos' },
                  { name: 'Fisiologia', icon: '🫀', count: '5 resumos' },
                  { name: 'Parasitologia', icon: '🦠', count: '3 resumos' },
                  { name: 'Farmacologia', icon: '💊', count: '4 resumos' }
                ].map((d) => (
                  <button
                    key={d.name}
                    onClick={() => {
                      setSelectedSubject(d.name);
                      setGameTab('home');
                    }}
                    className={`p-4 rounded-2xl border text-left transition ${
                      selectedSubject === d.name
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1E22]'
                    }`}
                  >
                    <div className="text-xl">{d.icon}</div>
                    <div className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 mt-2">{d.name}</div>
                    <p className="text-[10px] text-stone-400 mt-1">{d.count} • 8 cartas padrão</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: MANUAL CARD BUILDER */}
        {gameTab === 'custom_cards' && (
          <motion.div
            key="tab-custom"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* BUILDER FORM */}
            <div className="lg:col-span-1 bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6">
              <form onSubmit={handleCreateCustomPair} className="space-y-4">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Criar Novo Par Manual
                  </h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-stone-400">Termo ou Conceito (Frente)</label>
                  <input
                    type="text"
                    required
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    placeholder="Ex: Apoptose"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1A1A1E] text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-stone-400">Significado / Resposta (Verso)</label>
                  <textarea
                    required
                    rows={2}
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    placeholder="Ex: Morte celular programada de forma limpa e controlada."
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1A1A1E] text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-stone-400">Disciplina</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1A1A1E] text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Anatomia">🦴 Anatomia</option>
                      <option value="Patologia">🔬 Patologia</option>
                      <option value="Fisiologia">🫀 Fisiologia</option>
                      <option value="Parasitologia">🦠 Parasitologia</option>
                      <option value="Farmacologia">💊 Farmacologia</option>
                      <option value="Microbiologia">🧫 Microbiologia</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-stone-400">Ícone</label>
                    <select
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1A1A1E] text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="🧠">🧠 Cérebro</option>
                      <option value="🦴">🦴 Osso</option>
                      <option value="🔬">🔬 Patologia</option>
                      <option value="🫀">🫀 Coração</option>
                      <option value="💊">💊 Comprimido</option>
                      <option value="🐱">🐱 Gatinho</option>
                      <option value="🧬">🧬 Genética</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-stone-400">Explicação Adicional / Fonte</label>
                  <input
                    type="text"
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="Ex: Resumos de Patologia — Aula 04"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1A1A1E] text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Salvar Par na Biblioteca
                </button>
              </form>
            </div>

            {/* CUSTOM CARDS LIBRARY */}
            <div className="lg:col-span-2 bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                📚 Biblioteca de Cartas Criadas Manualmente
              </h3>

              {customPairs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {customPairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="bg-white dark:bg-[#1E1E22] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{pair.icon || '🧠'}</span>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 rounded">
                            {pair.category}
                          </span>
                        </div>
                        <div className="text-xs font-black text-stone-900 dark:text-stone-100">
                          {pair.front}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                          {pair.back}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => deleteCustomPair(pair.id)}
                        className="text-stone-300 hover:text-red-500 self-start p-1.5 transition cursor-pointer"
                        title="Excluir carta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-[#1E1E22] border border-stone-200 dark:border-stone-800 rounded-2xl">
                  <Layers className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-400">Você ainda não criou nenhuma carta personalizada.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 5: INTEL REVISION & DESEMPENHO STATS */}
        {gameTab === 'stats' && (
          <motion.div
            key="tab-stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* OVERALL STATS BARS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-5">
                <span className="text-[10px] text-stone-400 uppercase font-black block">Partidas Jogadas</span>
                <strong className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                  {gameSessions.length}
                </strong>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-5">
                <span className="text-[10px] text-stone-400 uppercase font-black block">Precisão Média</span>
                <strong className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                  {gameSessions.length > 0
                    ? Math.round(gameSessions.reduce((sum, s) => sum + s.accuracy, 0) / gameSessions.length)
                    : 0}%
                </strong>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-5">
                <span className="text-[10px] text-stone-400 uppercase font-black block">Pontos Totais</span>
                <strong className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                  {gameSessions.reduce((sum, s) => sum + s.score, 0)}
                </strong>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-5">
                <span className="text-[10px] text-stone-400 uppercase font-black block">Dificuldade Frequente</span>
                <strong className="text-2xl font-serif font-black text-emerald-600 uppercase">
                  MÉDIO
                </strong>
              </div>
            </div>

            {/* STRUGGLED CONCEPTS REGISTRY (Intelligent Revision System) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-stone-400">
                    🔴 Conteúdos com Mais Dificuldade
                  </h3>
                  {Object.keys(struggledConcepts).length > 0 && (
                    <button
                      onClick={clearStruggledRegistry}
                      className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-wider"
                    >
                      Limpar Registro
                    </button>
                  )}
                </div>

                {Object.keys(struggledConcepts).length > 0 ? (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {Object.keys(struggledConcepts)
                      .map((id) => ({ id, ...struggledConcepts[id] }))
                      .sort((a, b) => b.count - a.count)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-[#1A1A1E] p-3 rounded-2xl border border-stone-100 dark:border-stone-850 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-[9px] uppercase font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 rounded">
                              {item.category}
                            </span>
                            <div className="text-xs font-extrabold text-stone-800 dark:text-stone-200 mt-1">
                              {item.name}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] font-black text-stone-400 block uppercase">Flipped Erros</span>
                            <strong className="text-sm text-red-500 font-serif font-black">{item.count} vezes</strong>
                          </div>
                        </div>
                      ))}

                    <div className="pt-2">
                      <button
                        onClick={() => startNewGame(true)}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Revisar Erros com o Jogo da Memória
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white dark:bg-[#1A1A1E] border border-stone-100 dark:border-stone-850 rounded-2xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-stone-400">Parabéns! Nenhum erro persistente registrado ainda.</p>
                  </div>
                )}
              </div>

              {/* RECENT HISTORIC SESSIONS */}
              <div className="bg-[#FAF8F5] dark:bg-[#151518] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl p-6 space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-stone-400">
                  ⌛ Histórico de Sessões Recentes
                </h3>

                {gameSessions.length > 0 ? (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {gameSessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="bg-white dark:bg-[#1A1A1E] p-3 rounded-2xl border border-stone-100 dark:border-stone-850 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-stone-900 dark:text-stone-100">
                            Foco: {session.subject}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Data: {session.date} • {session.difficulty.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-stone-400 uppercase font-black block">Precisão</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-serif font-black">{session.accuracy}%</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-[#1A1A1E] border border-stone-100 dark:border-stone-850 rounded-2xl">
                    <Layers className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-400">Nenhum registro de partida concluída.</p>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
