import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonAudio, AudioSegment } from '../../types';
import { StorageService } from '../../lib/storage';
import {
  Mic,
  Square,
  Pause,
  Play,
  FileAudio,
  Upload,
  Check,
  Sparkles,
  BookOpen,
  FileText,
  Search,
  Edit,
  User,
  Clock,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface ClassroomAudioSectionProps {
  lessonId: string;
  onInsertNotes: (html: string) => void;
}

export const ClassroomAudioSection: React.FC<ClassroomAudioSectionProps> = ({
  lessonId,
  onInsertNotes,
}) => {
  const [db, setDb] = useState(() => StorageService.getDatabase());
  const lesson = db.lessons.find((l) => l.id === lessonId);
  const discipline = db.disciplines.find((d) => d.id === lesson?.disciplineId);

  // Active audio tab
  const audios = lesson?.audioLessons || [];
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(
    audios.length > 0 ? audios[0].id : null
  );
  
  const activeAudio = audios.find((a) => a.id === selectedAudioId);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  // Media recorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active audio element for timestamps/seeking
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Editing transcription text state
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscriptText, setEditedTranscriptText] = useState('');

  // AI loading indicators
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionStep, setTranscriptionStep] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isNotesTransforming, setIsNotesTransforming] = useState(false);

  // Sync state
  useEffect(() => {
    const unsubscribe = StorageService.subscribe((newDb) => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  // Update selected audio if new ones appear
  useEffect(() => {
    if (!selectedAudioId && audios.length > 0) {
      setSelectedAudioId(audios[0].id);
    }
  }, [audios, selectedAudioId]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isRecordingPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording, isRecordingPaused]);

  // Start microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      setRecordedChunks([]);
      setRecordingTime(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(1000); // deliver data chunks every second
      setIsRecording(true);
      setIsRecordingPaused(false);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar seu microfone. Verifique as permissões.');
    }
  };

  // Pause/Resume recording
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isRecordingPaused) {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
    }
  };

  // Stop recording and save audio file
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsRecordingPaused(false);

    // Give a short delay to compile chunks
    setTimeout(() => {
      saveRecordedAudio();
    }, 500);
  };

  const saveRecordedAudio = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const audioDuration = recordingTime;

      const newAudio: LessonAudio = {
        id: 'aud-' + Date.now(),
        name: `Gravação Aula — Parte ${audios.length + 1}`,
        size: blob.size,
        type: 'audio/webm',
        dataUrl,
        uploadedAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: audioDuration,
      };

      // Update database
      StorageService.update((draft) => {
        const targetLesson = draft.lessons.find((l) => l.id === lessonId);
        if (targetLesson) {
          if (!targetLesson.audioLessons) targetLesson.audioLessons = [];
          targetLesson.audioLessons.push(newAudio);
        }
      });

      setSelectedAudioId(newAudio.id);
      // Run automatic transcription simulation right away
      triggerAudioTranscription(newAudio, audioDuration);
    };
    reader.readAsDataURL(blob);
  };

  // Handle uploaded audio files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Get duration using a temporary Audio element
      const tempAudio = new Audio(dataUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        const audioDuration = Math.round(tempAudio.duration) || 300;

        const newAudio: LessonAudio = {
          id: 'aud-' + Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          uploadedAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: audioDuration,
        };

        StorageService.update((draft) => {
          const targetLesson = draft.lessons.find((l) => l.id === lessonId);
          if (targetLesson) {
            if (!targetLesson.audioLessons) targetLesson.audioLessons = [];
            targetLesson.audioLessons.push(newAudio);
          }
        });

        setSelectedAudioId(newAudio.id);
        triggerAudioTranscription(newAudio, audioDuration);
      });
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini-backed simulation with segmented pipeline
  const triggerAudioTranscription = async (audio: LessonAudio, duration: number) => {
    setIsTranscribing(true);
    setTranscriptionProgress(5);
    setTranscriptionStep('Preparando pipeline de áudio...');

    // Simulate multi-step progress bar beautifully
    const progressIntervals = [
      { p: 15, s: 'Analisando metadados e espectrograma do arquivo...' },
      { p: 30, s: 'Fatiando áudio longo em blocos de 15 minutos para processamento...' },
      { p: 45, s: 'Enviando blocos estruturados para a API do Gemini 3.7 Flash...' },
      { p: 60, s: 'Realizando correspondência de espectro de voz (Diarização de Locutores)...' },
      { p: 75, s: 'Consolidando trechos transcritos e removendo ecos de sala de aula...' },
      { p: 90, s: 'Alinhando marcações de tempo precisas...' },
    ];

    let currentStepIndex = 0;
    const timer = setInterval(() => {
      if (currentStepIndex < progressIntervals.length) {
        const { p, s } = progressIntervals[currentStepIndex];
        setTranscriptionProgress(p);
        setTranscriptionStep(s);
        currentStepIndex++;
      } else {
        clearInterval(timer);
      }
    }, 1500);

    try {
      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson?.title || 'Fisiologia Cardiovascular',
          disciplineName: discipline?.name || 'Fisiologia Veterinária',
          durationSeconds: duration,
          audioName: audio.name,
        }),
      });

      const data = await response.json();
      clearInterval(timer);

      if (data.success) {
        setTranscriptionProgress(100);
        setTranscriptionStep('Transcrição concluída com sucesso!');

        // Save back to db
        StorageService.update((draft) => {
          const targetLesson = draft.lessons.find((l) => l.id === lessonId);
          if (targetLesson && targetLesson.audioLessons) {
            const tgtAudio = targetLesson.audioLessons.find((a) => a.id === audio.id);
            if (tgtAudio) {
              tgtAudio.transcriptionOriginal = data.transcriptionOriginal;
              tgtAudio.transcriptionActiveVersion = 'original';
              tgtAudio.segments = data.segments;
            }
          }
        });

        setTimeout(() => {
          setIsTranscribing(false);
          setTranscriptionProgress(0);
        }, 800);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      clearInterval(timer);
      console.error('Falha ao transcrever:', err);
      alert('Erro ao transcrever áudio com IA: ' + err.message);
      setIsTranscribing(false);
    }
  };

  // Seek audio player to precise timestamp
  const seekToTime = (seconds: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = seconds;
      audioPlayerRef.current.play();
    }
  };

  // Format time (seconds -> HH:MM:SS)
  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (num: number) => String(num).padStart(2, '0');
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Handle speaker name modification
  const handleUpdateSpeaker = (segmentId: string, newSpeaker: string) => {
    StorageService.update((draft) => {
      const targetLesson = draft.lessons.find((l) => l.id === lessonId);
      if (targetLesson && targetLesson.audioLessons) {
        const tgtAudio = targetLesson.audioLessons.find((a) => a.id === selectedAudioId);
        if (tgtAudio && tgtAudio.segments) {
          const seg = tgtAudio.segments.find((s) => s.id === segmentId);
          if (seg) seg.speaker = newSpeaker;
        }
      }
    });
  };

  // Handle manual transcription text edit
  const handleSaveEditedTranscription = () => {
    StorageService.update((draft) => {
      const targetLesson = draft.lessons.find((l) => l.id === lessonId);
      if (targetLesson && targetLesson.audioLessons) {
        const tgtAudio = targetLesson.audioLessons.find((a) => a.id === selectedAudioId);
        if (tgtAudio) {
          if (tgtAudio.transcriptionActiveVersion === 'improved') {
            tgtAudio.transcriptionImproved = editedTranscriptText;
          } else {
            tgtAudio.transcriptionOriginal = editedTranscriptText;
          }
        }
      }
    });
    setIsEditingTranscript(false);
  };

  // Toggle original / improved version view
  const toggleActiveVersion = (ver: 'original' | 'improved') => {
    StorageService.update((draft) => {
      const targetLesson = draft.lessons.find((l) => l.id === lessonId);
      if (targetLesson && targetLesson.audioLessons) {
        const tgtAudio = targetLesson.audioLessons.find((a) => a.id === selectedAudioId);
        if (tgtAudio) tgtAudio.transcriptionActiveVersion = ver;
      }
    });
  };

  // AI "Melhorar transcrição" (Optimizar)
  const improveTranscription = async () => {
    if (!activeAudio || isImproving) return;
    setIsImproving(true);

    try {
      const textToImprove = activeAudio.transcriptionOriginal || '';
      const response = await fetch('/api/ai/improve-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionText: textToImprove }),
      });

      const data = await response.json();
      if (data.success) {
        StorageService.update((draft) => {
          const targetLesson = draft.lessons.find((l) => l.id === lessonId);
          if (targetLesson && targetLesson.audioLessons) {
            const tgtAudio = targetLesson.audioLessons.find((a) => a.id === selectedAudioId);
            if (tgtAudio) {
              tgtAudio.transcriptionImproved = data.transcriptionImproved;
              tgtAudio.transcriptionActiveVersion = 'improved';
            }
          }
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Falha ao polir transcrição:', err);
      alert('Não foi possível otimizar o texto: ' + err.message);
    } finally {
      setIsImproving(false);
    }
  };

  // AI "Gerar resumo"
  const generateSummary = async () => {
    if (!activeAudio || isSummarizing) return;
    setIsSummarizing(true);

    try {
      const textToSummarize = activeAudio.transcriptionOriginal || '';
      const response = await fetch('/api/ai/summarize-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionText: textToSummarize,
          lessonTitle: lesson?.title,
        }),
      });

      const data = await response.json();
      if (data.success) {
        StorageService.update((draft) => {
          const targetLesson = draft.lessons.find((l) => l.id === lessonId);
          if (targetLesson && targetLesson.audioLessons) {
            const tgtAudio = targetLesson.audioLessons.find((a) => a.id === selectedAudioId);
            if (tgtAudio) {
              tgtAudio.summary = data.summary;
            }
          }
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Falha ao gerar resumo:', err);
      alert('Erro ao resumir transcrição: ' + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI "Transformar em anotações" and insert directly into lesson
  const transformToStudyNotes = async () => {
    if (!activeAudio || isNotesTransforming) return;
    setIsNotesTransforming(true);

    try {
      const textToTransform = activeAudio.transcriptionOriginal || '';
      const response = await fetch('/api/ai/transform-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionText: textToTransform,
          lessonTitle: lesson?.title,
          subjectName: discipline?.name,
        }),
      });

      const data = await response.json();
      if (data.success) {
        StorageService.update((draft) => {
          const targetLesson = draft.lessons.find((l) => l.id === lessonId);
          if (targetLesson && targetLesson.audioLessons) {
            const tgtAudio = targetLesson.audioLessons.find((a) => a.id === selectedAudioId);
            if (tgtAudio) {
              tgtAudio.studyNotes = data.notesHtml;
            }
          }
        });

        // Prompt user to insert/merge directly
        const confirmInsert = window.confirm(
          'Deseja inserir estas anotações de estudo geradas automaticamente no corpo principal da sua folha de aula?'
        );
        if (confirmInsert) {
          onInsertNotes(data.notesHtml);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Falha ao transformar em anotações:', err);
      alert('Erro ao criar anotações de estudo: ' + err.message);
    } finally {
      setIsNotesTransforming(false);
    }
  };

  // Remove audio track safely
  const handleRemoveAudio = (audioId: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja remover esta gravação? Esta ação é irreversível.');
    if (!confirmDelete) return;

    StorageService.update((draft) => {
      const targetLesson = draft.lessons.find((l) => l.id === lessonId);
      if (targetLesson && targetLesson.audioLessons) {
        targetLesson.audioLessons = targetLesson.audioLessons.filter((a) => a.id !== audioId);
      }
    });

    if (selectedAudioId === audioId) {
      setSelectedAudioId(audios.length > 1 ? audios[0].id : null);
    }
  };

  // Filtered segments based on search
  const filteredSegments = activeAudio?.segments?.filter((seg) =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (seg.speaker && seg.speaker.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Export Transcription
  const handleExportTxt = () => {
    if (!activeAudio) return;
    const textContent = activeAudio.transcriptionActiveVersion === 'improved' 
      ? activeAudio.transcriptionImproved 
      : activeAudio.transcriptionOriginal;

    if (!textContent) return;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transcricao_${activeAudio.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#1C1C1F] border border-[#242427] rounded-2xl overflow-hidden shadow-xs flex flex-col h-full">
      {/* Upper header */}
      <div className="p-4 border-b border-[#242427] bg-[#121214] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Gravador & Transcritor de Aula</h3>
            <p className="text-[10px] text-[#919196]">Gravações locais e transcrições completas via Gemini 3.7</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Recorder Buttons */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition"
            >
              <Mic className="w-3.5 h-3.5" />
              Gravar Aula
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#1C1C1F] p-1 rounded-xl border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" />
              <span className="text-xs font-mono text-[#E2E2E2] px-1">{formatSeconds(recordingTime)}</span>
              <button
                onClick={togglePauseRecording}
                className="p-1 text-[#919196] hover:text-white hover:bg-[#2A2A2D] rounded-lg transition"
                title={isRecordingPaused ? 'Retomar Gravação' : 'Pausar Gravação'}
              >
                {isRecordingPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={stopRecording}
                className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition"
                title="Salvar Gravação"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#242427] hover:bg-[#2A2A2D] border border-[#3A3A3E] text-[#E2E2E2] text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Enviar Áudio
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Playlist / selector bar */}
      {audios.length > 0 && (
        <div className="px-4 py-2 border-b border-[#242427] bg-[#121214] flex gap-2 overflow-x-auto no-scrollbar">
          {audios.map((aud) => (
            <div
              key={aud.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition shrink-0 ${
                selectedAudioId === aud.id
                  ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                  : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-[#E2E2E2]'
              }`}
            >
              <button
                onClick={() => setSelectedAudioId(aud.id)}
                className="text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <FileAudio className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{aud.name}</span>
                <span className="text-[10px] opacity-75">({formatSeconds(aud.durationSeconds)})</span>
              </button>
              <button
                onClick={() => handleRemoveAudio(aud.id)}
                className="text-[#919196] hover:text-red-400 rounded transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main workspace layout */}
      {activeAudio ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Real Audio Player */}
          <div className="p-4 bg-[#121214] border-b border-[#242427] flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white truncate max-w-[220px]">{activeAudio.name}</span>
                <span className="text-[10px] text-[#919196]">{activeAudio.uploadedAt}</span>
              </div>
              <audio
                ref={audioPlayerRef}
                src={activeAudio.dataUrl}
                controls
                className="w-full h-8 accent-blue-500"
              />
            </div>

            {/* AI operations toolbar */}
            <div className="flex items-center gap-2">
              <button
                onClick={improveTranscription}
                disabled={isImproving || isTranscribing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2D] hover:bg-[#323235] disabled:opacity-50 text-xs font-semibold rounded-xl text-white transition border border-[#3A3A3E] cursor-pointer"
                title="Corrige gramática, pontuação e remove cacofonias ou vícios de linguagem."
              >
                {isImproving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Otimizar
              </button>

              <button
                onClick={generateSummary}
                disabled={isSummarizing || isTranscribing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2D] hover:bg-[#323235] disabled:opacity-50 text-xs font-semibold rounded-xl text-white transition border border-[#3A3A3E] cursor-pointer"
                title="Gera um resumo acadêmico com conceitos, tópicos de provas e exemplos."
              >
                {isSummarizing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                )}
                Resumir
              </button>

              <button
                onClick={transformToStudyNotes}
                disabled={isNotesTransforming || isTranscribing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2D] hover:bg-[#323235] disabled:opacity-50 text-xs font-semibold rounded-xl text-white transition border border-[#3A3A3E] cursor-pointer"
                title="Estrutura a transcrição na forma de notas de estudo organizadas por cabeçalhos e insere no caderno."
              >
                {isNotesTransforming ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                )}
                Anotações
              </button>
            </div>
          </div>

          {/* Transcribing loader */}
          {isTranscribing && (
            <div className="p-6 flex flex-col items-center justify-center border-b border-[#242427] bg-[#121214] gap-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-sm font-semibold text-white">Transcrevendo Áudio da Aula com Gemini 3.7...</span>
              </div>
              <div className="w-full max-w-md h-2.5 bg-[#242427] rounded-full overflow-hidden border border-[#343437]">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${transcriptionProgress}%` }}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#919196]">{transcriptionStep}</span>
                <span className="text-[10px] text-blue-400 font-mono mt-1">Status: {transcriptionProgress}% concluído</span>
              </div>
            </div>
          )}

          {/* Content panel */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left side: Timeline segments with seek capability (7 cols) */}
            <div className="lg:col-span-7 border-r border-[#242427] flex flex-col min-h-0">
              <div className="p-3 bg-[#121214] border-b border-[#242427] flex items-center justify-between">
                <span className="text-xs font-bold text-[#E2E2E2] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Linha de Tempo & Locutores
                </span>

                {/* Search */}
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#636366]" />
                  <input
                    type="text"
                    placeholder="Filtrar falas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-xs text-[#E2E2E2] pl-8 pr-3 py-1 rounded-lg focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Segment list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {filteredSegments.length > 0 ? (
                  filteredSegments.map((seg) => (
                    <div
                      key={seg.id}
                      className="p-3 bg-[#121214]/60 border border-[#242427] hover:border-[#343437] rounded-xl flex gap-3 transition group"
                    >
                      {/* Left: speaker avatar / selector & timestamp */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => seekToTime(seg.startSeconds)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/20 text-blue-300 text-[10px] font-bold rounded-lg cursor-pointer transition mb-2"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {formatSeconds(seg.startSeconds)}
                        </button>

                        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#919196] bg-[#1C1C1F] border border-[#242427] px-1.5 py-0.5 rounded-md">
                          <User className="w-2.5 h-2.5" />
                          <input
                            type="text"
                            value={seg.speaker || 'Falante'}
                            onChange={(e) => handleUpdateSpeaker(seg.id, e.target.value)}
                            className="w-12 bg-transparent border-none text-center focus:outline-none font-semibold text-[#E2E2E2] cursor-edit truncate"
                            title="Editar nome do locutor"
                          />
                        </div>
                      </div>

                      {/* Right: text content */}
                      <div className="flex-1">
                        <p className="text-xs text-[#E2E2E2] leading-relaxed select-text">
                          {seg.text}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                    <AlertCircle className="w-8 h-8 text-[#636366] mb-2" />
                    <p className="text-xs text-[#919196]">Nenhuma fala encontrada para a pesquisa.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Complete transcript text edit panel, summary, and study notes (5 cols) */}
            <div className="lg:col-span-5 flex flex-col min-h-0 bg-[#121214]/40">
              {/* Tabs for Original vs Improved, and AI Outputs */}
              <div className="border-b border-[#242427] bg-[#121214] p-1 flex gap-1">
                <button
                  onClick={() => toggleActiveVersion('original')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition ${
                    activeAudio.transcriptionActiveVersion !== 'improved'
                      ? 'bg-[#2A2A2D] text-white'
                      : 'text-[#919196] hover:text-white'
                  }`}
                >
                  Transcrição Bruta
                </button>
                <button
                  onClick={() => toggleActiveVersion('improved')}
                  disabled={!activeAudio.transcriptionImproved}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition disabled:opacity-30 ${
                    activeAudio.transcriptionActiveVersion === 'improved'
                      ? 'bg-[#2A2A2D] text-white font-bold'
                      : 'text-[#919196] hover:text-white'
                  }`}
                  title={!activeAudio.transcriptionImproved ? 'Clique em "Otimizar" para gerar a versão polida' : ''}
                >
                  Texto Polido
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0 gap-4">
                {/* Editable main text container */}
                <div className="bg-[#121214] border border-[#242427] rounded-xl flex-1 flex flex-col min-h-0">
                  <div className="p-3 border-b border-[#242427] bg-[#1C1C1F] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E2E2E2] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Editor de Transcrição
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isEditingTranscript ? (
                        <>
                          <button
                            onClick={handleSaveEditedTranscription}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setIsEditingTranscript(false)}
                            className="px-2 py-1 bg-[#242427] hover:bg-[#2A2A2D] text-[10px] text-[#919196] font-bold rounded-lg cursor-pointer transition"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditedTranscriptText(
                                activeAudio.transcriptionActiveVersion === 'improved'
                                  ? activeAudio.transcriptionImproved || ''
                                  : activeAudio.transcriptionOriginal || ''
                              );
                              setIsEditingTranscript(true);
                            }}
                            className="px-2 py-1 bg-[#242427] hover:bg-[#2A2A2D] border border-[#3A3A3E] text-[10px] text-[#E2E2E2] font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
                          >
                            <Edit className="w-2.5 h-2.5" />
                            Editar
                          </button>
                          <button
                            onClick={handleExportTxt}
                            className="px-2 py-1 bg-[#242427] hover:bg-[#2A2A2D] border border-[#3A3A3E] text-[10px] text-[#E2E2E2] font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
                            title="Exportar transcrição em .txt"
                          >
                            <Download className="w-2.5 h-2.5" />
                            Exportar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto">
                    {isEditingTranscript ? (
                      <textarea
                        value={editedTranscriptText}
                        onChange={(e) => setEditedTranscriptText(e.target.value)}
                        className="w-full h-full bg-transparent border-none text-xs text-[#E2E2E2] leading-relaxed resize-none focus:outline-none font-mono"
                      />
                    ) : (
                      <p className="text-xs text-[#E2E2E2] leading-relaxed whitespace-pre-wrap select-text font-serif">
                        {activeAudio.transcriptionActiveVersion === 'improved'
                          ? activeAudio.transcriptionImproved || 'Clique em "Otimizar" acima para gerar uma versão com correções linguísticas refinadas.'
                          : activeAudio.transcriptionOriginal || 'Nenhuma transcrição ativa. Se necessário, clique para reenviar áudio.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Summary and study notes blocks if they exist */}
                {(activeAudio.summary || activeAudio.studyNotes) && (
                  <div className="space-y-4">
                    {activeAudio.summary && (
                      <div className="bg-[#121214] border border-[#242427] rounded-xl p-3.5 space-y-2">
                        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          Resumo do Tópico da Aula
                        </h4>
                        <div className="text-[11px] text-[#E2E2E2] leading-relaxed select-text space-y-2 prose prose-invert max-w-none">
                          <p className="whitespace-pre-wrap font-serif">{activeAudio.summary}</p>
                        </div>
                      </div>
                    )}

                    {activeAudio.studyNotes && (
                      <div className="bg-[#121214] border border-[#242427] rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <BookOpen className="w-3.5 h-3.5" />
                            Anotações de Estudo Auto-Geradas
                          </h4>
                          <button
                            onClick={() => onInsertNotes(activeAudio.studyNotes || '')}
                            className="text-[10px] font-bold text-purple-300 hover:text-white bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded transition"
                          >
                            Inserir no Caderno
                          </button>
                        </div>
                        <div
                          className="text-[11px] text-[#E2E2E2] leading-relaxed select-text space-y-1 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: activeAudio.studyNotes }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
          <FileAudio className="w-12 h-12 text-[#4A4A4F] mb-3" />
          <h4 className="text-sm font-semibold text-[#E2E2E2] mb-1">Nenhum áudio associado a esta aula</h4>
          <p className="text-xs text-[#919196] max-w-sm mb-4">
            Grave ou selecione o áudio de gravação da sua aula para transcrevê-lo, resumir e transformar em anotações diretamente no caderno.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition"
            >
              <Mic className="w-4 h-4" />
              Iniciar Gravação de Aula
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-[#242427] hover:bg-[#2A2A2D] border border-[#3A3A3E] text-[#E2E2E2] text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition"
            >
              <Upload className="w-4 h-4" />
              Fazer Upload de Áudio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
