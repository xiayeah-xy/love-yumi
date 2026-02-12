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

  // 1. 冒险地图：图标变大，文字完整显示
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
      <div className="bg-white/90 backdrop-blur-md rounded-[35px] px-8 py-6 flex flex-col items-center shadow-[0_10px_0_#dcd1bd] border-4 border-white mb-8 w-full animate-fade-in">
        <div className="w-full flex justify-between items-center relative px-2">
          <div className="absolute h-1.5 bg-[#f1ede4] left-10 right-10 top-8 z-0 rounded-full"></div>
          {steps.map((step, index) => {
            const pos = index + 1;
            const isCurrent = pos === currentIndex;
            const isPassed = pos < currentIndex;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center min-w-[60px]">
                <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-3xl shadow-xl transition-all duration-700 border-4 border-white ${isCurrent ? 'bg-[#ff8d94] scale-125 -translate-y-2 ring-8 ring-pink-100 rotate-3' : isPassed ? 'bg-[#7ed321]' : 'bg-white text-gray-200'}`}>
                  {isCurrent ? step.icon : isPassed ? '✓' : step.icon}
                </div>
                <span className={`mt-4 text-[13px] font-black whitespace-nowrap transition-all ${isCurrent ? 'opacity-100 text-[#d14d56] scale-110' : 'opacity-40 text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. 动森风格背景装饰组件
  const ACBackground = () => (
    <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
      <div className="absolute top-20 left-10 text-6xl">🌲</div>
      <div className="absolute top-40 right-20 text-5xl">🍎</div>
      <div className="absolute bottom-20 left-20 text-6xl">🌳</div>
      <div className="absolute bottom-40 right-10 text-5xl">🦋</div>
      <div className="absolute top-1/4 right-1/4 text-4xl">☁️</div>
    </div>
  );

  // 3. 增强版浪漫花瓣
  const Petals = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(35)].map((_, i) => (
        <div key={i} className="romantic-petal-leaf" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${8 + Math.random() * 10}s`,
          opacity: 0.4 + Math.random() * 0.4,
          transform: `scale(${0.8 + Math.random() * 1.2})`, 
        }}></div>
      ))}
    </div>
  );

  const startMusic = () => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
      else { startMusic(); }
    }
  };

  const playSfx = (ref: React.RefObject<HTMLAudioElement | null>) => {
    if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
  };

  // 4. 清洗 AI 返回的多余列表和序号
  const parseMarkdown = (text: string) => {
    if (!text || typeof text !== 'string') return '';
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+[\.\s、]/)) // 过滤 "1. " 或 "1 " 开头的干扰行
      .map(line => {
        if (line.startsWith('>')) return `<blockquote class="romantic-bubble">${line.substring(1).trim()}</blockquote>`;
        return `<p class="mb-4 leading-relaxed text-[#5d4a3b] text-lg font-medium">${line}</p>`;
      }).join('');
  };

  const startAdventure = async (initialChoice: string = INITIAL_PROMPT) => {
    playSfx(clickSfx);
    startMusic();
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scene = await generateNextScene(initialChoice, "虎虎北的奇幻之旅始发站") as ExtendedGameScene;
      const imageUrl = await generateSceneImage(scene.imagePrompt);
      playSfx(successSfx);
      setState(prev => ({
        ...prev,
        currentScene: scene,
        currentImageUrl: imageUrl,
        currentMapIndex: 1,
        loveScore: 52,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "猫巴士在云层中迷路了，再试一次好吗？", isLoading: false }));
    }
  };

  const handleOptionSelect = async (option: GameOption) => {
    if (state.isLoading || !option) return;
    playSfx(clickSfx);
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
        currentMapIndex: Math.min(6, prev.currentMapIndex + 1),
        loveScore: Math.min(100, prev.loveScore + 4),
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "时空连接稍有不稳，再试一次？", isLoading: false }));
    }
  };

  // 首页：虎虎北的奇幻之旅
  if (!state.currentScene && !state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffe4e6] via-[#fff5f6] to-[#f7f2e8] p-4 text-center relative overflow-hidden">
        <Petals />
        <ACBackground />
        <div className="max-w-[700px] w-full bg-white/95 backdrop-blur-2xl rounded-[50px] shadow-[0_20px_0_#fecdd3] p-12 md:p-16 border-[8px] border-white relative z-10 animate-fade-in">
          <div className="absolute -top-12 left-12 w-28 h-28 bg-[#ff8d94] rounded-[35px] flex items-center justify-center shadow-2xl rotate-[-8deg] border-4 border-white animate-float">
             <i className="fa-solid fa-cat text-white text-5xl"></i>
          </div>
          <div className="mb-10">
            <h1 className="special-font text-5xl text-[#d14d56] mb-3 drop-shadow-sm tracking-tight">虎虎北的奇幻之旅</h1>
            <div className="h-1.5 w-32 bg-pink-100 mx-auto rounded-full"></div>
          </div>
          <div className="relative mb-12 bg-[#fff5f7] rounded-[40px] border-2 border-dashed border-pink-200 p-10 shadow-inner">
            <p className="text-[#8b7355] leading-relaxed font-black italic text-xl md:text-2xl">
              “老婆北，我是你的猫巴士。<br/>
              在这属于我们的浪漫旅程中，<br/>
              你想去哪里书写第一个篇章？”
            </p>
          </div>
          <button onClick={() => startAdventure()} className="group w-full bg-gradient-to-r from-[#ff8d94] to-[#fb7185] hover:to-[#f43f5e] text-white font-black py-6 rounded-[35px] transition-all transform hover:scale-105 shadow-[0_10px_0_#be123c] active:translate-y-2 active:shadow-none text-2xl flex items-center justify-center gap-4">
            <i className="fa-solid fa-heart-circle-bolt text-3xl group-hover:scale-110"></i>
            <span>开启奇幻之旅</span>
          </button>
          <div className="mt-10 uppercase tracking-[0.3em] font-black text-[10px] text-pink-300 opacity-60">
            Stereoscopic Soulmate Adventure · 2026 Edition
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] flex flex-col font-sans text-[#5d4a3b] relative">
      <Petals />
      
      {/* 右上角播放控制 */}
      <div className="fixed top-6 right-6 z-[100]">
         <button onClick={toggleMusic} className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-2xl transition-all hover:scale-110 ${musicPlaying ? 'bg-[#7ed321] text-white rotate-12' : 'bg-white text-[#fb7185]'}`}>
            <i className={`fa-solid ${musicPlaying ? 'fa-music' : 'fa-play ml-1'} text-xl`}></i>
         </button>
      </div>

      <header className="bg-white/95 sticky top-0 z-50 p-5 border-b-[8px] border-[#eee8d5] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-[#ff8d94] rounded-[18px] flex items-center justify-center text-white rotate-[-4deg] border-2 border-white shadow-lg">
            <i className="fa-solid fa-heart text-xl"></i>
          </div>
          <div>
            <span className="font-black text-[#d14d56] block text-sm tracking-widest uppercase">虎虎北的奇幻之旅</span>
            <span className="text-[#fb7185] font-black text-xs">心动契合度：{state.loveScore}%</span>
          </div>
        </div>
        
        {/* 返回主页按钮 */}
        <button onClick={() => window.location.reload()} className="bg-[#eee8d5] hover:bg-[#ffda79] text-[#8b7355] px-4 py-2 rounded-xl flex items-center gap-2 border-2 border-white shadow-sm transition-all font-black text-sm">
          <i className="fa-solid fa-house"></i>
          <span>返回主页</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center relative z-10" ref={scrollRef}>
        <div className="max-w-[950px] w-full pb-24 mt-4">
          
          <AdventureMap currentIndex={state.currentMapIndex} />

          {state.isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 animate-pulse">
              <div className="w-24 h-24 bg-white rounded-[35px] border-4 border-[#ff8d94] flex items-center justify-center shadow-xl mb-6">
                <i className="fa-solid fa-wand-magic-sparkles text-[#ff8d94] text-4xl"></i>
              </div>
              <p className="text-[#d14d56] font-black italic text-2xl tracking-widest text-center">正在为北北构筑梦境...</p>
            </div>
          ) : (
            <>
              {/* 图片展示区 */}
              <div className="relative rounded-[45px] overflow-hidden ac-card border-[10px] border-white shadow-[0_15px_0_#dcd1bd] mb-10">
                {state.currentImageUrl ? (
                  <img src={state.currentImageUrl} alt="Scene" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-[#eee8d5] flex items-center justify-center">
                    <i className="fa-solid fa-image text-white text-7xl opacity-20"></i>
                  </div>
                )}
                <div className="absolute top-6 left-6">
                  <span className="bg-[#ffda79] text-[#8b7355] px-6 py-2 rounded-full text-sm font-black shadow-lg border-2 border-white">
                    📍 {state.currentScene?.location}
                  </span>
                </div>
              </div>

              {/* 台词对话区 */}
              <div className="bg-white rounded-[45px] p-10 md:p-14 border-[10px] border-[#eee8d5] ac-card relative mb-12 shadow-[0_15px_0_#dcd1bd]">
                <div className="absolute -top-6 -right-6 w-14 h-14 bg-[#7ed321] rounded-2xl flex items-center justify-center shadow-lg rotate-12 border-4 border-white">
                  <i className="fa-solid fa-camera-retro text-white text-2xl"></i>
                </div>
                <div className="story-container text-[#5d4a3b]" dangerouslySetInnerHTML={{ __html: parseMarkdown(state.currentScene?.story || '') }} />
                
                {state.currentScene?.heartMessage && (
                  <div className="mt-8 bg-[#fff5f7] p-8 rounded-[35px] border-2 border-dashed border-[#fb7185] text-[#e11d48] font-black flex flex-col items-center gap-4 shadow-inner">
                    <i className="fa-solid fa-heart text-pink-400 text-2xl animate-pulse"></i>
                    <p className="italic text-xl text-center font-serif leading-relaxed px-4">“{state.currentScene.heartMessage}”</p>
                  </div>
                )}
              </div>

              {/* 选项区 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {state.currentScene?.options?.map((option) => (
                  <button key={option.id} onClick={() => handleOptionSelect(option)} className="group bg-white hover:bg-[#fffdf5] border-[4px] border-[#eee8d5] hover:border-[#fb7185] p-6 rounded-[30px] text-left transition-all flex items-center gap-4 option-btn transform hover:-translate-y-2 shadow-[0_8px_0_#dcd1bd] active:translate-y-0">
                    <span className="w-12 h-12 bg-[#f7f2e8] rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2 border-white group-hover:bg-pink-50">
                      {option.text.split(' ')[0] || '✨'}
                    </span>
                    <span className="font-black text-[#5d4a3b] text-lg group-hover:text-[#d14d56] leading-tight flex-1">
                      {option.text.split(' ').slice(1).join(' ') || option.text}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* 浪漫钢琴曲源 */}
      <audio ref={audioRef} loop crossOrigin="anonymous">
        <source src="https://cdn.pixabay.com/audio/2022/11/22/audio_111451f893.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={clickSfx} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />
      <audio ref={successSfx} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" />

      <footer className="p-10 text-center bg-white border-t-[8px] border-[#eee8d5] relative z-10">
        <p className="special-font text-3xl text-[#e11d48] mb-2 drop-shadow-sm">祝 北北 2026 每一天都充满惊喜 🌱</p>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Stereoscopic Soulmate Adventure · 虎虎北出品</p>
      </footer>
    </div>
  );
};

export default App;
