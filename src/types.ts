/**
 * Type definitions for Caderno Digital Universitário
 */

export type ThemeType = 'sage' | 'dark' | 'light' | 'material_you' | 'lavender' | 'warm_academic' | 'ocean' | 'custom' | 'minimalist' | 'academic' | 'nature' | 'pastel' | 'dark_academia' | 'blue' | 'purple' | 'black';

export interface CustomThemeColors {
  primary: string;
  secondary: string;
  button: string;
  menu: string;
  icon: string;
  highlight: string;
  text: string;
  background: string;
  card: string;
  sidebar: string;
  topbar: string;
}

export interface WidgetConfig {
  id: string; // 'profile_banner' | 'stats' | 'priority_tasks' | 'schedule' | 'recent_lessons' | 'upcoming_exams' | 'disciplines' | 'motivation_widget' | etc.
  title: string;
  visible: boolean;
  size: 'sm' | 'md' | 'lg' | 'full'; // column width spanning
  position: number;
  style?: 'minimalist' | 'bordered' | 'glass' | 'pastel' | 'academic';
  transparency?: 'none' | 'subtle' | 'high' | 'full';
  borders?: 'none' | 'thin' | 'thick';
  borderRadius?: 'none' | 'md' | 'lg' | '2xl' | '3xl';
  themeMode?: 'auto' | 'light' | 'dark';
  customTitle?: string;
  customIcon?: string;
  settings?: Record<string, any>;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  avatar?: string;
  bannerUrl: string;
  banner?: string;
  course: string;
  institution: string;
  university?: string;
  studentId?: string;
  quote: string;
  bio?: string;
  quoteAuthor?: string;
  theme: ThemeType | 'dark' | 'light';
  primaryColor: string;
  isDarkMode: boolean;
  activeSemesterId: string;
  // NEW: Personalization preferences
  themeMode?: 'light' | 'dark' | 'auto';
  customThemeColors?: CustomThemeColors;
  favoriteColors?: string[];
  dashboardBgType?: 'color' | 'image';
  dashboardBgColor?: string;
  dashboardWallpaperUrl?: string;
  dashboardWallpaperOpacity?: number;
  avatarOriginal?: string;
  avatarEditParams?: any;
  dashboardWallpaperOriginal?: string;
  dashboardWallpaperEditParams?: any;
  widgetsConfig?: WidgetConfig[];
}

export interface Semester {
  id: string;
  name: string; // e.g. "2026/2 — 5º Período"
  periodNumber: number; // e.g. 5
  period?: number;
  year: number; // e.g. 2026
  code?: string;
  startDate?: string;
  endDate?: string;
  institution?: string;
  course?: string;
  isActive?: boolean;
  isArchived: boolean;
  color?: string;
  observations?: string;
  createdAt: string;
}

export interface WeeklySlot {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "10:00"
  room?: string;
  campus?: string;
  notes?: string;
}

export interface DisciplineGrades {
  prova?: number;
  trabalhos?: number;
  eds?: number;
  seminarios?: number;
  projetos?: number;
}

export interface AbsenceLog {
  id: string;
  date: string;
  classesCount: number;
  hoursCount: number;
}

export interface Discipline {
  id: string;
  semesterId: string;
  name: string;
  code?: string;
  professor?: string;
  room?: string;
  campus?: string;
  color: string;
  icon?: string;
  coverImage?: string;
  workloadHours?: number;
  observations?: string;
  scheduleSlots: WeeklySlot[];
  grades?: DisciplineGrades;
  createdAt: string;
  absences?: AbsenceLog[];
  maxAbsenceLimitPercent?: number; // e.g. 25% for maximum absences (75% minimum attendance)
  classDurationHours?: number; // e.g. 2 hours per class
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface AcademicTask {
  id: string;
  semesterId: string;
  disciplineId?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  isTop3?: boolean;
  order: number;
  tags?: string[];
  createdAt: string;
}

export type EventType = 'exam' | 'assignment' | 'seminar' | 'delivery' | 'class' | 'event';

export interface AttachedFile {
  id: string;
  name: string;
  size: number | string;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface AcademicEvent {
  id: string;
  semesterId: string;
  disciplineId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: EventType;
  description?: string;
  location?: string;
  priority?: TaskPriority;
  color: string;
  isCompleted?: boolean;
  attachments?: AttachedFile[];
  notes?: string;
}

export interface Notebook {
  id: string;
  semesterId: string;
  disciplineId?: string;
  name: string;
  description?: string;
  coverImage?: string;
  originalCoverImage?: string;
  coverImageEditParams?: any;
  icon?: string;
  color: string;
  isFavorite: boolean;
  isArchived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  notebookId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  createdAt: string;
}

export type PageFormat = 'a4' | 'a5' | 'letter';
export type PageOrientation = 'portrait' | 'landscape';
export type LessonTemplateType = 'traditional' | 'cornell' | 'review' | 'scientific' | 'freeform';

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'callout' | 'shape' | 'arrow' | 'sticker' | 'formula' | 'postit' | 'flashcard';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  content: string; // text, image dataUrl, or shape type
  style?: {
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    fontSize?: number;
    borderRadius?: number;
    opacity?: number;
    fontFamily?: string;
  };
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

export interface LessonVersion {
  id: string;
  timestamp: string;
  title: string;
  contentHtml: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  notebookId: string;
  semesterId: string;
  disciplineId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  lessonNumber?: string; // e.g. "Aula 01"
  professor?: string;
  contentHtml: string;
  pageFormat: PageFormat;
  pageOrientation: PageOrientation;
  templateType: LessonTemplateType;
  headerText?: string;
  footerText?: string;
  canvasElements: CanvasElement[];
  drawings: DrawingStroke[];
  attachments: AttachedFile[];
  summary?: string;
  reviewNotes?: string;
  tags: string[];
  versions: LessonVersion[];
  audioLessons?: LessonAudio[];
  createdAt: string;
  updatedAt: string;
}

export interface AudioSegment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  speaker?: string;
}

export interface LessonAudio {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Stored audio dataUrl or offline reference
  uploadedAt: string;
  durationSeconds: number;
  transcriptionOriginal?: string;
  transcriptionImproved?: string;
  transcriptionActiveVersion?: 'original' | 'improved';
  summary?: string;
  studyNotes?: string;
  isTranscribing?: boolean;
  transcriptionProgress?: number;
  estimatedTimeRemaining?: string;
  segments?: AudioSegment[];
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  frontImage?: string;
  backImage?: string;
  tag?: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: string;
  state: 'new' | 'learning' | 'review' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  semesterId: string;
  disciplineId?: string;
  notebookId?: string;
  chapterId?: string;
  lessonId?: string;
  name: string;
  description?: string;
  tags: string[];
  color: string;
  icon: string;
  cards: Flashcard[];
  createdAt: string;
  lastStudiedAt?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  color: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  linkedLessonId?: string;
  linkedDeckId?: string;
  tags?: string[];
  imageUrl?: string;
  originalImageUrl?: string;
  imageEditParams?: any;
}

export interface MindMapConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  style: 'solid' | 'dashed';
  color?: string;
  bidirectional?: boolean;
}

export interface MindMap {
  id: string;
  semesterId: string;
  disciplineId?: string;
  notebookId?: string;
  chapterId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  color: string;
  layout: 'free' | 'radial' | 'tree' | 'horizontal';
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneralNote {
  id: string;
  semesterId: string;
  disciplineId?: string;
  notebookId?: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicFile {
  id: string;
  semesterId: string;
  disciplineId?: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'audio' | 'slides' | 'spreadsheet' | 'other';
  url: string;
  size: string;
  createdAt: string;
  updatedAt: string;
  annotations?: string; // Serialized JSON string containing PDF page-by-page annotations
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
  audioUrl?: string;
  genre: string;
}

export interface MotivationPhoto {
  id: string;
  url: string; // URL or base64
  title?: string;
  albumId?: string; // Faculdade, Metas, Viagens, Inspiração, Conquistas
  isFavorite?: boolean;
  originalUrl?: string;
  editParams?: any;
  quoteConfig?: any;
  createdAt: string;
}

export interface MotivationAlbum {
  id: string;
  name: string;
  coverUrl?: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface MotivationPhrase {
  id: string;
  text: string;
  author?: string;
  category?: string; // Faculdade, Inspiração, Nietzsche, etc.
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  styleType?: 'minimalist' | 'academic' | 'aesthetic' | 'polaroid';
  isFavorite?: boolean;
  createdAt: string;
}

export interface CombinedMotivationCard {
  id: string;
  photoId: string;
  phraseId: string;
  overlayPosition?: { x: number; y: number };
  fontColor?: string;
  fontSize?: number;
  bgOpacity?: number;
  shadow?: boolean;
  createdAt: string;
}

export interface AppDatabase {
  profile: UserProfile;
  semesters: Semester[];
  disciplines: Discipline[];
  tasks: AcademicTask[];
  events: AcademicEvent[];
  notebooks: Notebook[];
  chapters: Chapter[];
  lessons: Lesson[];
  flashcardDecks: FlashcardDeck[];
  mindMaps: MindMap[];
  files: AcademicFile[];
  generalNotes: GeneralNote[];
  motivationPhotos?: MotivationPhoto[];
  motivationAlbums?: MotivationAlbum[];
  motivationPhrases?: MotivationPhrase[];
  combinedMotivationCards?: CombinedMotivationCard[];
  phraseOfTheDayConfig?: {
    type: 'manual' | 'auto';
    selectedPhraseId?: string;
    lastSelectedDate?: string;
  };
  visionMural?: VisionMuralConfig;
  lastSavedAt: string;
}

export interface VisionCard {
  id: string;
  imageUrl: string;
  title: string;
  fontSize?: number; // e.g. 14, 16
  fontStyle?: string; // e.g. 'font-serif', 'font-sans', 'font-mono'
  alignment?: 'left' | 'center' | 'right';
  subtitle: string;
  category: string;
  description?: string;
  relatedGoal?: string;
  dueDate?: string;
  status?: 'pending' | 'completed';
  order: number;
}

export interface VisionMuralConfig {
  title: string;
  subtitle?: string;
  phrase: string;
  phraseConfig?: {
    visible?: boolean;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right';
    styleType?: string;
  };
  cards: VisionCard[];
  visualSettings?: {
    cardStyle?: 'minimalist' | 'bordered' | 'glass' | 'polaroid';
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    cardSize?: 'small' | 'medium' | 'large';
    spacing?: 'tight' | 'normal' | 'loose';
    textColor?: string;
    overlayOpacity?: number; // e.g. 60 for 60% overlay
  };
}

export type AcademicDatabase = AppDatabase;
export type Profile = UserProfile;
export type Task = AcademicTask;
