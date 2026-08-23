import React, { useState, useEffect } from 'react';
import { FocusSynthService, SoundType } from '../../lib/audioSynth';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  CloudRain,
  Wind,
  Headphones,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Minimize2,
  Maximize2,
  ListMusic,
  GripHorizontal,
} from 'lucide-react';

const SPOTIFY_PLAYLISTS = [
  {
    name: 'Lo-Fi Beats para Foco',
    genre: 'Lo-Fi Study',
    embedId: '37i9dQZF1DXdLEN7aqioXM',
    type: 'playlist',
    icon: '☕',
  },
  {
    name: 'Música Clássica para Estudo',
    genre: 'Classical Focus',
    embedId: '37i9dQZF1DX8Uebhn9wzrS',
    type: 'playlist',
    icon: '🎻',
  },
  {
    name: 'Deep Focus & Ambient Piano',
    genre: 'Deep Focus',
    embedId: '37i9dQZF1DWZeKCadgRdKQ',
    type: 'playlist',
    icon: '🎹',
  },
  {
    name: 'Chuva & Sons da Natureza',
    genre: 'Binaural & Nature',
    embedId: '37i9dQZF1DX4wG1z4vgW9f',
    type: 'playlist',
    icon: '🌧️',
  },
];

const YOUTUBE_PLAYLISTS = [
  {
    name: 'Lofi Girl - Study Beats',
    genre: 'Lofi Beats',
    embedId: 'JFgT8G1Ko4Y',
    type: 'video',
    icon: '👧',
  },
  {
    name: 'Chillhop Radio',
    genre: 'Chillhop Jazz',
    embedId: '5yx6BWbL1sA',
    type: 'video',
    icon: '🦊',
  },
  {
    name: 'Ambient Deep Focus',
    genre: 'Synthesizer',
    embedId: 'PLw6Vv_yY-8gq_q3f4z3A2W8aB1I9H-Z3-',
    type: 'playlist',
    icon: '🌌',
  },
  {
    name: 'Sons de Chuva 10 Horas',
    genre: 'White Noise',
    embedId: 'mPZkdNFkNps',
    type: 'video',
    icon: '⛈️',
  },
];

export const MusicPlayerWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<'ambient' | 'spotify' | 'youtube'>('ambient');
  const [selectedSpotifyPlaylist, setSelectedSpotifyPlaylist] = useState(SPOTIFY_PLAYLISTS[0]);
  const [selectedYoutubePlaylist, setSelectedYoutubePlaylist] = useState(YOUTUBE_PLAYLISTS[0]);
  
  // Custom user links
  const [customSpotifyUrl, setCustomSpotifyUrl] = useState(() => localStorage.getItem('custom_spotify_url') || '');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState(() => localStorage.getItem('custom_youtube_url') || '');
  const [loadedCustomSpotify, setLoadedCustomSpotify] = useState<{ id: string; type: string } | null>(null);
  const [loadedCustomYoutube, setLoadedCustomYoutube] = useState<{ id: string; type: 'video' | 'playlist' } | null>(null);

  // Dragging states
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, links, inputs, iframes or audio sliders
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('iframe') || target.closest('a')) {
      return;
    }
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = Math.max(10, Math.min(window.innerWidth - 180, e.clientX - dragOffset.x));
    const y = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
    setPosition({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const dragStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        right: 'auto',
        touchAction: 'none',
      }
    : {
        touchAction: 'none',
      };

  // Parse custom links on mount or change
  useEffect(() => {
    if (customSpotifyUrl) {
      const match = customSpotifyUrl.match(/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/);
      if (match) {
        setLoadedCustomSpotify({ type: match[1], id: match[2] });
      } else {
        setLoadedCustomSpotify(null);
      }
    } else {
      setLoadedCustomSpotify(null);
    }
  }, [customSpotifyUrl]);

  useEffect(() => {
    if (customYoutubeUrl) {
      // Check for playlist
      const playlistMatch = customYoutubeUrl.match(/[?&]list=([^"&?\/ ]+)/);
      const videoMatch = customYoutubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
      
      if (playlistMatch) {
        setLoadedCustomYoutube({ type: 'playlist', id: playlistMatch[1] });
      } else if (videoMatch) {
        setLoadedCustomYoutube({ type: 'video', id: videoMatch[1] });
      } else {
        setLoadedCustomYoutube(null);
      }
    } else {
      setLoadedCustomYoutube(null);
    }
  }, [customYoutubeUrl]);

  // Ambient sound state
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSound = (sound: SoundType) => {
    if (activeSound === sound && isPlaying) {
      FocusSynthService.stop();
      setIsPlaying(false);
      setActiveSound(null);
    } else {
      FocusSynthService.play(sound, volume);
      setActiveSound(sound);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    FocusSynthService.setVolume(newVol);
  };

  const stopAll = () => {
    FocusSynthService.stop();
    setIsPlaying(false);
    setActiveSound(null);
  };

  const saveCustomSpotify = (val: string) => {
    setCustomSpotifyUrl(val);
    localStorage.setItem('custom_spotify_url', val);
  };

  const saveCustomYoutube = (val: string) => {
    setCustomYoutubeUrl(val);
    localStorage.setItem('custom_youtube_url', val);
  };

  // Build Spotify embed URL
  const spotifyEmbedSrc = loadedCustomSpotify
    ? `https://open.spotify.com/embed/${loadedCustomSpotify.type}/${loadedCustomSpotify.id}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/playlist/${selectedSpotifyPlaylist.embedId}?utm_source=generator&theme=0`;

  // Build YouTube embed URL
  const youtubeEmbedSrc = loadedCustomYoutube
    ? (loadedCustomYoutube.type === 'playlist'
        ? `https://www.youtube.com/embed/videoseries?list=${loadedCustomYoutube.id}`
        : `https://www.youtube.com/embed/${loadedCustomYoutube.id}`)
    : (selectedYoutubePlaylist.type === 'playlist'
        ? `https://www.youtube.com/embed/videoseries?list=${selectedYoutubePlaylist.embedId}`
        : `https://www.youtube.com/embed/${selectedYoutubePlaylist.embedId}`);

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={dragStyle}
      className={`fixed bottom-4 right-4 z-40 select-none ${
        isDragging ? 'shadow-2xl opacity-90 cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Collapsed Pill */}
      {!isExpanded ? (
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-[#121214] border border-[#242427] text-[#E2E2E2] shadow-2xl">
          <GripHorizontal className="w-3.5 h-3.5 text-[#52525B]" />
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="relative">
              <Music className="w-4 h-4 text-blue-400" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              )}
            </div>
            <span className="text-xs font-semibold">
              {isPlaying ? `Tocando: ${activeSound}` : 'Música & Foco'}
            </span>
            <ChevronUp className="w-3.5 h-3.5 text-[#919196] transition-transform" />
          </button>
        </div>
      ) : (
        /* Expanded Floating Music & Sound Panel */
        <div className="w-80 sm:w-[420px] bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3 bg-[#1C1C1F] border-b border-[#242427] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-[#919196]" />
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Música & Concentração
                </h4>
                <p className="text-[9px] text-[#919196]">Arraste pelas bordas para posicionar</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-[#919196] hover:bg-[#242427] hover:text-white transition cursor-pointer"
                title="Minimizar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher: Sons Ambientes vs Spotify vs YouTube */}
          <div className="p-3.5 space-y-3.5">
            <div className="flex items-center bg-[#1C1C1F] p-0.5 rounded-xl gap-0.5 border border-[#242427]">
              <button
                onClick={() => setMode('ambient')}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'ambient'
                    ? 'bg-[#2A2A2D] text-white shadow-xs font-semibold'
                    : 'text-[#919196] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Foco (Offline)
              </button>
              <button
                onClick={() => setMode('spotify')}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'spotify'
                    ? 'bg-[#2A2A2D] text-emerald-400 shadow-xs font-semibold'
                    : 'text-[#919196] hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Spotify
              </button>
              <button
                onClick={() => setMode('youtube')}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'youtube'
                    ? 'bg-[#2A2A2D] text-red-500 shadow-xs font-semibold'
                    : 'text-[#919196] hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-red-500" />
                YouTube
              </button>
            </div>

            {mode === 'ambient' ? (
              /* Ambient Sounds Synthesizer */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleSound('rain')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      activeSound === 'rain' && isPlaying
                        ? 'bg-blue-500/10 border-blue-500 text-blue-300 font-semibold shadow-xs'
                        : 'border-[#242427] bg-[#1C1C1F] hover:bg-[#242427] text-[#E2E2E2]'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-xs font-medium">Chuva Suave</p>
                      <p className="text-[9px] text-[#919196]">Relaxamento</p>
                    </div>
                  </button>

                  <button
                    onClick={() => toggleSound('lofi')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      activeSound === 'lofi' && isPlaying
                        ? 'bg-purple-500/10 border-purple-500 text-purple-300 font-semibold shadow-xs'
                        : 'border-[#242427] bg-[#1C1C1F] hover:bg-[#242427] text-[#E2E2E2]'
                    }`}
                  >
                    <Music className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs font-medium">Pulso Lo-Fi</p>
                      <p className="text-[9px] text-[#919196]">Estudo Ativo</p>
                    </div>
                  </button>

                  <button
                    onClick={() => toggleSound('whitenoise')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      activeSound === 'whitenoise' && isPlaying
                        ? 'bg-zinc-500/10 border-zinc-500 text-zinc-300 font-semibold shadow-xs'
                        : 'border-[#242427] bg-[#1C1C1F] hover:bg-[#242427] text-[#E2E2E2]'
                    }`}
                  >
                    <Wind className="w-4 h-4 text-[#919196]" />
                    <div>
                      <p className="text-xs font-medium">Ruído Branco</p>
                      <p className="text-[9px] text-[#919196]">Isola Barulhos</p>
                    </div>
                  </button>

                  <button
                    onClick={() => toggleSound('binaural')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      activeSound === 'binaural' && isPlaying
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-semibold shadow-xs'
                        : 'border-[#242427] bg-[#1C1C1F] hover:bg-[#242427] text-[#E2E2E2]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-medium">Ondas Alfa (10Hz)</p>
                      <p className="text-[9px] text-[#919196]">Memória & Foco</p>
                    </div>
                  </button>
                </div>

                {/* Volume slider and Stop button */}
                <div className="pt-2 border-t border-[#242427] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#919196]" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#242427] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {isPlaying && (
                    <button
                      onClick={stopAll}
                      className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20 transition cursor-pointer"
                    >
                      Pausar
                    </button>
                  )}
                </div>
              </div>
            ) : mode === 'spotify' ? (
              /* Spotify Playlist Embed */
              <div className="space-y-3">
                {/* Preset selector */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {SPOTIFY_PLAYLISTS.map((pl) => (
                    <button
                      key={pl.embedId}
                      onClick={() => {
                        setSelectedSpotifyPlaylist(pl);
                        setCustomSpotifyUrl('');
                        setLoadedCustomSpotify(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] whitespace-nowrap font-medium transition cursor-pointer ${
                        selectedSpotifyPlaylist.embedId === pl.embedId && !loadedCustomSpotify
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-[#1C1C1F] text-[#919196] hover:text-white border border-[#242427]'
                      }`}
                    >
                      {pl.icon} {pl.name}
                    </button>
                  ))}
                </div>

                {/* Custom Spotify URL Pasting input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#919196] font-semibold">Tocar minha própria Playlist / Faixa do Spotify:</label>
                  <input
                    type="text"
                    placeholder="Cole o link do Spotify aqui..."
                    value={customSpotifyUrl}
                    onChange={(e) => saveCustomSpotify(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-xs text-[#E2E2E2] px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Spotify Iframe Embed */}
                <div className="rounded-xl overflow-hidden border border-[#242427] bg-black">
                  <iframe
                    src={spotifyEmbedSrc}
                    width="100%"
                    height="180"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                  />
                </div>

                {/* Info about Spotify playback */}
                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                  <p className="text-[9px] text-[#A1A1A8] leading-relaxed">
                    🎵 <span className="font-bold text-emerald-400">Músicas Completas:</span> O Spotify limita reprodutores embutidos a prévias de 30 segundos se você não estiver conectado. Para escutar a música inteira, clique no botão <span className="font-bold text-white">"Entrar" (Login)</span> no canto superior direito do player acima ou clique no logo para abrir diretamente no aplicativo Spotify.
                  </p>
                </div>
              </div>
            ) : (
              /* YouTube Playlist Embed */
              <div className="space-y-3">
                {/* Preset selector */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {YOUTUBE_PLAYLISTS.map((pl) => (
                    <button
                      key={pl.embedId}
                      onClick={() => {
                        setSelectedYoutubePlaylist(pl);
                        setCustomYoutubeUrl('');
                        setLoadedCustomYoutube(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] whitespace-nowrap font-medium transition cursor-pointer ${
                        selectedYoutubePlaylist.embedId === pl.embedId && !loadedCustomYoutube
                          ? 'bg-red-600 text-white font-bold shadow-xs'
                          : 'bg-[#1C1C1F] text-[#919196] hover:text-white border border-[#242427]'
                      }`}
                    >
                      {pl.icon} {pl.name}
                    </button>
                  ))}
                </div>

                {/* Custom YouTube URL Pasting input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#919196] font-semibold">Tocar minha própria Playlist ou Vídeo do YouTube:</label>
                  <input
                    type="text"
                    placeholder="Cole o link do vídeo ou playlist do YouTube..."
                    value={customYoutubeUrl}
                    onChange={(e) => saveCustomYoutube(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-xs text-[#E2E2E2] px-3 py-2 rounded-xl focus:outline-none focus:border-red-500/50"
                  />
                </div>

                {/* YouTube Iframe Embed */}
                <div className="rounded-xl overflow-hidden border border-[#242427] bg-black relative aspect-video w-full">
                  <iframe
                    src={youtubeEmbedSrc}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
