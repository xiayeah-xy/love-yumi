
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameScene, GameOption } from './types';
import { generateNextScene, generateSceneImage } from './services/geminiService';
import { INITIAL_PROMPT } from './constants';

interface ExtendedGameScene extends GameScene {
  mapIndex?: number;
}

const App: React.FC = () => {
  const [state, setState] = useState<GameState & { currentMapIndex: number }>({
    currentScene: null,
    history: [],
    loveScore: 52,
    isLoading: false,
    error: null,
    currentImageUrl: null,
    currentMapIndex: 1, 
  });

  const [musicPlaying, setMusicPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clickSfx = useRef<HTMLAudioElement>(null);
  const successSfx = useRef<HTMLAudioElement>(null);

  // 冒险地图：精致的 3D 图标，缩放比例更自然
  const AdventureMap = ({ currentIndex }: { currentIndex: number }) => {
    const steps = [
      { icon: '📍', label: '起点' },
      { icon: '🐱', label: '猫咪王国' },
      { icon: '🎡', label: '伦敦' },
      { icon: '🏔️', label: '老君山' },
      { icon: '🐎', label: '伊犁' },
      { icon: '🎁', label: '终点' },
    ];

    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[25px] px-6 py-3 flex items-center shadow-[0_8px_0_#dcd1bd] border-4 border-white mb-6 w-full animate-fade-in">
        <div className="mr-5 border-r border-[#f1ede4] pr-5 flex flex-col justify-center">
           <span className="text-[10px] font-black text-[#d14d56] uppercase tracking-tighter">冒险路线</span>
           <span className="text-[8px] text-gray-400 font-bold">Romantic Path</span>
        </div>
        <div className="flex-1 flex items-center justify-between relative px-2">
          <div className="absolute h-1 bg-[#f1ede4] left-8 right-8 top-1/2 -translate-y-1/2 z-0 rounded-full"></div>
          {steps.map((step, index) => {
            const pos = index + 1;
            const isCurrent = pos === currentIndex;
            const isPassed = pos < currentIndex;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-[15px] flex items-center justify-center text-xl shadow-lg transition-all duration-700 border-2 border-white ${isCurrent ? 'bg-[#ff8d94] scale-125 -translate-y-1 ring-4 ring-pink-100 rotate-3' : isPassed ? 'bg-[#7ed321]' : 'bg-white text-gray-200'}`}>
                  {isCurrent ? step.icon : isPassed ? '✓' : step.icon}
                </div>
                <span className={`absolute -bottom-5 text-[9px] font-black transition-all ${isCurrent ? 'opacity-100 text-[#d14d56]' : 'opacity-30 text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Petals = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(18)].map((_, i) => (
        <div key={i} className="romantic-petal-leaf" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${12 + Math.random() * 8}s`,
          opacity: 0.2 + Math.random() * 0.4,
          transform: `scale(${0.3 + Math.random() * 0.7})`,
        }}></div>
      ))}
    </div>
  );

  const startMusic = () => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch(() => console.log("Music play blocked, waiting for click..."));
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
        setMusicPlaying(false);
      } else {
        startMusic();
      }
    }
  };

  const playSfx = (ref: React.RefObject<HTMLAudioElement | null>) => {
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    }
  };

  const parseMarkdown = (text: string) => {
    if (!text || typeof text !== 'string') return '';
    return text.split('\n').map(line => {
      let trimmed = line.trim();
      if (trimmed.startsWith('>')) return `<blockquote class="romantic-bubble">${trimmed.substring(1).trim()}</blockquote>`;
      if (trimmed === '---') return `<hr class="romantic-hr" />`;
      if (trimmed.startsWith('<center>')) return `<div class="text-center font-black py-2 text-[#e11d48] text-base opacity-90">${trimmed.replace(/<\/?center>/g, '').replace(/\*\*/g, '')}</div>`;
      return trimmed ? `<p class="mb-3 leading-relaxed text-[#5d4a3b] text-base font-medium">${line}</p>` : '<div class="h-1"></div>';
    }).join('');
  };

  const startAdventure = async (initialChoice: string = INITIAL_PROMPT) => {
    playSfx(clickSfx);
    startMusic();
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scene = await generateNextScene(initialChoice, "2026年浪漫始发站") as ExtendedGameScene;
      const imageUrl = await generateSceneImage(scene.imagePrompt);
      playSfx(successSfx);
      setState(prev => ({
        ...prev,
        currentScene: scene,
        currentImageUrl: imageUrl,
        currentMapIndex: scene.mapIndex || 1,
        loveScore: prev.loveScore + 1,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "巴士猫在云层中迷路了，北北再试一次好吗？", isLoading: false }));
    }
  };

  const handleOptionSelect = async (option: GameOption) => {
    if (state.isLoading || !option) return;
    playSfx(clickSfx);
    if (!musicPlaying) startMusic();

    const prevStory = state.currentScene?.story || "";
    setState(prev => ({ ...prev, isLoading: true, error: null, history: [...prev.history, { action: option.text, story: prevStory }] }));

    try {
      const historySummary = state.history.map(h => h.action).join(" -> ");
      const nextScene = await generateNextScene(option.text, historySummary) as ExtendedGameScene;
      const imageUrl = await generateSceneImage(nextScene.imagePrompt);
      playSfx(successSfx);
      setState(prev => ({
        ...prev,
        currentScene: nextScene,
        currentImageUrl: imageUrl,
        currentMapIndex: nextScene.mapIndex || (prev.currentMapIndex < 6 ? prev.currentMapIndex + 1 : 6),
        loveScore: Math.min(100, prev.loveScore + 4),
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "时空连接稍有不稳，虎虎北再试一次？", isLoading: false }));
    }
  };

  if (!state.currentScene && !state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffe4e6] via-[#fff5f6] to-[#f7f2e8] p-4 text-center relative overflow-hidden">
        <Petals />
        <div className="max-w-[650px] w-full bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-[0_15px_0_#fecdd3] p-10 md:p-14 border-[6px] border-white relative z-10 animate-fade-in">
          <div className="absolute -top-8 left-8 w-20 h-20 bg-[#ff8d94] rounded-[25px] flex items-center justify-center shadow-xl rotate-[-8deg] border-4 border-white animate-float">
             <i className="fa-solid fa-van-shuttle text-white text-3xl"></i>
          </div>
          <div className="mb-6">
            <h1 className="special-font text-4xl text-[#d14d56] mb-1 drop-shadow-sm">2026 约定</h1>
            <p className="font-black text-[#f43f5e] tracking-[0.4em] text-[9px] uppercase opacity-70">Photograph · Cody Fry Special</p>
          </div>
          <div className="relative mb-10 bg-[#fff5f7] rounded-[35px] border-2 border-dashed border-pink-200 p-8 shadow-inner">
            <p className="text-[#8b7355] leading-relaxed font-black italic text-lg md:text-xl">
              “老婆北，我是你的巴士猫。<br/>
              在这浪漫的 <span className="text-[#d14d56]">2026 年</span>，<br/>
              你想去哪里书写我们的第一个篇章？”
            </p>
          </div>
          <button onClick={() => startAdventure()} className="group w-full bg-gradient-to-r from-[#ff8d94] to-[#fb7185] hover:to-[#f43f5e] text-white font-black py-5 rounded-[30px] transition-all transform hover:scale-105 shadow-[0_8px_0_#be123c] active:translate-y-1.5 active:shadow-none text-xl flex items-center justify-center gap-3">
            <i className="fa-solid fa-heart-pulse text-2xl group-hover:scale-110"></i>
            <span>踏入 2026 的约定</span>
          </button>
          
          <div className="mt-8 flex flex-col items-center gap-2 text-[#a69b81] font-bold text-[10px] opacity-60">
             <a 
              href="https://music.163.com/song?id=1804936925&uct2=U2FsdGVkX1/4YAS7dSZDxYqql2Ix6jm16krOp7AAOa0=" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#fb7185] transition-colors group"
             >
                <i className="fa-solid fa-compact-disc animate-spin-slow text-pink-400"></i>
                <span>点击收听：Photograph - Cody Fry (网易云音乐)</span>
                <i className="fa-solid fa-external-link text-[8px] group-hover:translate-x-1 transition-transform"></i>
             </a>
             <p className="uppercase tracking-widest italic opacity-40">Stereoscopic Soulmate Adventure</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] flex flex-col font-sans text-[#5d4a3b] relative">
      <Petals />
      
      {/* 固定音乐控制 */}
      <div className="fixed bottom-6 right-6 z-[100]">
         <button onClick={toggleMusic} className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-xl transition-all ${musicPlaying ? 'bg-[#7ed321] text-white rotate-12' : 'bg-white text-gray-400'}`}>
            <i className={`fa-solid ${musicPlaying ? 'fa-music' : 'fa-play'} text-lg`}></i>
         </button>
      </div>

      <header className="bg-white/95 sticky top-0 z-50 p-4 border-b-[6px] border-[#eee8d5] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ff8d94] rounded-[15px] flex items-center justify-center text-white rotate-[-4deg] border-2 border-white shadow-md animate-float">
            <i className="fa-solid fa-heart text-lg"></i>
          </div>
          <div>
            <span className="font-black text-[#d14d56] block text-xs tracking-tight">我们的 2026 约定</span>
            <span className="text-[#fb7185] font-black text-[10px]">契合度：{state.loveScore}%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.reload()} className="bg-[#eee8d5] hover:bg-[#ffda79] text-[#8b7355] w-9 h-9 rounded-xl flex items-center justify-center border-2 border-white shadow-sm active:scale-90 transition-all">
            <i className="fa-solid fa-house text-base"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center relative z-10" ref={scrollRef}>
        <div className="max-w-[900px] w-full pb-24">
          
          <AdventureMap currentIndex={state.currentMapIndex} />

          {state.isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 animate-pulse">
              <div className="w-20 h-20 bg-white rounded-[30px] border-4 border-[#ff8d94] flex items-center justify-center shadow-lg mb-6">
                <i className="fa-solid fa-wand-sparkles text-[#ff8d94] text-3xl"></i>
              </div>
              <p className="text-[#d14d56] font-black italic text-lg tracking-widest text-center">正在为你勾勒 2026 的风景...</p>
            </div>
          ) : (
            <>
              <div className="relative rounded-[35px] overflow-hidden ac-card border-[6px] border-white shadow-[0_12px_0_#dcd1bd] mb-6">
                {state.currentImageUrl ? (
                  <img src={state.currentImageUrl} alt="Scene" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-[#eee8d5] flex items-center justify-center">
                    <i className="fa-solid fa-image text-white text-5xl opacity-20"></i>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                   <div className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-md border border-[#ffda79] flex items-center gap-2">
                      <span className="text-lg">🐯</span>
                      <span className="font-black text-[#d14d56] text-[10px]">虎虎北已到达</span>
                   </div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#ffda79] text-[#8b7355] px-5 py-1.5 rounded-full text-xs font-black shadow-md border-2 border-white">
                    📍 {state.currentScene?.location}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[35px] p-6 md:p-10 border-[8px] border-[#eee8d5] ac-card relative mb-8 shadow-[0_12px_0_#dcd1bd]">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-[#7ed321] rounded-xl flex items-center justify-center shadow-md rotate-12 border-4 border-white">
                  <i className="fa-solid fa-camera text-white text-base"></i>
                </div>
                <div className="story-container text-[#5d4a3b]" dangerouslySetInnerHTML={{ __html: parseMarkdown(state.currentScene?.story || '') }} />
                
                {state.currentScene?.heartMessage && (
                  <div className="mt-6 bg-[#fff5f7] p-5 rounded-[25px] border border-dashed border-[#fb7185] text-[#e11d48] font-black flex flex-col items-center gap-3 shadow-inner">
                    <i className="fa-solid fa-heart text-pink-400 text-xl"></i>
                    <p className="italic text-base text-center font-serif leading-relaxed px-4">“{state.currentScene.heartMessage}”</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {state.currentScene?.options?.map((option) => (
                  <button key={option.id} onClick={() => handleOptionSelect(option)} className="group bg-white hover:bg-[#fffdf5] border-[3px] border-[#eee8d5] hover:border-[#fb7185] px-6 py-3.5 rounded-[22px] text-left transition-all flex items-center gap-3 option-btn transform hover:-translate-y-1 shadow-[0_6px_0_#dcd1bd] flex-1 min-w-[220px] max-w-[400px]">
                    <span className="w-8 h-8 bg-[#f7f2e8] rounded-lg flex items-center justify-center text-xl shrink-0 border border-white">{option.text.split(' ')[0]}</span>
                    <span className="font-black text-[#5d4a3b] text-xs group-hover:text-[#d14d56] leading-tight">
                      {option.text.split(' ').slice(1).join(' ')}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <audio ref={audioRef} loop crossOrigin="anonymous" preload="auto">
        <source src="https://cdn.pixabay.com/audio/2022/01/21/audio_3130c13c05.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={clickSfx} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />
      <audio ref={successSfx} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" />

      <footer className="p-6 text-center text-[#a69b81] bg-white border-t-[6px] border-[#eee8d5] relative z-10">
        <p className="special-font text-2xl text-[#e11d48] mb-1 drop-shadow-sm">祝 Yumi美北北 2026 情人节快乐 🌱</p>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Photograph - Cody Fry · Stereoscopic Soulmate Adventure</p>
      </footer>
    </div>
  );
};

export default App;
