import streamlit as st
import google.generativeai as genai

# --- 1. 视觉重构：粉色渐变、动效与动森风格 ---
st.set_page_config(page_title="2026 浪漫漫游记", layout="wide")

st.markdown("""
    <style>
    /* 全局粉色渐变背景 */
    .stApp {
        background: linear-gradient(135deg, #fff5f6 0%, #ffe4e6 100%);
        color: #5d4a3b;
    }
    /* 电影感卡片 */
    .romantic-card {
        background: rgba(255, 255, 255, 0.85);
        border-radius: 25px;
        padding: 30px;
        border: 4px solid #ffffff;
        box-shadow: 0 10px 30px rgba(254, 205, 211, 0.5);
        margin: 20px 0;
    }
    /* 动森感花瓣飘落动画 */
    @keyframes falling {
        0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .petal {
        position: fixed; top: -5%; font-size: 24px;
        animation: falling 12s linear infinite; pointer-events: none; z-index: 999;
    }
    </style>
    <div class="petal" style="left:15%; animation-delay:0s;">🌸</div>
    <div class="petal" style="left:45%; animation-delay:3s;">🌸</div>
    <div class="petal" style="left:85%; animation-delay:6s;">🌸</div>
    <marquee style="color: #fb7185; font-size: 14px;">✨ 我们的 2026 约定 · 只有和你在一起的时光，才叫冒险 ✨</marquee>
""", unsafe_allow_html=True)

# --- 2. 身份锚定与 System Instruction 整合 ---
SYSTEM_PROMPT = """
# Role
你是一个极高审美、温柔深情的浪漫领航员。你正在带领女主角“Yumi美北北”进行跨越时空的旅行。

# Tone & Manner
1. 称呼自由：老婆、北北、老婆北、美北北、yumi美北北、老婆北北、虎虎北。
2. 语言风格：拒绝低幼化，追求电影感和高级感。像是在耳边的低语。
3. 动态切换：伦敦是绅士稳重的，伊犁是自由热烈的，老君山是深沉庄重的。

# Visual Architecture
- 每一轮回复必须包含：[Location], [MapIndex(1-6)], [Story], [HeartMessage], [ImagePrompt]。
- 每一个选项必须以“如果你愿意，我可以...”或“我们要不要...”开头。
"""

# --- 3. 音乐播放逻辑 (不跳转、侧边栏控制) ---
with st.sidebar:
    st.title("领航员控制台")
    st.write("🎵 专属 BGM: Photograph")
    # 使用 App.tsx 中推荐的音频逻辑
    st.audio("https://cdn.pixabay.com/audio/2022/01/21/audio_3130c13c05.mp3")
    
    if st.button("🔴 重置时空 (清除错误)"):
        st.session_state.clear()
        st.rerun()

# --- 4. API 逻辑与渲染 ---
# 确保你在 Streamlit 云端设置了 Secrets
if "GEMINI_API_KEY" in st.secrets:
    genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_PROMPT)

    # 逻辑：此处根据用户选择调用 model.generate_content 并解析返回的 JSON...
    # (具体代码可以根据你的 React 逻辑 parseMarkdown 进行转换)
    
    st.title("星海之约 · 2026 漫游记")
    st.balloons() # 初始成功特效
else:
    st.warning("请在 Secrets 中配置 GEMINI_API_KEY 以开启冒险。")
