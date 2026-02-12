import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameScene, GameOption } from './types';
import { generateNextScene, generateSceneImage } from './services/geminiService';
import { INITIAL_PROMPT } from './constants';

// --- 💡 建议：在这里放你提前准备好的精美图片链接 ---
const PRESET_IMAGES: Record<string, string> = {
  '起点': 'https://your-image-url.com/start.jpg',
  '猫咪王国': 'https://your-image-url.com/cat-kingdom.jpg',
  '伦敦': 'https://your-image-url.com/london.jpg',
  '老君山': 'https://your-image-url.com/mountain.jpg',
  '伊犁': 'https://your-image-url.com/ili.jpg',
  '终点': 'https://your-image-url.com/end.jpg',
};

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const clickSfx = useRef<HTMLAudioElement>(null);
  const successSfx = useRef<HTMLAudioElement>(null);

  const steps = [
    { icon: '📍', label: '起点' },
    { icon: '🐱', label: '猫咪王国' },
    { icon: '🎡', label: '伦敦' },
    { icon: '🏔️', label: '老君山' },
    { icon: '🐎', label: '伊犁' },
    { icon: '🎁', label: '终点' },
  ];

  // 1. 冒险地图：图标变大，文字完整显示
  const AdventureMap = ({ currentIndex }: { currentIndex: number }) => (
    <div className="bg-white/90 backdrop-blur-md rounded-[35px] px-8 py-6 flex flex-col items-center shadow-[0_10px_0_#dcd1bd] border-4 border-white mb-8 w-full animate-fade-in">
      <div className="w-full flex justify-between items-center relative px-2">
        <div className="absolute h-1.5 bg-[#f1ede4] left-10 right-10 top-8 z-0 rounded-full"></div>
        {steps.map((step, index) => {
          const pos = index + 1;
          const isCurrent = pos === currentIndex;
          const isPassed = pos < currentIndex;
          return (
            <div key={index} className="relative z-10 flex flex-col items-center min-w-[60px]">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[22px] flex items-center justify-center text-3xl shadow-xl transition-all duration-700 border-4 border-white ${isCurrent ? 'bg-[#ff8d94] scale-125 -translate-y-2 ring-8 ring-pink-100 rotate-3' : isPassed ? 'bg-[#7ed321]' : 'bg-white text-gray-200'}`}>
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

  const Petals = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div key={i} className="romantic-petal-leaf" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${10 + Math.random() * 10}s`,
        }}></div>
      ))}
    </div>
  );

  // 激活音频的函数
  const handleStartMusic = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch(err => console.log("等待用户交互以播放音乐", err));
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
        setMusicPlaying(false);
      } else {
        audioRef.current.play();
        setMusicPlaying(true);
      }
    }
  };

  const parseMarkdown = (text: string) => {
    if (!text) return '';
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+[\.\s、]/))
      .map(line => line.startsWith('>') ? `<blockquote class="romantic-bubble">${line.substring(1).trim()}</blockquote>` : `<p class="mb-4 leading-relaxed text-[#5d4a3b] text-lg font-medium">${line}</p>`)
      .join('');
  };

  const startAdventure = async () => {
    if (clickSfx.current) clickSfx.current.play();
    handleStartMusic(); // 核心：在这里激活音频
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scene = await generateNextScene(INITIAL_PROMPT, "始发站") as ExtendedGameScene;
      
      // 逻辑：优先查找预设图片，没有再用 AI 生成
      const locationLabel = steps[0].label;
      const imageUrl = PRESET_IMAGES[locationLabel] || await generateSceneImage(scene.imagePrompt);
      
      if (successSfx.current) successSfx.current.play();
      setState(prev => ({
        ...prev,
        currentScene: scene,
        currentImageUrl: imageUrl,
        currentMapIndex: 1,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "连接超时，请再点一次试试？", isLoading: false }));
    }
  };

  const handleOptionSelect = async (option: GameOption) => {
    if (state.isLoading) return;
    if (clickSfx.current) clickSfx.current.play();

    const nextIdx = Math.min(6, state.currentMapIndex + 1);
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const nextScene = await generateNextScene(option.text, state.history.map(h => h.action).join("->")) as ExtendedGameScene;
      
      // 匹配当前地点的图片
      const locationLabel = steps[nextIdx - 1].label;
      const imageUrl = PRESET_IMAGES[locationLabel] || await generateSceneImage(nextScene.imagePrompt);

      if (successSfx.current) successSfx.current.play();
      setState(prev => ({
        ...prev,
        currentScene: nextScene,
        currentImageUrl: imageUrl,
        currentMapIndex: nextIdx,
        loveScore: Math.min(100, prev.loveScore + 4),
        isLoading: false,
        history: [...prev.history, { action: option.text, story: prev.currentScene?.story || "" }]
      }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- 首页界面 ---
  if (!state.currentScene && !state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff5f6] relative overflow-hidden">
        <Petals />
        <div className="max-w-[600px] w-full bg-white/95 backdrop-blur-2xl rounded-[50px] shadow-[0_20px_0_#fecdd3] p-12 border-[8px] border-white relative z-10 animate-fade-in text-center mx-4">
          <div className="w-24 h-24 bg-[#ff8d94] rounded-[30px] flex items-center justify-center shadow-xl mb-8 mx-auto rotate-[-8deg] border-4 border-white">
             <i className="fa-solid fa-cat text-white text-5xl"></i>
          </div>
          <h1 className="special-font text-5xl text-[#d14d56] mb-6">虎虎北的奇幻之旅</h1>
          <p className="text-[#8b7355] text-xl font-black italic mb-10 leading-relaxed">
            “Yumi美北北，我是你的猫巴士。<br/>你想去哪里开启第一个篇章？”
          </p>
          <button onClick={startAdventure} className="w-full bg-gradient-to-r from-[#ff8d94] to-[#fb7185] text-white font-black py-6 rounded-[35px] transition-all transform hover:scale-105 shadow-[0_10px_0_#be123c] active:translate-y-2 active:shadow-none text-2xl">
            开启奇幻之旅
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] flex flex-col font-sans relative">
      <Petals />
      
      {/* 🚀 按钮隔离区：左主页，右音乐 */}
      <div className="fixed top-6 left-6 z-[100]">
        <button onClick={() => window.location.reload()} className="bg-white/90 hover:bg-[#ffda79] text-[#8b7355] px-5 py-3 rounded-2xl flex items-center gap-2 border-4 border-white shadow-xl transition-all font-black text-sm">
          <i className="fa-solid fa-house"></i>
          <span>返回主页</span>
        </button>
      </div>

      <div className="fixed top-6 right-6 z-[100]">
         <button onClick={toggleMusic} className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-xl transition-all ${musicPlaying ? 'bg-[#7ed321] text-white animate-spin-slow' : 'bg-white text-[#fb7185]'}`}>
            <i className={`fa-solid ${musicPlaying ? 'fa-music' : 'fa-play ml-1'} text-xl`}></i>
         </button>
      </div>

      <main className="flex-1 p-4 flex flex-col items-center z-10 pt-24">
        <div className="max-w-[900px] w-full pb-20">
          <AdventureMap currentIndex={state.currentMapIndex} />

          {state.isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 animate-pulse">
              <div className="w-20 h-20 bg-white rounded-3xl border-4 border-[#ff8d94] flex items-center justify-center shadow-xl mb-6">
                <i className="fa-solid fa-wand-magic-sparkles text-[#ff8d94] text-3xl"></i>
              </div>
              <p className="text-[#d14d56] font-black italic text-2xl">正在为北北构筑梦境...</p>
            </div>
          ) : (
            <>
              {/* 图片区 */}
              <div className="relative rounded-[45px] overflow-hidden border-[10px] border-white shadow-[0_15px_0_#dcd1bd] mb-10 bg-[#eee8d5]">
                <img 
                  src={state.currentImageUrl || 'https://via.placeholder.com/800x450?text=Wait+for+Magic...'} 
                  alt="Scene" 
                  className="w-full aspect-video object-cover transition-opacity duration-1000" 
                />
                <div className="absolute top-6 left-6">
                  <span className="bg-[#ffda79] text-[#8b7355] px-6 py-2 rounded-full text-sm font-black shadow-lg border-2 border-white">
                    📍 {state.currentScene?.location}
                  </span>
                </div>
              </div>

              {/* 台词区 */}
              <div className="bg-white rounded-[45px] p-10 md:p-14 border-[10px] border-[#eee8d5] relative mb-12 shadow-[0_15px_0_#dcd1bd]">
                <div className="story-container" dangerouslySetInnerHTML={{ __html: parseMarkdown(state.currentScene?.story || '') }} />
                {state.currentScene?.heartMessage && (
                  <div className="mt-8 bg-[#fff5f7] p-8 rounded-[35px] border-2 border-dashed border-[#fb7185] text-[#e11d48] font-black text-center italic text-xl">
                    “{state.currentScene.heartMessage}”
                  </div>
                )}
              </div>

              {/* 选项区 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.currentScene?.options?.map((option) => (
                  <button key={option.id} onClick={() => handleOptionSelect(option)} className="bg-white hover:bg-[#fffdf5] border-[4px] border-[#eee8d5] hover:border-[#fb7185] p-6 rounded-[30px] text-left transition-all transform hover:-translate-y-2 shadow-[0_8px_0_#dcd1bd] flex items-center gap-4 active:translate-y-0 active:shadow-none">
                    <span className="text-2xl shrink-0">{option.text.split(' ')[0] || '✨'}</span>
                    <span className="font-black text-[#5d4a3b] text-lg">{option.text.split(' ').slice(1).join(' ') || option.text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* 音频资源 */}
      <audio ref={audioRef} loop crossOrigin="anonymous">
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={clickSfx} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />
      <audio ref={successSfx} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" />
    </div>
  );
};

export default App;
