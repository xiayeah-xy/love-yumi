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

  // 1. 地图图标放大，地点文字完整显示
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
      <div className="bg-white/90 backdrop-blur-md rounded-[25px] px-6 py-4 flex items-center shadow-[0_8px_0_#dcd1bd] border-4 border-white mb-6 w-full animate-fade-in overflow-x-auto">
        <div className="flex-1 flex items-center justify-between relative px-4 min-w-[500px]">
          <div className="absolute h-1 bg-[#f1ede4] left-8 right-8 top-1/2 -translate-y-1/2 z-0 rounded-full"></div>
          {steps.map((step, index) => {
            const pos = index + 1;
            const isCurrent = pos === currentIndex;
            const isPassed = pos < currentIndex;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center">
                {/* 放大图标 w-14 h-14 */}
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl shadow-lg transition-all duration-700 border-2 border-white ${isCurrent ? 'bg-[#ff8d94] scale-110 -translate-y-1 ring-4 ring-pink-100 rotate-3' : isPassed ? 'bg-[#7ed321]' : 'bg-white text-gray-200'}`}>
                  {isCurrent ? step.icon : isPassed ? '✓' : step.icon}
                </div>
                {/* 完整文字显示 */}
                <span className={`absolute -bottom-6 whitespace-nowrap text-[11px] font-black transition-all ${isCurrent ? 'opacity-100 text-[#d14d56]' : 'opacity-60 text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. 更多更宽的花瓣
  const Petals = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(35)].map((_, i) => (
        <div key={i} className="romantic-petal-leaf" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${10 + Math.random() * 15}s`,
          opacity: 0.3 + Math.random() * 0.5,
          transform: `scale(${0.5 + Math.random() * 1.2})`, // 更大
        }}></div>
      ))}
    </div>
  );

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
        setMusicPlaying(false);
      } else {
        audioRef.current.play().then(() => setMusicPlaying(true)).catch(e => console.log(e));
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
    // 过滤掉 AI 可能返回的 1234 列表序号，只保留文字
    return text.split('\n').map(line => {
      let trimmed = line.trim().replace(/^\d+\.\s*/, ''); 
      if (!trimmed) return '';
      return `<p class="mb-4 leading-relaxed text-[#5d4a3b] text-base font-medium">${trimmed}</p>`;
    }).join('');
  };

  const startAdventure = async (initialChoice: string = INITIAL_PROMPT) => {
    playSfx(clickSfx);
    if (!musicPlaying) toggleMusic();
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scene = await generateNextScene(initialChoice, "奇幻旅程起点") as ExtendedGameScene;
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
      setState(prev => ({ ...prev, error: "巴士猫迷路了，再试一次？", isLoading: false }));
    }
  };

  const handleOptionSelect = async (option: GameOption) => {
    if (state.isLoading) return;
    playSfx(clickSfx);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const nextScene = await generateNextScene(option.text, state.history.map(h => h.action).join("->")) as ExtendedGameScene;
      const imageUrl = await generateSceneImage(nextScene.imagePrompt);
      playSfx(successSfx);
      setState(prev => ({
        ...prev,
        currentScene: nextScene,
        currentImageUrl: imageUrl,
        currentMapIndex: prev.currentMapIndex < 6 ? prev.currentMapIndex + 1 : 6,
        loveScore: Math.min(100, prev.loveScore + 8),
        isLoading: false,
        history: [...prev.history, { action: option.text, story: state.currentScene?.story || "" }]
      }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 首页布局修改
  if (!state.currentScene && !state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffe4e6] to-[#f7f2e8] p-4 text-center relative overflow-hidden">
        <Petals />
        <div className="max-w-[600px] w-full bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-[0_15px_0_#fecdd3] p-12 border-[6px] border-white relative z-10 animate-fade-in">
          <div className="mb-8">
            <h1 className="special-font text-5xl text-[#d14d56] mb-3">虎虎北的奇幻之旅</h1>
            <p className="font-black text-[#f43f5e] tracking-[0.4em] text-[10px] uppercase opacity-70">A Romantic 3D Anime Adventure</p>
          </div>
          <div className="mb-10 bg-[#fff5f7] rounded-[30px] p-8 border-2 border-dashed border-pink-200">
            <p className="text-[#8b7355] leading-relaxed font-black italic text-xl">
              “老婆北，我是你的巴士猫。<br/>
              奇迹已经准备就绪，<br/>
              想让我带你去哪场梦境？”
            </p>
          </div>
          <button onClick={() => startAdventure()} className="w-full bg-gradient-to-r from-[#ff8d94] to-[#fb7185] text-white font-black py-5 rounded-[30px] shadow-[0_8px_0_#be123c] active:translate-y-1.5 active:shadow-none text-xl transition-all">
            开启 2026 奇幻篇章
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] flex flex-col font-sans text-[#5d4a3b] relative">
      <Petals />
      
      {/* 右上角旋转音乐控制 */}
      <div className="fixed top-6 right-6 z-[100]">
         <button onClick={toggleMusic} className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-xl transition-all ${musicPlaying ? 'bg-[#ff8d94] text-white animate-spin-slow' : 'bg-white text-gray-400'}`}>
            <i className={`fa-solid ${musicPlaying ? 'fa-compact-disc' : 'fa-play'} text-xl`}></i>
         </button>
      </div>

      <header className="bg-white/95 sticky top-0 z-50 p-4 border-b-[6px] border-[#eee8d5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff8d94] rounded-xl flex items-center justify-center text-white border-2 border-white shadow-md">
            <i className="fa-solid fa-paw"></i>
          </div>
          <span className="font-black text-[#d14d56] text-sm">虎虎北的奇幻之旅 · 契合度 {state.loveScore}%</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10">
        <div className="max-w-[800px] w-full pb-20">
          <AdventureMap currentIndex={state.currentMapIndex} />

          {state.isLoading ? (
            <div className="py-32 text-center animate-pulse">
              <i className="fa-solid fa-wand-magic-sparkles text-[#ff8d94] text-5xl mb-4"></i>
              <p className="text-[#d14d56] font-black italic text-xl">正在描绘新的风景...</p>
            </div>
          ) : (
            <>
              {/* 图片展示区 */}
              <div className="relative rounded-[35px] overflow-hidden border-[6px] border-white shadow-[0_12px_0_#dcd1bd] mb-8 bg-[#eee8d5]">
                {state.currentImageUrl ? (
                  <img src={state.currentImageUrl} alt="Scene" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center flex-col gap-4">
                    <i className="fa-solid fa-cloud-sun text-white text-6xl opacity-40 animate-float"></i>
                    <span className="text-white/60 font-black">美景加载中...</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#ffda79] text-[#8b7355] px-5 py-2 rounded-full text-xs font-black shadow-md border-2 border-white">
                    📍 {state.currentScene?.location}
                  </span>
                </div>
              </div>

              {/* 剧情区：只显示一段精炼文字 */}
              <div className="bg-white rounded-[35px] p-8 md:p-12 border-[8px] border-[#eee8d5] mb-8 shadow-[0_12px_0_#dcd1bd] relative">
                <div className="story-container" dangerouslySetInnerHTML={{ __html: parseMarkdown(state.currentScene?.story || '') }} />
                
                {state.currentScene?.heartMessage && (
                  <div className="mt-8 bg-[#fff5f7] p-6 rounded-[25px] border-2 border-dashed border-[#fb7185] text-[#e11d48] text-center italic font-serif">
                    “{state.currentScene.heartMessage}”
                  </div>
                )}
              </div>

              {/* 选项区 */}
              <div className="flex flex-col gap-4">
                {state.currentScene?.options?.map((option) => (
                  <button key={option.id} onClick={() => handleOptionSelect(option)} className="bg-white hover:bg-[#fffdf5] border-[3px] border-[#eee8d5] hover:border-[#fb7185] p-5 rounded-[25px] transition-all transform hover:-translate-y-1 shadow-[0_6px_0_#dcd1bd] flex items-center gap-4">
                    <span className="text-2xl">{option.text.charAt(0)}</span>
                    <span className="font-black text-[#5d4a3b] text-sm">{option.text.slice(1)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* 音乐文件改为钢琴曲 */}
      <audio ref={audioRef} loop crossOrigin="anonymous">
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={clickSfx} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />
      <audio ref={successSfx} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" />

      <footer className="p-10 text-center bg-white border-t-[6px] border-[#eee8d5]">
        <p className="special-font text-3xl text-[#e11d48]">祝 Yumi美北北 2026 情人节快乐 🌱</p>
      </footer>
    </div>
  );
};

export default App;
