import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterConfig } from './VeterinaryGameView';

interface ThreeDCharacterCanvasProps {
  character?: CharacterConfig;
  config?: CharacterConfig;
  animation?: 'idle' | 'victory' | 'thinking' | 'walking' | 'petting' | string;
  zoom?: number;
  rotationYOffset?: number;
  interactive?: boolean;
}

export const ThreeDCharacterCanvas: React.FC<ThreeDCharacterCanvasProps> = ({
  character: propCharacter,
  config,
  animation = 'idle',
  zoom = 1.0,
  interactive = true,
}) => {
  const defaultCharacter: CharacterConfig = {
    gender: 'female',
    hair: 'curly',
    hairColor: '#D35400', // Ginger/orange style default to match the ref image!
    clothing: 'lab_coat',
    accessory: 'stethoscope',
    skinColor: '#F5CBA7',
    name: 'Vet Estudante',
    faceShape: 'rounded',
    chinSize: 1.0,
    jawScale: 1.0,
    cheeksSize: 1.0,
    foreheadScale: 1.0,
    eyeShape: 'round',
    eyeSize: 1.0,
    eyeColor: '#2C3E50',
    eyebrowsStyle: 'thick',
    noseShape: 'button',
    lipsShape: 'neutral',
    lipsSize: 1.0,
    lipsExpression: 'smiling',
    clothingUpper: 'lab_coat',
    clothingUpperColor: '#EAEAEA',
    clothingLower: 'pants',
    clothingLowerColor: '#34495E',
    footwear: 'sneakers',
    footwearColor: '#2C3E50',
    accessoryColor: '#E74C3C',
  };

  const character = propCharacter || config || defaultCharacter;

  // Blinking animation state
  const [isBlinking, setIsBlinking] = useState(false);
  // Hearts/Particles for petting or victory animation
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; type: string }[]>([]);

  // Automatic blink timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Spawn particles during victory or petting
  useEffect(() => {
    if (animation === 'victory' || animation === 'petting') {
      const particleTypes = ['❤️', '✨', '⭐', '🐾', '💖'];
      const spawnInterval = setInterval(() => {
        setParticles((prev) => [
          ...prev.slice(-10), // Keep max 10
          {
            id: Date.now() + Math.random(),
            x: 30 + Math.random() * 140,
            y: 70 + Math.random() * 60,
            type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
          },
        ]);
      }, 500);

      return () => clearInterval(spawnInterval);
    } else {
      setParticles([]);
    }
  }, [animation]);

  // Visual coloring helpers for exact cell-shading
  const skinColor = character.skinColor || '#F5CBA7';
  const hairColor = character.hairColor || '#D35400';
  const eyeColor = character.eyeColor || '#2C3E50';
  const upperColor = character.clothingUpperColor || '#EAEAEA';
  const lowerColor = character.clothingLowerColor || '#34495E';
  const footwearColor = character.footwearColor || '#2C3E50';
  const accColor = character.accessoryColor || '#E74C3C';

  // Helper to darken colors beautifully for shadows
  const getShadowTone = (hex: string) => {
    try {
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length !== 6) return 'rgba(0, 0, 0, 0.15)';
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgb(${Math.max(0, Math.floor(r * 0.72))}, ${Math.max(0, Math.floor(g * 0.65))}, ${Math.max(0, Math.floor(b * 0.58))})`;
    } catch {
      return 'rgba(0, 0, 0, 0.18)';
    }
  };

  // Helper to brighten colors for highlights
  const getHighlightTone = (hex: string) => {
    try {
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length !== 6) return 'rgba(255, 255, 255, 0.2)';
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgb(${Math.min(255, Math.floor(r * 1.25))}, ${Math.min(255, Math.floor(g * 1.25))}, ${Math.min(255, Math.floor(b * 1.25))})`;
    } catch {
      return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const shadowSkin = getShadowTone(skinColor);
  const shadowHair = getShadowTone(hairColor);
  const shadowUpper = getShadowTone(upperColor);
  const highlightHair = getHighlightTone(hairColor);

  // Styling outlines to match viking/Kingdom Rush caricature image exactly
  // Thick, solid dark borders define the cartoon outline style!
  const strokeColor = '#211206';
  const strokeWidthMain = '4.5';
  const strokeWidthMedium = '3.5';

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none bg-gradient-to-b from-[#FAF8F5]/30 to-amber-500/5 dark:from-[#1A1A1E]/30 dark:to-[#111115]/10">
      
      {/* Floating Sparkles and Hearts */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.5, y: p.y }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.3, 1, 0.5], y: p.y - 90, x: p.x + (Math.random() * 50 - 25) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute text-lg pointer-events-none z-30"
            style={{ left: `${p.x}px` }}
          >
            {p.type}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Avatar Container with breathing/idle animation */}
      <motion.div 
        className="relative w-full max-w-[270px] aspect-square flex items-center justify-center"
        animate={{
          y: animation === 'victory' ? [0, -12, 0] : [0, 3, 0],
          scale: zoom,
          scaleY: animation === 'idle' ? [1, 1.02, 1] : 1,
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: animation === 'victory' ? 0.5 : 2.5,
            ease: "easeInOut"
          },
          scaleY: {
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut"
          }
        }}
      >
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(140,98,57,0.18)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
        >
          {/* BACKGROUND HALO */}
          <circle cx="100" cy="110" r="76" fill="#8C6239" fillOpacity="0.05" className="dark:fill-amber-500/5" />
          
          {/* STATIC BASE SHADOW (Ground Shadow) */}
          <ellipse cx="100" cy="186" rx="56" ry="8" fill="#1C1107" fillOpacity="0.25" />

          {/* 1. BACK HAIR LAYER (Long / curly styles) */}
          {character.hair === 'long' && (
            <g id="back-hair-long">
              {/* Left chunky lock */}
              <path d="M50,85 Q26,115 36,155 Q48,150 54,120 Q56,90 50,85" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
              <path d="M48,90 Q34,115 42,145" fill="none" stroke={shadowHair} strokeWidth={strokeWidthMedium} strokeLinecap="round" />
              {/* Right chunky lock */}
              <path d="M150,85 Q174,115 164,155 Q152,150 146,120 Q144,90 150,85" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
              <path d="M152,90 Q166,115 158,145" fill="none" stroke={shadowHair} strokeWidth={strokeWidthMedium} strokeLinecap="round" />
            </g>
          )}

          {character.hair === 'curly' && (
            <g id="back-hair-curly">
              {/* Left back bubbles */}
              <circle cx="48" cy="85" r="18" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
              <circle cx="42" cy="110" r="18" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
              {/* Right back bubbles */}
              <circle cx="152" cy="85" r="18" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
              <circle cx="158" cy="110" r="18" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
            </g>
          )}

          {character.hair === 'bun' && (
            <g id="back-hair-bun">
              {/* Big chunky topknot bun */}
              <circle cx="100" cy="34" r="17" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
              <path d="M90,32 Q100,22 110,32" stroke={highlightHair} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* 2. STOUT BENT LEGS (Viking wide stance!) */}
          <g id="legs">
            {/* Left Pant Leg */}
            <path d="M64,142 L55,166 L82,166 L83,142 Z" fill={lowerColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            <path d="M60,146 L55,160" stroke={getShadowTone(lowerColor)} strokeWidth="3" fill="none" />
            
            {/* Right Pant Leg */}
            <path d="M136,142 L145,166 L118,166 L117,142 Z" fill={lowerColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            <path d="M140,146 L145,160" stroke={getShadowTone(lowerColor)} strokeWidth="3" fill="none" />
          </g>

          {/* 3. HEAVY CHUNKY BOOTS */}
          <g id="boots">
            {/* Left Boot */}
            {/* Cuff */}
            <rect x="50" y="163" width="32" height="8" rx="3.5" fill={getShadowTone(footwearColor)} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
            {/* Boot body */}
            <path d="M52,171 C52,171 40,175 40,181 C40,185 48,187 78,187 C83,187 83,181 81,171 Z" fill={footwearColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            {/* Sole shadow */}
            <path d="M41,183 L77,183" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

            {/* Right Boot */}
            {/* Cuff */}
            <rect x="118" y="163" width="32" height="8" rx="3.5" fill={getShadowTone(footwearColor)} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
            {/* Boot body */}
            <path d="M148,171 C148,171 160,175 160,181 C160,185 152,187 122,187 C117,187 117,181 119,171 Z" fill={footwearColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            {/* Sole shadow */}
            <path d="M123,183 L159,183" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* 4. MASSIVE ROUNDED SHOULDERS & MUSCULAR ARMS */}
          <g id="arms">
            {/* Left Arm & Gauntlet */}
            {/* Left spherical shoulder */}
            <circle cx="56" cy="110" r="16" fill={upperColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
            <path d="M56,94 C46,94 40,105 40,112" stroke={getHighlightTone(upperColor)} strokeWidth="2" fill="none" />
            {/* Left thick forearm */}
            <path d="M40,114 C33,122 34,138 45,144 C49,141 55,123 55,114 Z" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            {/* Metal gauntlet/wristband cuff */}
            <rect x="34" y="127" width="18" height="10" rx="3" fill="#85929E" stroke={strokeColor} strokeWidth={strokeWidthMedium} />
            {/* Closed stout fist */}
            <circle cx="43" cy="144" r="10" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />

            {/* Right Arm & Gauntlet */}
            {/* Right spherical shoulder */}
            <circle cx="144" cy="110" r="16" fill={upperColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
            <path d="M144,94 C154,94 160,105 160,112" stroke={getHighlightTone(upperColor)} strokeWidth="2" fill="none" />
            {/* Right thick forearm */}
            <path d="M160,114 C167,122 166,138 155,144 C151,141 145,123 145,114 Z" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            {/* Metal gauntlet/wristband cuff */}
            <rect x="148" y="127" width="18" height="10" rx="3" fill="#85929E" stroke={strokeColor} strokeWidth={strokeWidthMedium} />
            {/* Closed stout fist */}
            <circle cx="157" cy="144" r="10" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
          </g>

          {/* 5. STOUT TORSO / CHEST CHASSIS */}
          <g id="torso">
            {/* Thick stout chest dome */}
            <path d="M 64,96 Q 100,89 136,96 L 140,141 Q 100,149 60,141 Z" fill={upperColor} stroke={strokeColor} strokeWidth={strokeWidthMain} strokeLinejoin="round" />
            {/* Base shading/depth */}
            <path d="M 62,125 Q 100,135 138,125 L 140,141 Q 100,149 60,141 Z" fill="none" stroke={shadowUpper} strokeWidth="5" opacity="0.3" />

            {/* UPPER CLOTHING STYLING DETAILED */}
            {character.clothingUpper === 'lab_coat' && (
              <g id="lab-coat-detailing">
                {/* V-neck scrubs inner */}
                <path d="M92,96 L108,96 L100,108 Z" fill="#27AE60" stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />
                <path d="M95,96 L100,103 L105,96" stroke="#1E703E" strokeWidth="1.5" fill="none" />
                
                {/* Coat Lapels with thick borders */}
                <path d="M74,120 L94,96 L100,125 Z" fill="#FAF8F5" stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />
                <path d="M126,120 L106,96 L100,125 Z" fill="#FAF8F5" stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />

                {/* Pocket clip with Red Cross */}
                <rect x="76" y="112" width="10" height="8" rx="1.5" fill="#FAF8F5" stroke={strokeColor} strokeWidth="2.5" />
                <path d="M81,114 L81,118 M79,116 L83,116" stroke="#E74C3C" strokeWidth="1.5" />
              </g>
            )}

            {character.clothingUpper === 'vet_scrubs' && (
              <g id="vet-scrubs-detailing">
                {/* V-neck stitch */}
                <path d="M91,96 L100,111 L109,96 Z" fill="#2980B9" fillOpacity="0.2" />
                <path d="M91,96 L100,111 L109,96" stroke={strokeColor} strokeWidth={strokeWidthMedium} fill="none" />
                {/* Vet print medical cross insignia on chest */}
                <circle cx="82" cy="112" r="5" fill="#FAF8F5" stroke={strokeColor} strokeWidth="2" />
                <path d="M82,109 L82,115 M79,112 L85,112" stroke="#27AE60" strokeWidth="1.5" />
              </g>
            )}

            {character.clothingUpper === 'hoodie' && (
              <g id="hoodie-detailing">
                {/* Stout outer cowl hood folds */}
                <path d="M80,94 Q100,108 120,94 Q100,88 80,94 Z" fill={getShadowTone(upperColor)} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                {/* Hoodie thick dangling tassels */}
                <line x1="94" y1="102" x2="94" y2="120" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                <circle cx="94" cy="120" r="2.5" fill="#F1C40F" />
                <line x1="106" y1="102" x2="106" y2="118" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                <circle cx="106" cy="118" r="2.5" fill="#F1C40F" />
              </g>
            )}

            {character.clothingUpper === 'jacket' && (
              <g id="jacket-detailing">
                {/* Chunky heavy collar flaps */}
                <path d="M74,120 L95,96 L100,120 Z" fill={getShadowTone(upperColor)} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                <path d="M126,120 L105,96 L100,120 Z" fill={getShadowTone(upperColor)} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                {/* Big shiny metallic gold zipper slider */}
                <line x1="100" y1="104" x2="100" y2="135" stroke={strokeColor} strokeWidth="3.5" />
                <rect x="97" y="106" width="6" height="10" rx="1" fill="#F1C40F" stroke={strokeColor} strokeWidth="2" />
              </g>
            )}
          </g>

          {/* 6. HEAVY BELT & MEDICAL/PAW BUCKLE */}
          <g id="belt-group">
            {/* Thick brown belt */}
            <rect x="58" y="135" width="84" height="13" rx="4" fill="#5C3A21" stroke={strokeColor} strokeWidth={strokeWidthMain} />
            {/* Belt segment details */}
            <line x1="72" y1="135" x2="72" y2="148" stroke={strokeColor} strokeWidth="3" />
            <line x1="128" y1="135" x2="128" y2="148" stroke={strokeColor} strokeWidth="3" />
            
            {/* Giant Viking-style shiny gold buckle (paw/cross themed!) */}
            <rect x="85" y="128" width="30" height="26" rx="6.5" fill="#F1C40F" stroke={strokeColor} strokeWidth={strokeWidthMain} />
            {/* Shiny gold buckle highlight */}
            <rect x="88" y="131" width="24" height="8" rx="2" fill="#FEF9E7" fillOpacity="0.5" />
            
            {/* Buckle veterinary symbol (paw or medical cross) */}
            <path d="M100,135 L100,147 M94,141 L106,141" stroke="#B7950B" strokeWidth="4.5" strokeLinecap="round" />
          </g>

          {/* 7. STOUT SHORT NECK */}
          <g id="neck">
            <rect x="88" y="76" width="24" height="16" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
            <path d="M88,85 Q100,92 112,85" stroke={shadowSkin} strokeWidth="3.5" fill="none" />
          </g>

          {/* 8. STOUT CARICATURE HEAD & FACE BASE */}
          <g id="head-base">
            {/* Robust broad jaw oval */}
            <ellipse cx="100" cy="65" rx="33" ry="29" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
            
            {/* Highlight on forehead */}
            <path d="M80,48 Q100,42 120,48" stroke="#FFF" strokeWidth="2.5" fill="none" opacity="0.3" />

            {/* Rosy blush comic cheeks */}
            <circle cx="77" cy="72" r="6" fill="#E74C3C" fillOpacity="0.25" />
            <circle cx="123" cy="72" r="6" fill="#E74C3C" fillOpacity="0.25" />

            {/* Cartoon Ears */}
            {/* Left Ear */}
            <circle cx="64" cy="66" r="8" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
            <circle cx="64" cy="66" r="3.5" fill={shadowSkin} />
            {/* Right Ear */}
            <circle cx="136" cy="66" r="8" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
            <circle cx="136" cy="66" r="3.5" fill={shadowSkin} />
          </g>

          {/* 9. CARTONISH MASCULINE BEARD (Kingdom Rush Viking beard!) */}
          {character.gender !== 'female' && (
            <g id="viking-beard">
              {/* Glorious giant flowing ginger/warrior beard */}
              <path 
                d="M 66,62 
                   Q 100,116 134,62 
                   C 139,82 126,108 100,115 
                   C 74,108 61,82 66,62 Z" 
                fill={hairColor} 
                stroke={strokeColor} 
                strokeWidth={strokeWidthMain} 
                strokeLinejoin="round" 
              />
              {/* Deeper cell-shading shape on beard */}
              <path 
                d="M 74,74 
                   Q 100,104 126,74 
                   C 121,90 113,103 100,109 
                   C 87,103 79,90 74,74 Z" 
                fill={shadowHair} 
              />
              {/* Highlight curls/lines on beard */}
              <path d="M80,68 Q100,94 120,68" stroke={highlightHair} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M88,72 Q100,98 112,72" stroke={highlightHair} strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Bold epic mustache */}
              <g id="mustache">
                {/* Left Mustache lobe */}
                <path d="M 100,69 Q 78,71 72,83 Q 86,84 100,74 Z" fill={highlightHair} stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />
                {/* Right Mustache lobe */}
                <path d="M 100,69 Q 122,71 128,83 Q 114,84 100,74 Z" fill={highlightHair} stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />
              </g>
            </g>
          )}

          {/* 10. EXPRESSIVE CARTOON EYES, BROWS & NOSE */}
          <g id="eyes-brows">
            {isBlinking ? (
              <>
                {/* Blinking squint line left */}
                <path d="M75,58 Q85,63 93,58" stroke={strokeColor} strokeWidth="5.5" fill="none" strokeLinecap="round" />
                {/* Blinking squint line right */}
                <path d="M107,58 Q115,63 125,58" stroke={strokeColor} strokeWidth="5.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Left Eye */}
                <g id="left-eye">
                  <ellipse cx="85" cy="58" rx="10" ry="9" fill="#FFFFFF" stroke={strokeColor} strokeWidth="4" />
                  <circle cx="85" cy="58" r="5.5" fill={eyeColor} />
                  <circle cx="85" cy="58" r="3" fill="#1C1107" />
                  <circle cx="82.5" cy="55.5" r="2" fill="#FFFFFF" />
                </g>
                
                {/* Right Eye */}
                <g id="right-eye">
                  <ellipse cx="115" cy="58" rx="10" ry="9" fill="#FFFFFF" stroke={strokeColor} strokeWidth="4" />
                  <circle cx="115" cy="58" r="5.5" fill={eyeColor} />
                  <circle cx="115" cy="58" r="3" fill="#1C1107" />
                  <circle cx="112.5" cy="55.5" r="2" fill="#FFFFFF" />
                </g>
              </>
            )}

            {/* MASSIVE EPIC WARRIOR BROWS (Viking image highlight!) */}
            <g id="chunky-eyebrows">
              {/* Left Brow */}
              <path d="M 72,50 L 96,44 L 94,39 L 72,44 Z" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />
              {/* Right Brow */}
              <path d="M 128,50 L 104,44 L 106,39 L 128,44 Z" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinejoin="round" />
            </g>

            {/* Big rounded comic nose */}
            <path d="M93,62 Q100,72 107,62" fill={skinColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} strokeLinecap="round" />
          </g>

          {/* 11. MOUTH / LIPS EXPRESSIONS */}
          <g id="mouth">
            {/* If has a beard, mouth fits in center cavity, otherwise clean rendering */}
            {character.lipsExpression === 'smiling' && (
              <path d="M91,73 Q100,82 109,73" stroke={strokeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            )}
            {character.lipsExpression === 'neutral' && (
              <line x1="93" y1="74" x2="107" y2="74" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            )}
            {character.lipsExpression === 'thinking' && (
              <line x1="94" y1="74" x2="104" y2="72" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            )}
            {character.lipsExpression === 'surprised' && (
              <circle cx="100" cy="74" r="5.5" fill="#7B1F1F" stroke={strokeColor} strokeWidth="3" />
            )}
            {character.lipsExpression === 'nervous' && (
              <path d="M92,75 Q96,71 100,75 Q104,71 108,75" stroke={strokeColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}
            {character.lipsExpression === 'confident' && (
              <path d="M91,75 Q96,74 108,69" stroke={strokeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            )}
            {character.lipsExpression === 'tired' && (
              <g>
                <path d="M94,75 Q100,71 106,75" stroke={strokeColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <circle cx="100" cy="79" r="2" fill="#7B1F1F" />
              </g>
            )}
          </g>

          {/* 12. EPIC CARTOON HAIR - FRONT OVERLAY */}
          <g id="front-hair-overlay">
            {character.hair === 'short' && (
              /* Spiky dynamic hair clumps */
              <path 
                d="M58,54 
                   C54,26 146,26 142,54 
                   C130,42 120,45 112,38 
                   C102,46 94,40 86,46 
                   C74,40 66,45 58,54 Z" 
                fill={hairColor} 
                stroke={strokeColor} 
                strokeWidth={strokeWidthMain} 
                strokeLinejoin="round" 
              />
            )}

            {character.hair === 'curly' && (
              /* Bubbly dynamic round locks overlay */
              <g>
                <circle cx="100" cy="38" r="14" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
                <circle cx="84" cy="42" r="13" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
                <circle cx="116" cy="42" r="13" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
                <circle cx="70" cy="52" r="13" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
                <circle cx="130" cy="52" r="13" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
              </g>
            )}

            {character.hair === 'long' && (
              /* Flowing heavy locks */
              <g>
                {/* Crown base */}
                <path 
                  d="M58,52 
                     C58,24 142,24 142,52 
                     C130,42 110,48 100,42 
                     C90,48 70,42 58,52 Z" 
                  fill={hairColor} 
                  stroke={strokeColor} 
                  strokeWidth={strokeWidthMain} 
                  strokeLinejoin="round" 
                />
                {/* Braids or extra volume lock details if female */}
                {character.gender === 'female' && (
                  <g id="braid-locks">
                    {/* Left braid */}
                    <circle cx="48" cy="115" r="8" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                    <circle cx="44" cy="130" r="7" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                    <circle cx="42" cy="144" r="6" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                    {/* Right braid */}
                    <circle cx="152" cy="115" r="8" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                    <circle cx="156" cy="130" r="7" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                    <circle cx="158" cy="144" r="6" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidthMedium} />
                  </g>
                )}
              </g>
            )}

            {character.hair === 'bun' && (
              /* Messy crown with topknot underneath */
              <path 
                d="M58,54 
                   C58,26 142,26 142,54 
                   C128,44 72,44 58,54 Z" 
                fill={hairColor} 
                stroke={strokeColor} 
                strokeWidth={strokeWidthMain} 
                strokeLinejoin="round" 
              />
            )}

            {/* Hair Shine highlight line */}
            <path d="M74,41 Q100,32 126,41" stroke="#FEF9E7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3" />
          </g>

          {/* 13. ACCESSORIES (Stethoscope, glasses, etc.) */}
          <g id="accessories">
            {character.accessory === 'stethoscope' && (
              <g id="stethoscope-accessory">
                {/* Silver tubes around neck shoulders */}
                <path d="M78,92 Q100,108 122,92" stroke={accColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
                {/* Drooping lead line */}
                <path d="M110,98 Q105,115 101,121" stroke={accColor} strokeWidth="3" fill="none" />
                {/* Big metallic shiny capsule */}
                <circle cx="101" cy="122" r="5" fill="#D5DBDB" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="101" cy="122" r="1.5" fill={accColor} />
              </g>
            )}

            {character.accessory === 'glasses' && (
              <g id="glasses-accessory">
                {/* Bold retro comic frames */}
                <rect x="71" y="50" width="22" height="15" rx="4" fill="none" stroke={strokeColor} strokeWidth="4.5" />
                <rect x="107" y="50" width="22" height="15" rx="4" fill="none" stroke={strokeColor} strokeWidth="4.5" />
                {/* Bridge */}
                <line x1="93" y1="56" x2="107" y2="56" stroke={strokeColor} strokeWidth="4.5" />
                {/* Glare line */}
                <line x1="74" y1="60" x2="82" y2="52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <line x1="110" y1="60" x2="118" y2="52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              </g>
            )}

            {character.accessory === 'goggles' && (
              <g id="goggles-accessory">
                {/* Neon safety visor across eyes */}
                <rect x="66" y="47" width="68" height="21" rx="6" fill={accColor} fillOpacity="0.25" stroke={strokeColor} strokeWidth="4" />
                <line x1="66" y1="57" x2="134" y2="57" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
                <rect x="70" y="50" width="26" height="14" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
                <rect x="104" y="50" width="26" height="14" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
              </g>
            )}

            {character.accessory === 'clipboard' && (
              /* Clipboard tucked in left fist */
              <g id="clipboard-accessory" transform="translate(18, 115) scale(0.42)">
                <rect x="0" y="0" width="55" height="72" rx="4" fill="#D35400" stroke={strokeColor} strokeWidth="4" />
                <rect x="5" y="10" width="45" height="54" fill="#FFFFFF" />
                <rect x="18" y="-4" width="19" height="11" rx="2" fill="#7F8C8D" stroke={strokeColor} strokeWidth="2.5" />
                {/* Medical lines */}
                <line x1="10" y1="20" x2="45" y2="20" stroke="#BDC3C7" strokeWidth="3.5" />
                <line x1="10" y1="30" x2="40" y2="30" stroke="#BDC3C7" strokeWidth="3.5" />
                <line x1="10" y1="40" x2="45" y2="40" stroke="#BDC3C7" strokeWidth="3.5" />
              </g>
            )}

            {character.accessory === 'cap' && (
              <g id="cap-accessory">
                {/* Cap Dome */}
                <path d="M58,45 C58,20 142,20 142,45 Z" fill={accColor} stroke={strokeColor} strokeWidth={strokeWidthMain} />
                {/* Thick Cap bill */}
                <path d="M52,44 Q100,35 148,44 Q130,55 52,44" fill={getShadowTone(accColor)} stroke={strokeColor} strokeWidth={strokeWidthMain} />
                {/* Cap top button */}
                <circle cx="100" cy="22" r="4.5" fill="#F1C40F" stroke={strokeColor} strokeWidth="2" />
              </g>
            )}
          </g>
        </svg>

        {/* 14. COMPANION ANIMAL OVERLAY (DOG/CAT ETC) IN THE SAME THICK-OUTLINE CARTOON STYLE! */}
        {(animation === 'petting' || animation === 'idle') && (
          <motion.div 
            className="absolute bottom-[-14px] right-[-14px] w-[95px] h-[95px] z-20 pointer-events-none"
            initial={{ scale: 0.85, rotate: -4 }}
            animate={{ 
              scale: [0.96, 1.02, 0.96],
              rotate: [3, -3, 3],
              y: [0, -3, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.3, 
              ease: "easeInOut" 
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              {/* Floating paw halo background */}
              <circle cx="50" cy="55" r="38" fill="#FFF" stroke={strokeColor} strokeWidth="3.5" />
              <circle cx="50" cy="55" r="33" fill="#FDFDF9" />

              {/* Robust vector puppy in identical thick outline style */}
              <g transform="translate(0, 4)">
                {/* Floppy heavy puppy ears */}
                <path d="M18,30 C10,36 6,56 18,52 Z" fill="#BA68C8" stroke={strokeColor} strokeWidth="3" />
                <path d="M82,30 C90,36 94,56 82,52 Z" fill="#BA68C8" stroke={strokeColor} strokeWidth="3" />

                {/* Golden/chubby dog head base */}
                <ellipse cx="50" cy="48" rx="27" ry="23" fill="#F39C12" stroke={strokeColor} strokeWidth="3.5" />
                <ellipse cx="50" cy="53" rx="16" ry="11" fill="#FEF9E7" />

                {/* Stout cartoon puppy eyes */}
                <circle cx="38" cy="41" r="4.5" fill="#2C3E50" stroke={strokeColor} strokeWidth="2" />
                <circle cx="36.5" cy="39.5" r="1.5" fill="#FFFFFF" />
                <circle cx="62" cy="41" r="4.5" fill="#2C3E50" stroke={strokeColor} strokeWidth="2" />
                <circle cx="61" cy="39.5" r="1.5" fill="#FFFFFF" />

                {/* Big happy tongue */}
                <path d="M47,58 C47,67 53,67 53,58 Z" fill="#E74C3C" stroke={strokeColor} strokeWidth="2" />

                {/* Nose */}
                <ellipse cx="50" cy="50" rx="5" ry="3.5" fill="#1C1107" />

                {/* Mouth whiskers line */}
                <path d="M44,52 Q50,55 56,52" stroke={strokeColor} strokeWidth="2" fill="none" />
              </g>

              {/* Tiny Rescue Badge overlay */}
              <circle cx="82" cy="74" r="10" fill="#F1C40F" stroke={strokeColor} strokeWidth="2.5" />
              <path d="M82,70 L82,78 M78,74 L86,74" stroke="#FFF" strokeWidth="2" />
            </svg>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
