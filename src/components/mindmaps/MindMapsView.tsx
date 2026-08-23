import React, { useState, useRef, useEffect } from 'react';
import { MindMap, MindMapNode, MindMapConnection, Discipline } from '../../types';
import { StorageService } from '../../lib/storage';
import { UniversalImageEditor, ImageEditParams } from '../editor/UniversalImageEditor';
import {
  Network,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
  ArrowLeft,
  Trash2,
  Edit2,
  Link as LinkIcon,
  BookOpen,
  Brain,
  Download,
  Share2,
  Move,
  Search,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MindMapsViewProps {
  initialMapId?: string | null;
  onOpenLesson?: (lessonId: string) => void;
  onOpenDeck?: (deckId: string) => void;
}

export const MindMapsView: React.FC<MindMapsViewProps> = ({
  initialMapId,
  onOpenLesson,
  onOpenDeck,
}) => {
  const db = StorageService.getDatabase();
  const currentSemesterId = db.profile.activeSemesterId;

  const [activeMapId, setActiveMapId] = useState<string | null>(initialMapId || null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });

  // Connecting nodes
  const [connectionStartNodeId, setConnectionStartNodeId] = useState<string | null>(null);

  // Selected node for editing
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  // Node Image Editor states
  const [isNodeImageEditorOpen, setIsNodeImageEditorOpen] = useState(false);
  const [nodeImageOriginalSrc, setNodeImageOriginalSrc] = useState<string | null>(null);

  // Modals
  const [newMapModalOpen, setNewMapModalOpen] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');
  const [newMapDesc, setNewMapDesc] = useState('');
  const [newMapDisciplineId, setNewMapDisciplineId] = useState('');

  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const mindMaps = db.mindMaps.filter((m) => m.semesterId === currentSemesterId).filter((m) => {
    if (!searchQuery.trim()) return true;
    return (
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeMap = db.mindMaps.find((m) => m.id === activeMapId);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Pan canvas handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId && activeMap) {
      const newX = (e.clientX - pan.x) / zoom - nodeOffset.x;
      const newY = (e.clientY - pan.y) / zoom - nodeOffset.y;

      StorageService.update((draft) => {
        const m = draft.mindMaps.find((map) => map.id === activeMap.id);
        if (m) {
          const n = m.nodes.find((node) => node.id === draggingNodeId);
          if (n) {
            n.x = Math.round(newX);
            n.y = Math.round(newY);
          }
        }
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: MindMapNode) => {
    e.stopPropagation();
    if (connectionStartNodeId) {
      if (connectionStartNodeId !== node.id && activeMap) {
        // Create connection
        const newConn: MindMapConnection = {
          id: `c-${Date.now()}`,
          fromNodeId: connectionStartNodeId,
          toNodeId: node.id,
          label: 'relaciona',
          style: 'solid',
        };
        StorageService.update((draft) => {
          const m = draft.mindMaps.find((map) => map.id === activeMap.id);
          if (m) m.connections.push(newConn);
        });
      }
      setConnectionStartNodeId(null);
      return;
    }

    setDraggingNodeId(node.id);
    const mouseX = (e.clientX - pan.x) / zoom;
    const mouseY = (e.clientY - pan.y) / zoom;
    setNodeOffset({ x: mouseX - node.x, y: mouseY - node.y });
    setSelectedNode(node);
  };

  const handleAddNode = () => {
    if (!activeMap) return;
    const newNode: MindMapNode = {
      id: `n-${Date.now()}`,
      label: 'Novo Conceito',
      description: 'Descrição do tópico',
      color: '#4A6B53',
      x: 350 - pan.x / zoom + Math.random() * 60,
      y: 250 - pan.y / zoom + Math.random() * 60,
      width: 150,
      height: 60,
    };

    StorageService.update((draft) => {
      const m = draft.mindMaps.find((map) => map.id === activeMap.id);
      if (m) m.nodes.push(newNode);
    });

    setSelectedNode(newNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!activeMap) return;
    StorageService.update((draft) => {
      const m = draft.mindMaps.find((map) => map.id === activeMap.id);
      if (m) {
        m.nodes = m.nodes.filter((n) => n.id !== nodeId);
        m.connections = m.connections.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId);
      }
    });
    setSelectedNode(null);
  };

  const handleSaveNodeImage = (editedUrl: string, params: any) => {
    if (!selectedNode || !activeMap) return;

    StorageService.update((draft) => {
      const m = draft.mindMaps.find((map) => map.id === activeMap.id);
      const n = m?.nodes.find((item) => item.id === selectedNode.id);
      if (n) {
        n.imageUrl = editedUrl;
        n.originalImageUrl = nodeImageOriginalSrc || selectedNode.originalImageUrl || editedUrl;
        n.imageEditParams = params;
      }
    });

    setSelectedNode({
      ...selectedNode,
      imageUrl: editedUrl,
      originalImageUrl: nodeImageOriginalSrc || selectedNode.originalImageUrl || editedUrl,
      imageEditParams: params,
    });

    setIsNodeImageEditorOpen(false);
    setNodeImageOriginalSrc(null);
  };

  const handleNodeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNodeImageOriginalSrc(base64);
      setIsNodeImageEditorOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateMap = () => {
    if (!newMapTitle.trim()) return;

    const disc = db.disciplines.find((d) => d.id === newMapDisciplineId);
    const newMapId = `mm-${Date.now()}`;
    const newMap: MindMap = {
      id: newMapId,
      semesterId: currentSemesterId,
      disciplineId: newMapDisciplineId || undefined,
      title: newMapTitle.trim(),
      description: newMapDesc.trim(),
      color: disc?.color || '#4A6B53',
      layout: 'free',
      nodes: [
        {
          id: 'n-root',
          label: newMapTitle.trim(),
          description: 'Tema Central',
          color: disc?.color || '#4A6B53',
          x: 400,
          y: 200,
          width: 170,
          height: 70,
        },
      ],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.mindMaps.push(newMap);
    });

    setNewMapTitle('');
    setNewMapDesc('');
    setNewMapModalOpen(false);
    setActiveMapId(newMapId);
  };

  const handleAiGenerateMindmap = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: aiTopic,
          subjectName: 'Estudos Universitários',
          contentText: aiTopic,
        }),
      });

      const data = await response.json();
      if (data.success && data.mindmap) {
        const newMapId = `mm-${Date.now()}`;
        const rawMap = data.mindmap;

        const nodes: MindMapNode[] = [
          {
            id: 'n-root',
            label: rawMap.rootNode?.label || aiTopic,
            description: rawMap.rootNode?.description || 'Tema Central',
            color: rawMap.rootNode?.color || '#4A6B53',
            x: 400,
            y: 200,
            width: 170,
            height: 70,
          },
          ...(rawMap.nodes || []).map((node: any, idx: number) => {
            const angle = (idx / (rawMap.nodes?.length || 1)) * 2 * Math.PI;
            return {
              id: node.id || `node-${idx}`,
              label: node.label,
              description: node.description,
              color: node.color || '#4B6584',
              x: 400 + Math.cos(angle) * 260,
              y: 250 + Math.sin(angle) * 180,
              width: 150,
              height: 60,
            };
          }),
        ];

        const connections: MindMapConnection[] = (rawMap.connections || []).map((conn: any, idx: number) => ({
          id: `c-${idx}`,
          fromNodeId: conn.from === 'root-1' ? 'n-root' : conn.from,
          toNodeId: conn.to,
          label: conn.label || 'relaciona',
          style: 'solid',
        }));

        StorageService.update((draft) => {
          draft.mindMaps.push({
            id: newMapId,
            semesterId: currentSemesterId,
            title: `Mapa: ${aiTopic}`,
            description: `Mapa mental gerado por IA sobre ${aiTopic}`,
            color: '#4A6B53',
            layout: 'radial',
            nodes,
            connections,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });

        confetti({ particleCount: 80, spread: 70 });
        setAiGeneratorOpen(false);
        setActiveMapId(newMapId);
      } else {
        alert('Erro ao gerar mapa com IA: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {activeMap ? (
        /* Full Infinite Canvas Workspace */
        <div className="space-y-4">
          {/* Top Canvas Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121214] p-3 rounded-2xl border border-[#242427] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveMapId(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#919196] hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Todos os Mapas
              </button>
              <div className="h-4 w-px bg-[#242427]" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                {activeMap.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Nó
              </button>

              <button
                onClick={() => {
                  if (selectedNode) {
                    setConnectionStartNodeId(selectedNode.id);
                  } else {
                    alert('Selecione um nó primeiro para iniciar a conexão.');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border border-[#242427] text-xs font-semibold rounded-xl transition cursor-pointer ${
                  connectionStartNodeId ? 'bg-amber-600 text-white' : 'bg-[#1C1C1F] text-[#EDEDED] hover:bg-[#242427]'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {connectionStartNodeId ? 'Clique no nó destino...' : 'Conectar Nós'}
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center bg-[#1C1C1F] border border-[#242427] p-1 rounded-xl">
                <button
                  onClick={() => setZoom(Math.max(0.4, zoom - 0.15))}
                  className="p-1 text-[#919196] hover:text-white transition cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[10px] font-mono font-bold text-[#919196]">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(2.0, zoom + 0.15))}
                  className="p-1 text-[#919196] hover:text-white transition cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-1 text-[#919196] hover:text-white transition cursor-pointer"
                  title="Resetar visualização"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Graph Canvas Area */}
          <div
            id="canvas-bg"
            className="relative h-[650px] w-full bg-[#0A0A0B] rounded-3xl border border-[#242427] overflow-hidden shadow-inner cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(var(--color-border) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* SVG Connecting Curves and Nodes Container */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="16"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-secondary)" />
                </marker>
              </defs>

              {/* Draw Connections */}
              {activeMap.connections.map((conn) => {
                const source = activeMap.nodes.find((n) => n.id === conn.fromNodeId);
                const target = activeMap.nodes.find((n) => n.id === conn.toNodeId);
                if (!source || !target) return null;

                const sx = source.x + source.width / 2;
                const sy = source.y + source.height / 2;
                const tx = target.x + target.width / 2;
                const ty = target.y + target.height / 2;

                const midX = (sx + tx) / 2;
                const midY = (sy + ty) / 2;

                // Bezier curve
                const path = `M ${sx} ${sy} Q ${midX} ${midY - 30} ${tx} ${ty}`;

                return (
                  <g key={conn.id} className="pointer-events-auto">
                    <path
                      d={path}
                      stroke="var(--color-text-secondary)"
                      strokeWidth={conn.style === 'dashed' ? '2' : '2.5'}
                      strokeDasharray={conn.style === 'dashed' ? '5,5' : 'none'}
                      fill="none"
                      markerEnd="url(#arrow)"
                      opacity="0.4"
                    />
                    {conn.label && (
                      <text
                        x={midX}
                        y={midY - 18}
                        textAnchor="middle"
                        fill="var(--color-text-secondary)"
                        fontSize="11"
                        fontFamily="sans-serif"
                        className="select-none"
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Render Nodes as Interactive HTML Elements */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {activeMap.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isConnecting = connectionStartNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    className={`absolute rounded-2xl shadow-lg border-2 p-3 cursor-pointer pointer-events-auto transition-shadow flex flex-col justify-between group ${
                      isSelected
                        ? 'ring-2 ring-blue-500 shadow-xl'
                        : isConnecting
                        ? 'ring-2 ring-amber-500 animate-pulse'
                        : 'hover:border-blue-500/50'
                    }`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                      minHeight: node.imageUrl ? `${node.height + 70}px` : `${node.height}px`,
                      backgroundColor: 'var(--color-menu)',
                      borderColor: node.color || '#3B82F6',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: node.color }}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="p-0.5 text-[#919196] hover:text-red-400 cursor-pointer"
                            title="Excluir nó"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {node.imageUrl && (
                        <div className="w-full h-16 rounded-lg overflow-hidden mb-2 border border-[#242427]">
                          <img src={node.imageUrl} alt={node.label} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {node.label}
                      </h4>
                      {node.description && (
                        <p className="text-[10px] text-[#919196] line-clamp-2 mt-0.5 leading-tight">
                          {node.description}
                        </p>
                      )}
                    </div>

                    {/* Linked badges */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {node.linkedLessonId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenLesson) onOpenLesson(node.linkedLessonId!);
                          }}
                          className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 text-[9px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <BookOpen className="w-2.5 h-2.5" /> Aula
                        </button>
                      )}
                      {node.linkedDeckId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenDeck) onOpenDeck(node.linkedDeckId!);
                          }}
                          className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-800/60 text-[9px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <Brain className="w-2.5 h-2.5" /> Deck
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Inspector Drawer / Sidebar when a node is selected */}
          {selectedNode && (
            <div className="bg-[#121214] p-4 rounded-2xl border border-[#242427] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                  Editar Nó:
                </span>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const newLabel = e.target.value;
                    setSelectedNode({ ...selectedNode, label: newLabel });
                    StorageService.update((draft) => {
                      const m = draft.mindMaps.find((map) => map.id === activeMap.id);
                      const n = m?.nodes.find((item) => item.id === selectedNode.id);
                      if (n) n.label = newLabel;
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[#242427] bg-[#1C1C1F] text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={selectedNode.description || ''}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setSelectedNode({ ...selectedNode, description: newDesc });
                    StorageService.update((draft) => {
                      const m = draft.mindMaps.find((map) => map.id === activeMap.id);
                      const n = m?.nodes.find((item) => item.id === selectedNode.id);
                      if (n) n.description = newDesc;
                    });
                  }}
                  placeholder="Descrição..."
                  className="px-2.5 py-1 rounded-lg border border-[#242427] bg-[#1C1C1F] text-white text-xs w-64 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.color}
                  onChange={(e) => {
                    const newCol = e.target.value;
                    setSelectedNode({ ...selectedNode, color: newCol });
                    StorageService.update((draft) => {
                      const m = draft.mindMaps.find((map) => map.id === activeMap.id);
                      const n = m?.nodes.find((item) => item.id === selectedNode.id);
                      if (n) n.color = newCol;
                    });
                  }}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  title="Cor do Nó"
                />
                {/* Node image upload & edit */}
                <input
                  type="file"
                  id="node-image-upload-input-file"
                  accept="image/*"
                  onChange={handleNodeImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    if (selectedNode.imageUrl) {
                      setNodeImageOriginalSrc(selectedNode.originalImageUrl || selectedNode.imageUrl);
                      setIsNodeImageEditorOpen(true);
                    } else {
                      const el = document.getElementById('node-image-upload-input-file');
                      if (el) el.click();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1C1C1F] text-blue-400 border border-[#242427] hover:bg-[#242427] cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  {selectedNode.imageUrl ? 'Editar Imagem' : '+ Imagem'}
                </button>
                {selectedNode.imageUrl && (
                  <button
                    onClick={() => {
                      StorageService.update((draft) => {
                        const m = draft.mindMaps.find((map) => map.id === activeMap.id);
                        const n = m?.nodes.find((item) => item.id === selectedNode.id);
                        if (n) {
                          n.imageUrl = undefined;
                          n.originalImageUrl = undefined;
                          n.imageEditParams = undefined;
                        }
                      });
                      setSelectedNode({
                        ...selectedNode,
                        imageUrl: undefined,
                        originalImageUrl: undefined,
                        imageEditParams: undefined,
                      });
                    }}
                    className="px-2 py-1 rounded-lg bg-[#1C1C1F] text-red-400 border border-[#242427] hover:bg-red-500/10 cursor-pointer text-[10px]"
                    title="Remover Imagem"
                  >
                    Remover
                  </button>
                )}

                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3 py-1 rounded-lg bg-[#1C1C1F] text-[#919196] hover:text-white border border-[#242427] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mind Maps Gallery Grid */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Mapas Mentais & Grafo de Conceitos
              </h1>
              <p className="text-xs sm:text-sm text-[#919196] mt-1">
                Visualize conexões entre disciplinas, temas clínicos e capítulos no estilo Obsidian Graph
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiGeneratorOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Criar com IA
              </button>
              <button
                onClick={() => setNewMapModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Mapa Mental
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
              placeholder="Pesquisar mapa mental..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-[#242427] bg-[#121214] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Maps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mindMaps.map((map) => {
              const discipline = db.disciplines.find((d) => d.id === map.disciplineId);

              return (
                <div
                  key={map.id}
                  onClick={() => setActiveMapId(map.id)}
                  className="p-5 rounded-3xl bg-[#121214] border border-[#242427] shadow-xs hover:border-[#3A3A3E] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-1 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: map.color }}
                      >
                        <Network className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-[#919196] bg-[#1C1C1F] border border-[#242427] px-2.5 py-1 rounded-full">
                        {map.nodes.length} nós • {map.connections.length} conexões
                      </span>
                    </div>

                    <div>
                      {discipline && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {discipline.name}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition mt-0.5">
                        {map.title}
                      </h3>
                      <p className="text-xs text-[#919196] line-clamp-2 mt-1">
                        {map.description || 'Grafo de conexões conceituais'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#242427] flex items-center justify-between text-xs">
                    <span className="text-[#919196]">Layout: {map.layout}</span>
                    <span className="text-blue-400 font-bold group-hover:underline">Abrir Grafo →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Map Modal */}
      {newMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
              <h3 className="text-base font-bold text-white">
                Novo Mapa Mental
              </h3>
              <button onClick={() => setNewMapModalOpen(false)} className="text-[#919196] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Título do Mapa *
                </label>
                <input
                  type="text"
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  placeholder="Ex: Ciclo de Krebs e Bioenergética"
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Disciplina Vinculada
                </label>
                <select
                  value={newMapDisciplineId}
                  onChange={(e) => setNewMapDisciplineId(e.target.value)}
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
                  value={newMapDesc}
                  onChange={(e) => setNewMapDesc(e.target.value)}
                  placeholder="Ex: Reações enzimáticas e coenzimas"
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#242427]">
                <button
                  onClick={() => setNewMapModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateMap}
                  disabled={!newMapTitle.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  Criar Mapa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Mindmap Generator Modal */}
      {aiGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Gerar Mapa Mental com IA
                </h3>
              </div>
              <button onClick={() => setAiGeneratorOpen(false)} className="text-[#919196] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#919196]">
                Informe o tema ou anotação para que o Gemini gere automaticamente nós conceituais e conexões explicativas.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                  Tema / Conteúdo Central *
                </label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ex: Fisiologia do Sistema Respiratório: Ventilação, hematose, transporte de gases O2 e CO2 pela hemoglobina, controle bulbar da respiração."
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
                  onClick={handleAiGenerateMindmap}
                  disabled={!aiTopic.trim() || aiLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiLoading ? 'Gerando Grafo...' : 'Gerar Mapa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Image Editor for Mind Map Nodes */}
      {isNodeImageEditorOpen && nodeImageOriginalSrc && (
        <UniversalImageEditor
          isOpen={isNodeImageEditorOpen}
          onClose={() => {
            setIsNodeImageEditorOpen(false);
            setNodeImageOriginalSrc(null);
          }}
          title="Personalizar Imagem do Conceito"
          originalImage={nodeImageOriginalSrc}
          editParams={selectedNode?.imageEditParams}
          circleCrop={false}
          aspectRatios={['free', '1:1', '4:3', '16:9']}
          onSave={handleSaveNodeImage}
        />
      )}
    </div>
  );
};
