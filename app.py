import streamlit as st
import google.generativeai as genai

# --- 1. 像素级还原 App.tsx 视觉配置 ---
st.set_page_config(page_title="2026 约定", layout="wide")

st.markdown("""
    <style>
    /* 还原 App.tsx 中的 bg-gradient-to-b 和色彩 */
    .stApp {
        background: linear-gradient(to bottom, #ffe4e6 0%, #fff5f6 50%, #f7f2e8 100%);
        font-family: 'Segoe UI', system-ui, sans-serif;
    }
    /* 还原 App.tsx 的粉色发光卡片样式 */
    .main-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 40px;
        border: 6px solid #ffffff;
        box-shadow: 0 15px 0 #fecdd3;
        padding: 3rem;
        max-width: 650px;
        margin: auto;
        text-align: center;
        position: relative;
    }
    /* 还原那个飘浮的巴士图标 */
    .bus-icon {
        position: absolute; top: -32px; left: 32px;
        width: 80px; height: 80px; background: #ff8d94;
        border-radius: 25px; border: 4px solid white;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        font-size: 30px; animation: float 3s ease-in-out infinite;
    }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-10px) rotate(-8deg); } }
    /* 还原花瓣动画 */
    .petal { position: fixed; background: #ffb6c1; border-radius: 150% 0 150% 0; opacity: 0.3; pointer-events: none; z-index: 0; animation: fall 10s linear infinite; }
    @keyframes fall { 0% { top:-10%; transform:translateX(0) rotate(0); } 100% { top:110%; transform:translateX(100px) rotate(360deg); } }
    </style>
    <div class="petal" style="left:10%; width:15px; height:20px; animation-delay:0s;"></div>
    <div class="petal" style="left:50%; width:10px; height:15px; animation-delay:2s;"></div>
    <div class="petal" style="left:80%; width:12px; height:18px; animation-delay:5s;"></div>
""", unsafe_allow_html=True)

# --- 2. 侧边栏：音乐控制与 Secrets ---
with st.sidebar:
    st.title("领航员控制台")
    # 填入你在 App.tsx 中使用的 Pixabay 音频
    st.write("🎵 Photograph - Cody Fry")
    st.audio("https://cdn.pixabay.com/audio/2022/01/21/audio_3130c13c05.mp3")
    if st.button("🔴 重置时空 (回到起点)"):
        st.session_state.clear()
        st.rerun()

# --- 3. 核心逻辑对接 ---
if "GEMINI_API_KEY" in st.secrets:
    genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
    
    # 初始化状态
    if "scene" not in st.session_state:
        # 显示封面预览 (匹配 image_4ee415.jpg)
        st.markdown(f'''
            <div class="main-card">
                <div class="bus-icon">🚌</div>
                <h1 style="color:#d14d56; font-family:serif; font-size:40px;">虎虎北的奇约之旅</h1>
                <p style="color:#f43f5e; letter-spacing:0.4em; font-size:10px; font-weight:900;">PHOTOGRAPH · CODY FRY SPECIAL</p>
                <div style="background:#fff5f7; border:2px dashed #fbcfe8; border-radius:35px; padding:30px; margin:30px 0;">
                    <p style="color:#8b7355; font-size:20px; font-weight:900; line-height:1.6;">
                    “Yumi，我是你的猫巴士。<br>奇迹已经准备就绪，<br>想让我带你去哪场梦境？”</p>
                </div>
            </div>
        ''', unsafe_allow_html=True)
        
        if st.button("💗 开启 2026 约定之旅", use_container_width=True):
            st.session_state.scene = "loading"
            st.rerun()
else:
    st.warning("⚠️ 请在 Secrets 处填写 GEMINI_API_KEY")
