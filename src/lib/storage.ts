import { AppDatabase, Semester, Discipline, AcademicTask, AcademicEvent, Notebook, Chapter, Lesson, FlashcardDeck, MindMap, GeneralNote, AcademicFile } from '../types';

const STORAGE_KEY = 'caderno_digital_database_v2';
const BACKUP_KEY = 'caderno_digital_backup_v2';

export const INITIAL_SEMESTER_ID = 'sem-2026-2';

// Seed starter data reflecting user's course (Medicina Veterinária / UFU) with full editability
export const INITIAL_DATABASE: AppDatabase = {
  profile: {
    name: 'Vinícius',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
    course: 'Medicina Veterinária',
    institution: 'UFU - Univ. Federal de Uberlândia',
    university: 'UFU - Univ. Federal de Uberlândia',
    studentId: '12111VET042',
    quote: 'Minha fórmula para a grandeza de um ser humano é o amor fati: que ninguém queira nada diferente, nem para a frente, nem para trás, nem em toda a eternidade.',
    bio: 'Estudante de Medicina Veterinária apaixonado por clínica médica e animais de grande porte.',
    quoteAuthor: 'Friedrich Nietzsche',
    theme: 'sage',
    primaryColor: '#747B6A',
    isDarkMode: false,
    activeSemesterId: INITIAL_SEMESTER_ID,
  },
  semesters: [
    {
      id: INITIAL_SEMESTER_ID,
      name: '2026/2 — 5º Período',
      periodNumber: 5,
      period: 5,
      year: 2026,
      code: '2026.2',
      startDate: '2026-08-01',
      endDate: '2026-12-18',
      institution: 'UFU',
      course: 'Medicina Veterinária',
      isActive: true,
      isArchived: false,
      color: '#4A6B53',
      observations: 'Foco em Patologia e Fisiologia Clínica',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'sem-2026-1',
      name: '2026/1 — 4º Período',
      periodNumber: 4,
      period: 4,
      year: 2026,
      code: '2026.1',
      startDate: '2026-02-15',
      endDate: '2026-07-05',
      institution: 'UFU',
      course: 'Medicina Veterinária',
      isActive: false,
      isArchived: true,
      color: '#B85D43',
      observations: 'Semestre concluído com sucesso',
      createdAt: '2026-02-15T08:00:00.000Z',
    },
  ],
  disciplines: [
    {
      id: 'disc-1',
      semesterId: INITIAL_SEMESTER_ID,
      name: 'Fisiologia Veterinária',
      code: 'VET301',
      professor: 'Dr. Roberto Mendes',
      room: 'Anfiteatro 2B',
      campus: 'Campus Umuarama',
      color: '#4A6B53',
      icon: 'HeartPulse',
      coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      workloadHours: 90,
      observations: 'Provas bimestrais e relatórios de aula prática',
      scheduleSlots: [
        { id: 'slot-1', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', room: 'Lab Fisiologia' },
        { id: 'slot-2', dayOfWeek: 3, startTime: '10:00', endTime: '12:00', room: 'Anfiteatro 2B' },
      ],
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'disc-2',
      semesterId: INITIAL_SEMESTER_ID,
      name: 'Patologia Geral',
      code: 'VET302',
      professor: 'Dra. Helena Castro',
      room: 'Lab Microscopia 4',
      campus: 'Campus Umuarama',
      color: '#B85D43',
      icon: 'Microscope',
      coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
      workloadHours: 75,
      observations: 'Aulas de lâminas semanais',
      scheduleSlots: [
        { id: 'slot-3', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', room: 'Lab Microscopia 4' },
        { id: 'slot-4', dayOfWeek: 4, startTime: '08:00', endTime: '10:00', room: 'Sala 105' },
      ],
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'disc-3',
      semesterId: INITIAL_SEMESTER_ID,
      name: 'Farmacologia Veterinária',
      code: 'VET303',
      professor: 'Prof. Carlos Eduardo',
      room: 'Sala 204',
      campus: 'Campus Umuarama',
      color: '#4B6584',
      icon: 'Pill',
      coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
      workloadHours: 60,
      scheduleSlots: [
        { id: 'slot-5', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', room: 'Sala 204' },
        { id: 'slot-6', dayOfWeek: 5, startTime: '08:00', endTime: '10:00', room: 'Sala 204' },
      ],
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'disc-4',
      semesterId: INITIAL_SEMESTER_ID,
      name: 'Microbiologia e Imunologia',
      code: 'VET304',
      professor: 'Dra. Vanessa Lima',
      room: 'Lab Microbiologia',
      campus: 'Campus Umuarama',
      color: '#7A528A',
      icon: 'Dna',
      coverImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
      workloadHours: 60,
      scheduleSlots: [
        { id: 'slot-7', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', room: 'Lab Microbiologia' },
      ],
      createdAt: '2026-08-01T08:00:00.000Z',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-2',
      title: 'Revisar lâminas de Inflamação Aguda e Crônica',
      description: 'Estudar neutrófilos, macrófagos e exsudato purulento para o seminário.',
      date: '2026-08-23',
      dueDate: '2026-08-25',
      time: '18:00',
      priority: 'urgent',
      status: 'todo',
      deadline: '2026-08-25',
      isTop3: true,
      order: 1,
      tags: ['#prova', '#patologia'],
      createdAt: '2026-08-22T10:00:00.000Z',
    },
    {
      id: 'task-2',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      title: 'Elaborar resumo do Sistema Cardiovascular',
      description: 'Potencial de ação cardíaco, Nó Sinoatrial e ciclo cardíaco.',
      date: '2026-08-23',
      dueDate: '2026-08-26',
      time: '20:00',
      priority: 'high',
      status: 'in_progress',
      deadline: '2026-08-26',
      isTop3: true,
      order: 2,
      tags: ['#resumo', '#fisiologia'],
      createdAt: '2026-08-22T11:00:00.000Z',
    },
    {
      id: 'task-3',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-3',
      title: 'Resolver exercícios de Farmacocinética',
      description: 'Cálculo de meia-vida plasmática e volume de distribuição.',
      date: '2026-08-24',
      dueDate: '2026-08-28',
      priority: 'medium',
      status: 'todo',
      deadline: '2026-08-28',
      isTop3: true,
      order: 3,
      tags: ['#exercicios'],
      createdAt: '2026-08-22T12:00:00.000Z',
    },
    {
      id: 'task-4',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-4',
      title: 'Leitura do artigo de Imunologia Inata em Caninos',
      description: 'Artigo da revista Veterinary Immunology.',
      date: '2026-08-25',
      dueDate: '2026-08-30',
      priority: 'low',
      status: 'todo',
      order: 4,
      tags: ['#leitura'],
      createdAt: '2026-08-22T14:00:00.000Z',
    },
  ],
  events: [
    {
      id: 'event-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-2',
      title: 'Prova Bimestral 1 — Patologia Geral',
      date: '2026-09-02',
      time: '14:00',
      type: 'exam',
      description: 'Conteúdo: Inflamação, Necrose e Degenerações celulares.',
      location: 'Anfiteatro 2B',
      priority: 'urgent',
      color: '#DC2626',
      isCompleted: false,
      notes: 'Trazer caneta preta ou azul e calculadora.',
    },
    {
      id: 'event-2',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      title: 'Entrega do Relatório de Eletrocardiografia',
      date: '2026-08-28',
      time: '23:59',
      type: 'delivery',
      description: 'Enviar PDF pela plataforma acadêmica.',
      location: 'Online',
      priority: 'high',
      color: '#D97706',
      isCompleted: false,
    },
    {
      id: 'event-3',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-3',
      title: 'Apresentação de Seminário: Antibioticoterapia',
      date: '2026-09-10',
      time: '10:00',
      type: 'seminar',
      description: 'Mecanismos de resistência bacteriana e doses terapêuticas.',
      location: 'Sala 204',
      priority: 'high',
      color: '#7C3AED',
      isCompleted: false,
    },
  ],
  notebooks: [
    {
      id: 'nb-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      name: 'Caderno de Fisiologia Veterinária',
      description: 'Anotações completas das aulas de Fisiologia Cardiovascular, Renal e Respiratória.',
      coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      icon: 'HeartPulse',
      color: '#4A6B53',
      isFavorite: true,
      isArchived: false,
      order: 1,
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-22T19:00:00.000Z',
    },
    {
      id: 'nb-2',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-2',
      name: 'Caderno de Patologia Geral',
      description: 'Degenerações, inflamação, neoplasias e necrópsia com esquemas histopatológicos.',
      coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
      icon: 'Microscope',
      color: '#B85D43',
      isFavorite: true,
      isArchived: false,
      order: 2,
      createdAt: '2026-08-01T09:30:00.000Z',
      updatedAt: '2026-08-22T18:00:00.000Z',
    },
    {
      id: 'nb-3',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-3',
      name: 'Caderno de Farmacologia',
      description: 'Farmacocinética, farmacodinâmica, anestésicos e antimicrobianos.',
      coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
      icon: 'Pill',
      color: '#4B6584',
      isFavorite: false,
      isArchived: false,
      order: 3,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-20T16:00:00.000Z',
    },
  ],
  chapters: [
    {
      id: 'chap-1',
      notebookId: 'nb-1',
      name: 'Capítulo 01 — Fisiologia Cardiovascular',
      description: 'Eletrofisiologia cardíaca, débito cardíaco e controle autonômico.',
      color: '#4A6B53',
      icon: 'Heart',
      order: 1,
      createdAt: '2026-08-02T08:00:00.000Z',
    },
    {
      id: 'chap-2',
      notebookId: 'nb-1',
      name: 'Capítulo 02 — Fisiologia Renal',
      description: 'Filtração glomerular, reabsorção tubular e balanço hídrico.',
      color: '#3B82F6',
      icon: 'Droplets',
      order: 2,
      createdAt: '2026-08-10T08:00:00.000Z',
    },
    {
      id: 'chap-3',
      notebookId: 'nb-2',
      name: 'Capítulo 01 — Resposta Inflamatória',
      description: 'Inflamação aguda, crônica, mediadores químicos e exsudação.',
      color: '#B85D43',
      icon: 'Flame',
      order: 1,
      createdAt: '2026-08-03T08:00:00.000Z',
    },
  ],
  lessons: [
    {
      id: 'lesson-1',
      chapterId: 'chap-1',
      notebookId: 'nb-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      title: 'Eletrofisiologia Cardíaca e Sistema de Condução',
      date: '2026-08-22',
      lessonNumber: 'Aula 05',
      professor: 'Dr. Roberto Mendes',
      pageFormat: 'a4',
      pageOrientation: 'portrait',
      templateType: 'traditional',
      headerText: 'FISIOLOGIA VETERINÁRIA — SISTEMA CARDIOVASCULAR',
      footerText: 'Medicina Veterinária UFU | Caderno Digital',
      tags: ['#eletrofisiologia', '#coracao', '#fisiologia'],
      contentHtml: `
<h2>1. Introdução à Eletrofisiologia Cardíaca</h2>
<p>O coração dos mamíferos possui células musculares especializadas dotadas de <strong>automatismo</strong> e <strong>cronotropismo</strong>. A geração rítmica de impulsos elétricos permite a sístole sincronizada dos átrios e ventrículos.</p>

<div class="academic-callout definition" style="background-color: #f0f7f3; border-left: 4px solid #4A6B53; padding: 14px 18px; margin: 14px 0; border-radius: 8px;">
  <strong>📖 Definição Fundamental:</strong>
  <p>O <em>Nó Sinoatrial (SA)</em> é o marcapasso fisiológico do coração, localizado na junção da veia cava cranial com o átrio direito. Possui a taxa intrínseca de despolarização espontânea mais rápida (fase 4 do potencial de ação).</p>
</div>

<h2>2. Via de Condução Elétrica</h2>
<p>O impulso despolarizante segue a seguinte sequência anatômica e funcional:</p>
<ol>
  <li><strong>Nó Sinoatrial (SA):</strong> Origem do potencial de ação.</li>
  <li><strong>Tratos Internodais:</strong> Condução pelos átrios até o septo atrioventricular.</li>
  <li><strong>Nó Atrioventricular (AV):</strong> Provoca um retardo fisiológico (~0,1s) para permitir o enchimento ventricular completo.</li>
  <li><strong>Feixe de His:</strong> Atravessa o esqueleto fibroso cardíaco.</li>
  <li><strong>Ramos Direito e Esquerdo do Feixe:</strong> Descendem pelo septo interventricular.</li>
  <li><strong>Fibras de Purkinje:</strong> Distribuição veloz pelo miocárdio ventricular.</li>
</ol>
      `,
      canvasElements: [],
      drawings: [],
      attachments: [],
      summary: 'Revisão completa da condução cardíaca e fases 0 a 4 do potencial de ação.',
      versions: [],
      createdAt: '2026-08-22T08:00:00.000Z',
      updatedAt: '2026-08-22T19:20:00.000Z',
    },
  ],
  flashcardDecks: [
    {
      id: 'deck-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      name: 'Fisiologia — Sistema Cardiovascular',
      description: 'Potenciais de ação, ciclo cardíaco, marcapasso e nós de condução.',
      tags: ['fisiologia', 'coracao'],
      color: '#4A6B53',
      icon: 'HeartPulse',
      createdAt: '2026-08-22T10:00:00.000Z',
      cards: [
        {
          id: 'card-1',
          deckId: 'deck-1',
          front: 'Qual é o marcapasso fisiológico primário do coração e por que ele assume essa função?',
          back: 'O Nó Sinoatrial (SA). Ele assume a função de marcapasso porque apresenta a taxa intrínseca de despolarização espontânea (automatismo) mais rápida do sistema de condução cardíaco.',
          repetitions: 3,
          intervalDays: 4,
          easeFactor: 2.5,
          nextReviewDate: '2026-08-23',
          state: 'review',
        },
      ],
    },
  ],
  mindMaps: [
    {
      id: 'mm-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      title: 'Sistema de Condução Cardíaca',
      description: 'Mapa de conceitos conectados sobre eletrofisiologia cardíaca (estilo Obsidian).',
      color: '#4A6B53',
      layout: 'free',
      nodes: [
        { id: 'n-1', label: 'Coração', description: 'Bomba propulsora muscular', color: '#4A6B53', x: 400, y: 150, width: 140, height: 60, icon: 'Heart' },
        { id: 'n-2', label: 'Nó Sinoatrial', description: 'Marcapasso fisiológico (~100 bpm)', color: '#2E7D32', x: 200, y: 280, width: 160, height: 70, linkedLessonId: 'lesson-1' },
      ],
      connections: [
        { id: 'c-1', fromNodeId: 'n-1', toNodeId: 'n-2', label: 'inicia em', style: 'solid' },
      ],
      createdAt: '2026-08-22T11:00:00.000Z',
      updatedAt: '2026-08-22T19:00:00.000Z',
    },
  ],
  files: [
    {
      id: 'file-1',
      semesterId: INITIAL_SEMESTER_ID,
      disciplineId: 'disc-1',
      name: 'Apostila_Fisiologia_Cardiovascular_2026.pdf',
      type: 'pdf',
      url: 'https://example.com/apostila.pdf',
      size: '3.4 MB',
      createdAt: '2026-08-20T10:00:00.000Z',
      updatedAt: '2026-08-20T10:00:00.000Z',
    },
  ],
  generalNotes: [],
  lastSavedAt: new Date().toISOString(),
};

export class StorageService {
  private static cachedData: AppDatabase | null = null;
  private static listeners: Array<(db: AppDatabase) => void> = [];
  private static onUpdateCallback: ((action: string, description: string) => void) | null = null;

  public static setOnUpdateCallback(cb: (action: string, description: string) => void) {
    this.onUpdateCallback = cb;
  }

  public static getDatabase(): AppDatabase {
    if (this.cachedData) {
      return this.cachedData;
    }

    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as AppDatabase;
        if (!parsed.files) parsed.files = [];
        
        // Ensure new structures are present
        if (!parsed.profile.themeMode) parsed.profile.themeMode = 'dark';
        if (!parsed.profile.customThemeColors) {
          parsed.profile.customThemeColors = {
            primary: '#3B82F6',
            secondary: '#1E40AF',
            button: '#3B82F6',
            menu: '#1C1C1E',
            icon: '#60A5FA',
            highlight: '#60A5FA',
            text: '#E2E2E2',
            background: '#0A0A0B',
            card: '#121214',
            sidebar: '#121214',
            topbar: '#121214',
          };
        }
        if (!parsed.profile.favoriteColors) {
          parsed.profile.favoriteColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
        }
        if (!parsed.profile.widgetsConfig) {
          parsed.profile.widgetsConfig = [
            { id: 'profile_banner', title: 'Banner de Perfil', visible: true, size: 'full', position: 0 },
            { id: 'stats', title: 'Indicadores Rápidos', visible: true, size: 'full', position: 1 },
            { id: 'priority_tasks', title: 'Prioridades de Hoje', visible: true, size: 'lg', position: 2 },
            { id: 'schedule', title: 'Grade Horária', visible: true, size: 'md', position: 3 },
            { id: 'recent_lessons', title: 'Aulas Recentes', visible: true, size: 'md', position: 4 },
            { id: 'upcoming_exams', title: 'Próximas Provas', visible: true, size: 'sm', position: 5 },
            { id: 'disciplines', title: 'Grade de Matérias', visible: true, size: 'sm', position: 6 },
            { id: 'motivation_widget', title: 'Mural de Motivação', visible: true, size: 'md', position: 7 },
          ];
        }

        // Seeding motivation modules in existing databases
        if (!parsed.motivationAlbums) {
          parsed.motivationAlbums = [
            { id: 'alb-fac', name: 'Faculdade', coverUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop&q=80', description: 'Fotos da faculdade, aulas práticas e amigos de classe.', color: '#4A6B53', createdAt: new Date().toISOString() },
            { id: 'alb-metas', name: 'Metas', coverUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&auto=format&fit=crop&q=80', description: 'Objetivos acadêmicos e profissionais para o futuro.', color: '#B85D43', createdAt: new Date().toISOString() },
            { id: 'alb-viagens', name: 'Viagens', coverUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=80', description: 'Lugares que quero conhecer nas férias.', color: '#4B6584', createdAt: new Date().toISOString() },
            { id: 'alb-insp', name: 'Inspiração', coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80', description: 'Imagens e ideias que me motivam a estudar todos os dias.', color: '#7A528A', createdAt: new Date().toISOString() },
            { id: 'alb-conq', name: 'Conquistas', coverUrl: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=400&auto=format&fit=crop&q=80', description: 'Minhas aprovações, notas boas e certificados.', color: '#D97706', createdAt: new Date().toISOString() },
          ];
        }
        if (!parsed.motivationPhrases) {
          parsed.motivationPhrases = [
            { id: 'phr-1', text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier', category: 'Estudos', fontFamily: 'Plus Jakarta Sans', fontSize: 16, textColor: '#FFFFFF', backgroundColor: '#4A6B53', alignment: 'center', styleType: 'minimalist', isFavorite: true, createdAt: new Date().toISOString() },
            { id: 'phr-2', text: 'A educação é a arma mais poderosa que você pode usar para mudar o mundo.', author: 'Nelson Mandela', category: 'Inspiração', fontFamily: 'Playfair Display', fontSize: 18, textColor: '#FFFFFF', backgroundColor: '#1C1C1F', alignment: 'center', styleType: 'academic', isFavorite: true, createdAt: new Date().toISOString() },
            { id: 'phr-3', text: 'Minha fórmula para a grandeza de um ser humano é o amor fati.', author: 'Friedrich Nietzsche', category: 'Filosofia', fontFamily: 'Playfair Display', fontSize: 16, textColor: '#D9C3B0', backgroundColor: '#1C1613', alignment: 'center', styleType: 'polaroid', isFavorite: false, createdAt: new Date().toISOString() },
            { id: 'phr-4', text: 'Não espere por circunstâncias ideais. Crie-as.', author: 'Napoleon Hill', category: 'Metas', fontFamily: 'Plus Jakarta Sans', fontSize: 15, textColor: '#E1F5FE', backgroundColor: '#0288D1', alignment: 'center', styleType: 'aesthetic', isFavorite: false, createdAt: new Date().toISOString() },
          ];
        }
        if (!parsed.motivationPhotos) {
          parsed.motivationPhotos = [
            { id: 'pht-1', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80', title: 'Estudos na Escrivaninha', albumId: 'alb-fac', isFavorite: true, createdAt: new Date().toISOString() },
            { id: 'pht-2', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80', title: 'Livros e Biblioteca', albumId: 'alb-insp', isFavorite: true, createdAt: new Date().toISOString() },
            { id: 'pht-3', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80', title: 'Montanhas Inspiradoras', albumId: 'alb-metas', isFavorite: false, createdAt: new Date().toISOString() },
          ];
        }
        if (!parsed.combinedMotivationCards) parsed.combinedMotivationCards = [];
        if (!parsed.phraseOfTheDayConfig) {
          parsed.phraseOfTheDayConfig = {
            type: 'auto',
            selectedPhraseId: 'phr-1',
            lastSelectedDate: new Date().toISOString().split('T')[0],
          };
        }

        this.cachedData = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do localStorage, usando dados iniciais:', e);
    }

    const fresh = JSON.parse(JSON.stringify(INITIAL_DATABASE)) as AppDatabase;
    fresh.profile.themeMode = 'dark';
    fresh.profile.customThemeColors = {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      button: '#3B82F6',
      menu: '#1C1C1E',
      icon: '#60A5FA',
      highlight: '#60A5FA',
      text: '#E2E2E2',
      background: '#0A0A0B',
      card: '#121214',
      sidebar: '#121214',
      topbar: '#121214',
    };
    fresh.profile.favoriteColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
    fresh.profile.widgetsConfig = [
      { id: 'profile_banner', title: 'Banner de Perfil', visible: true, size: 'full', position: 0 },
      { id: 'stats', title: 'Indicadores Rápidos', visible: true, size: 'full', position: 1 },
      { id: 'priority_tasks', title: 'Prioridades de Hoje', visible: true, size: 'lg', position: 2 },
      { id: 'schedule', title: 'Grade Horária', visible: true, size: 'md', position: 3 },
      { id: 'recent_lessons', title: 'Aulas Recentes', visible: true, size: 'md', position: 4 },
      { id: 'upcoming_exams', title: 'Próximas Provas', visible: true, size: 'sm', position: 5 },
      { id: 'disciplines', title: 'Grade de Matérias', visible: true, size: 'sm', position: 6 },
      { id: 'motivation_widget', title: 'Mural de Motivação', visible: true, size: 'md', position: 7 },
    ];
    fresh.motivationAlbums = [
      { id: 'alb-fac', name: 'Faculdade', coverUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop&q=80', description: 'Fotos da faculdade, aulas práticas e amigos de classe.', color: '#4A6B53', createdAt: new Date().toISOString() },
      { id: 'alb-metas', name: 'Metas', coverUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&auto=format&fit=crop&q=80', description: 'Objetivos acadêmicos e profissionais para o futuro.', color: '#B85D43', createdAt: new Date().toISOString() },
      { id: 'alb-viagens', name: 'Viagens', coverUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=80', description: 'Lugares que quero conhecer nas férias.', color: '#4B6584', createdAt: new Date().toISOString() },
      { id: 'alb-insp', name: 'Inspiração', coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80', description: 'Imagens e ideias que me motivam a estudar todos os dias.', color: '#7A528A', createdAt: new Date().toISOString() },
      { id: 'alb-conq', name: 'Conquistas', coverUrl: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=400&auto=format&fit=crop&q=80', description: 'Minhas aprovações, notas boas e certificados.', color: '#D97706', createdAt: new Date().toISOString() },
    ];
    fresh.motivationPhrases = [
      { id: 'phr-1', text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier', category: 'Estudos', fontFamily: 'Plus Jakarta Sans', fontSize: 16, textColor: '#FFFFFF', backgroundColor: '#4A6B53', alignment: 'center', styleType: 'minimalist', isFavorite: true, createdAt: new Date().toISOString() },
      { id: 'phr-2', text: 'A educação é a arma mais poderosa que você pode usar para mudar o mundo.', author: 'Nelson Mandela', category: 'Inspiração', fontFamily: 'Playfair Display', fontSize: 18, textColor: '#FFFFFF', backgroundColor: '#1C1C1F', alignment: 'center', styleType: 'academic', isFavorite: true, createdAt: new Date().toISOString() },
      { id: 'phr-3', text: 'Minha fórmula para a grandeza de um ser humano é o amor fati.', author: 'Friedrich Nietzsche', category: 'Filosofia', fontFamily: 'Playfair Display', fontSize: 16, textColor: '#D9C3B0', backgroundColor: '#1C1613', alignment: 'center', styleType: 'polaroid', isFavorite: false, createdAt: new Date().toISOString() },
      { id: 'phr-4', text: 'Não espere por circunstâncias ideais. Crie-as.', author: 'Napoleon Hill', category: 'Metas', fontFamily: 'Plus Jakarta Sans', fontSize: 15, textColor: '#E1F5FE', backgroundColor: '#0288D1', alignment: 'center', styleType: 'aesthetic', isFavorite: false, createdAt: new Date().toISOString() },
    ];
    fresh.motivationPhotos = [
      { id: 'pht-1', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80', title: 'Estudos na Escrivaninha', albumId: 'alb-fac', isFavorite: true, createdAt: new Date().toISOString() },
      { id: 'pht-2', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80', title: 'Livros e Biblioteca', albumId: 'alb-insp', isFavorite: true, createdAt: new Date().toISOString() },
      { id: 'pht-3', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80', title: 'Montanhas Inspiradoras', albumId: 'alb-metas', isFavorite: false, createdAt: new Date().toISOString() },
    ];
    fresh.combinedMotivationCards = [];
    fresh.phraseOfTheDayConfig = {
      type: 'auto',
      selectedPhraseId: 'phr-1',
      lastSelectedDate: new Date().toISOString().split('T')[0],
    };

    this.cachedData = fresh;
    this.saveDatabase(this.cachedData!);
    return this.cachedData!;
  }

  public static saveDatabase(db: AppDatabase): void {
    try {
      db.lastSavedAt = new Date().toISOString();
      this.cachedData = db;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ db, timestamp: new Date().toISOString() }));
      this.notifyListeners(db);
    } catch (e) {
      console.error('Falha ao salvar banco de dados:', e);
    }
  }

  public static subscribe(listener: (db: AppDatabase) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(db: AppDatabase): void {
    this.listeners.forEach((listener) => {
      try {
        listener(db);
      } catch (err) {
        console.error('Listener error in StorageService:', err);
      }
    });
  }

  public static update(updater: (draft: AppDatabase) => void, actionInfo?: { action: string; description: string }): AppDatabase {
    const current = this.getDatabase();
    const copy: AppDatabase = JSON.parse(JSON.stringify(current));
    updater(copy);
    this.saveDatabase(copy);
    
    if (this.onUpdateCallback) {
      if (actionInfo) {
        this.onUpdateCallback(actionInfo.action, actionInfo.description);
      } else {
        this.onUpdateCallback('Alteração', 'Atualização de dados acadêmicos');
      }
    }
    return copy;
  }

  public static exportToJson(): string {
    const db = this.getDatabase();
    return JSON.stringify(db, null, 2);
  }

  public static exportBackupJson(): string {
    return this.exportToJson();
  }

  public static importFromJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as AppDatabase;
      if (parsed.profile && parsed.semesters && parsed.notebooks) {
        if (!parsed.files) parsed.files = [];
        this.saveDatabase(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('JSON inválido para restauração:', e);
      return false;
    }
  }

  public static importBackupJson(jsonString: string): boolean {
    return this.importFromJson(jsonString);
  }

  public static resetToSeed(): AppDatabase {
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.saveDatabase(fresh);
    return fresh;
  }

  public static resetToInitial(): AppDatabase {
    return this.resetToSeed();
  }
}
