import React, { useState, useEffect } from 'react';
import { CanvasElement } from '../../types';
import { Trash2, Copy, RotateCw, Type, Sparkles } from 'lucide-react';

interface FloatingWidgetsProps {
  canvasElements: CanvasElement[];
  onChange: (elements: CanvasElement[]) => void;
}

export const FloatingWidgets: React.FC<FloatingWidgetsProps> = ({
  canvasElements,
  onChange,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [resizedId, setResizedId] = useState<string | null>(null);
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Color options for custom styling
  const POSTIT_COLORS = [
    { bg: '#fef08a', text: '#854d0e', name: 'Amarelo' },
    { bg: '#bfdbfe', text: '#1e3a8a', name: 'Azul' },
    { bg: '#bbf7d0', text: '#166534', name: 'Verde' },
    { bg: '#fbcfe8', text: '#9d174d', name: 'Rosa' },
    { bg: '#e9d5ff', text: '#6b21a8', name: 'Lilás' },
    { bg: '#ffedd5', text: '#9a3412', name: 'Laranja' },
    { bg: '#efebe9', text: '#4e342e', name: 'Bege' },
    { bg: '#e0f2fe', text: '#0369a1', name: 'Celeste' },
  ];

  const handleMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    e.preventDefault();
    setDraggedId(el.id);
    setDragOffset({
      x: e.clientX - el.x,
      y: e.clientY - el.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.preventDefault();
    e.stopPropagation();
    setResizedId(el.id);
    setStartSize({ w: el.width, h: el.height });
    setStartMouse({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedId) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        onChange(
          canvasElements.map((el) =>
            el.id === draggedId
              ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
              : el
          )
        );
      } else if (resizedId) {
        const el = canvasElements.find((item) => item.id === resizedId);
        if (!el) return;
        const deltaX = e.clientX - startMouse.x;
        const deltaY = e.clientY - startMouse.y;
        onChange(
          canvasElements.map((item) =>
            item.id === resizedId
              ? {
                  ...item,
                  width: Math.max(120, startSize.w + deltaX),
                  height: Math.max(80, startSize.h + deltaY),
                }
              : item
          )
        );
      }
    };

    const handleMouseUp = () => {
      setDraggedId(null);
      setResizedId(null);
    };

    if (draggedId || resizedId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedId, resizedId, dragOffset, startSize, startMouse, canvasElements]);

  const handleDelete = (id: string) => {
    onChange(canvasElements.filter((el) => el.id !== id));
  };

  const handleDuplicate = (el: CanvasElement) => {
    const newEl: CanvasElement = {
      ...el,
      id: el.id.split('_')[0] + '_' + Date.now(),
      x: el.x + 30,
      y: el.y + 30,
      zIndex: canvasElements.length + 1,
    };
    onChange([...canvasElements, newEl]);
  };

  const handleRotate = (el: CanvasElement) => {
    const currentRot = el.rotation || 0;
    const nextRot = (currentRot + 15) % 360;
    onChange(
      canvasElements.map((item) =>
        item.id === el.id ? { ...item, rotation: nextRot } : item
      )
    );
  };

  const handleStyleChange = (el: CanvasElement, styleUpdate: any) => {
    onChange(
      canvasElements.map((item) =>
        item.id === el.id
          ? { ...item, style: { ...(item.style || {}), ...styleUpdate } }
          : item
      )
    );
  };

  return (
    <>
      {canvasElements.map((el) => {
        const isPostit = el.type === 'postit' || el.type === 'text';
        const isFlashcard = el.type === 'flashcard';
        if (!isPostit && !isFlashcard) return null;

        // Rotation inline style
        const rotationDeg = el.rotation || 0;

        // Parse content if flashcard
        let flashcardData = { front: 'Frente', back: 'Verso', title: 'Flashcard' };
        if (isFlashcard) {
          try {
            flashcardData = JSON.parse(el.content);
          } catch (e) {
            // Fallback
            flashcardData = { front: el.content, back: 'Resposta', title: 'Revisão' };
          }
        }

        const isFlipped = flippedCards[el.id] || false;
        const fontFam = el.style?.fontFamily || (isPostit ? 'Caveat' : 'Plus Jakarta Sans');
        const bgColor = el.style?.backgroundColor || (isPostit ? '#efebe9' : '#ffe4e6'); // Default to classy beige/brown from image
        const textColor = el.style?.color || (isPostit ? '#4e342e' : '#9f1239'); // Default to dark coffee brown
        const fontSizeVal = el.style?.fontSize || 13;
        const noteStyle = el.style?.borderColor || 'tape'; // Default to brown tape style

        return (
          <div
            key={el.id}
            onMouseDown={(e) => handleMouseDown(e, el)}
            className="absolute rounded-xl shadow-md border border-[#8A7D73]/30 select-none group transition-shadow active:shadow-xl z-20 overflow-visible"
            style={{
              top: `${el.y}px`,
              left: `${el.x}px`,
              width: `${el.width}px`,
              minHeight: `${el.height}px`,
              backgroundColor: isFlashcard ? undefined : bgColor,
              color: isFlashcard ? undefined : textColor,
              transform: `rotate(${rotationDeg}deg)`,
              fontFamily: fontFam,
            }}
          >
            {/* Visual Tape Deco for Taped Post-it: Earthy brown adhesive tape from picture */}
            {isPostit && noteStyle === 'tape' && (
              <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#7E6258]/80 border border-[#614B42]/30 rounded-md rotate-[-1deg] z-30 pointer-events-none"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
            )}

            {/* Visual Quote Deco for Quote-style Post-it */}
            {isPostit && noteStyle === 'quote' && (
              <div className="absolute top-2 left-3 text-3xl font-serif text-[#7E6258]/40 leading-none pointer-events-none select-none z-30">
                “
              </div>
            )}

            {/* Visual Brown Side Tape/Tabs for Ruled Dash style Post-it */}
            {isPostit && noteStyle === 'ruled-dash' && (
              <div 
                className="absolute top-4 -left-2 w-2.5 h-10 bg-[#7E6258] rounded-l-md z-30 pointer-events-none"
                style={{ boxShadow: '-1px 1px 3px rgba(0,0,0,0.15)' }}
              />
            )}

            {/* Element Action Toolbar - Visible on hover */}
            <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:flex items-center gap-1 bg-stone-900/95 border border-stone-700 backdrop-blur-xs p-1 rounded-lg shadow-xl z-50 no-drag">
              <button
                onClick={() => handleRotate(el)}
                className="p-1 hover:bg-stone-800 rounded text-[#D1D1D6] transition cursor-pointer"
                title="Girar"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDuplicate(el)}
                className="p-1 hover:bg-stone-800 rounded text-[#D1D1D6] transition cursor-pointer"
                title="Duplicar"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(el.id)}
                className="p-1 hover:bg-red-950 rounded text-red-400 transition cursor-pointer"
                title="Deletar"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

              {/* Color swatches (Mocha/Beige tones by default) */}
              <div className="flex items-center gap-0.5 px-1">
                {[
                  { bg: '#efebe9', text: '#4e342e', name: 'Bege' },
                  { bg: '#FAF8F5', text: '#614B42', name: 'Alabastro' },
                  { bg: '#D4CFC9', text: '#4A3C31', name: 'Taupe' },
                  { bg: '#F5ECE3', text: '#7E6258', name: 'Areia' },
                  { bg: '#fef08a', text: '#854d0e', name: 'Amarelo' },
                  { bg: '#bbf7d0', text: '#166534', name: 'Verde' },
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleStyleChange(el, { backgroundColor: color.bg, color: color.text })}
                    className="w-2.5 h-2.5 rounded-full border border-black/10 transition cursor-pointer"
                    style={{ backgroundColor: color.bg }}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

              {/* Deco style switcher for Post-its matching POST IT.jpg */}
              {isPostit && (
                <div className="flex items-center gap-1.5 text-[9px] text-[#A1A1AA] px-1 font-sans">
                  <button
                    onClick={() => handleStyleChange(el, { borderColor: 'normal' })}
                    className={`hover:text-white ${!el.style?.borderColor || el.style.borderColor === 'normal' ? 'text-amber-400 font-bold' : ''}`}
                  >
                    Liso
                  </button>
                  <button
                    onClick={() => handleStyleChange(el, { borderColor: 'tape' })}
                    className={`hover:text-white ${el.style?.borderColor === 'tape' ? 'text-amber-400 font-bold' : ''}`}
                  >
                    Fita
                  </button>
                  <button
                    onClick={() => handleStyleChange(el, { borderColor: 'quote' })}
                    className={`hover:text-white ${el.style?.borderColor === 'quote' ? 'text-amber-400 font-bold' : ''}`}
                  >
                    Citação
                  </button>
                  <button
                    onClick={() => handleStyleChange(el, { borderColor: 'ruled-dash' })}
                    className={`hover:text-white ${el.style?.borderColor === 'ruled-dash' ? 'text-amber-400 font-bold' : ''}`}
                  >
                    Pautado
                  </button>
                </div>
              )}
            </div>

            {/* RENDER POSTIT VIEW */}
            {isPostit && (
              <div 
                className="p-4 flex flex-col h-full justify-between rounded-xl relative"
                style={{
                  backgroundImage: noteStyle === 'ruled-dash' 
                    ? `repeating-linear-gradient(transparent, transparent 23px, rgba(126, 98, 88, 0.15) 23px, rgba(126, 98, 88, 0.15) 24px)` 
                    : undefined,
                  backgroundSize: '100% 24px',
                  lineHeight: '24px',
                }}
              >
                <div className="flex items-center justify-between pb-1 border-b border-[#8A7D73]/15 mb-2 text-[9px] uppercase tracking-wider font-sans opacity-55 font-extrabold text-[#7E6258]">
                  <span>{noteStyle === 'quote' ? 'Citação Marcante' : noteStyle === 'ruled-dash' ? 'Anotações Pautadas' : 'Anotação Estética'}</span>
                </div>
                <textarea
                  value={el.content}
                  onChange={(e) => {
                    onChange(
                      canvasElements.map((item) =>
                        item.id === el.id ? { ...item, content: e.target.value } : item
                      )
                    );
                  }}
                  style={{ 
                    fontSize: `${fontSizeVal}px`, 
                    color: textColor,
                    paddingLeft: noteStyle === 'quote' ? '12px' : undefined,
                    paddingTop: noteStyle === 'ruled-dash' ? '4px' : undefined,
                    lineHeight: noteStyle === 'ruled-dash' ? '24px' : undefined,
                  }}
                  className="w-full bg-transparent resize-none focus:outline-none leading-relaxed no-drag font-medium"
                  rows={4}
                />
              </div>
            )}

            {/* RENDER FLASHCARD VIEW (3D Flip Animation Card) */}
            {isFlashcard && (
              <div
                className="w-full h-full relative cursor-pointer no-drag select-none"
                style={{
                  height: `${el.height}px`,
                  perspective: '1000px',
                }}
                onClick={() => {
                  setFlippedCards({
                    ...flippedCards,
                    [el.id]: !isFlipped,
                  });
                }}
              >
                {/* 3D Inner Card Container */}
                <div
                  className="w-full h-full rounded-xl transition-all duration-500 relative shadow-md"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    backgroundColor: bgColor,
                    color: textColor,
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  {/* FRONT SIDE */}
                  <div
                    className="absolute inset-0 p-3.5 flex flex-col justify-between"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="flex justify-between items-center pb-1 border-b border-black/5 text-[9px] uppercase tracking-wide font-bold font-sans opacity-70">
                      <span>{flashcardData.title || 'Flashcard'}</span>
                      <span className="bg-white/40 px-1.5 py-0.5 rounded">Frente (Pergunta)</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-center p-1">
                      <textarea
                        value={flashcardData.front}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const updatedData = { ...flashcardData, front: e.target.value };
                          onChange(
                            canvasElements.map((item) =>
                              item.id === el.id
                                ? { ...item, content: JSON.stringify(updatedData) }
                                : item
                            )
                          );
                        }}
                        style={{ fontSize: `${fontSizeVal}px`, color: textColor }}
                        className="w-full bg-transparent text-center resize-none focus:outline-none leading-normal font-bold no-drag"
                        rows={3}
                      />
                    </div>
                    <div className="text-[8px] text-center opacity-60 font-sans mt-1">
                      Clique para ver a resposta
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div
                    className="absolute inset-0 p-3.5 flex flex-col justify-between bg-indigo-50/95"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      color: '#1e3a8a',
                      borderRadius: '12px',
                    }}
                  >
                    <div className="flex justify-between items-center pb-1 border-b border-blue-500/10 text-[9px] uppercase tracking-wide font-bold font-sans text-blue-500">
                      <span>{flashcardData.title || 'Flashcard'}</span>
                      <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">Verso (Resposta)</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-center p-1">
                      <textarea
                        value={flashcardData.back}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const updatedData = { ...flashcardData, back: e.target.value };
                          onChange(
                            canvasElements.map((item) =>
                              item.id === el.id
                                ? { ...item, content: JSON.stringify(updatedData) }
                                : item
                            )
                          );
                        }}
                        style={{ fontSize: `${fontSizeVal}px` }}
                        className="w-full bg-transparent text-center resize-none focus:outline-none leading-normal text-blue-900 font-bold no-drag"
                        rows={3}
                      />
                    </div>
                    <div className="text-[8px] text-center text-blue-400 font-sans mt-1">
                      Clique para voltar à pergunta
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resize Drag Handle */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, el)}
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-40"
              style={{
                backgroundImage: 'linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.15) 40%)',
                borderBottomRightRadius: '12px',
              }}
            />
          </div>
        );
      })}
    </>
  );
};
