import streamlit as st
import google.generativeai as genai

# --- 1. 动森视觉风格配置 ---
st.set_page_config(page_title="2026 约定之旅", layout="wide")

# 强制注入粉色渐变和花瓣飘落效果
st.markdown("""
    <style>
    .stApp { background: linear-gradient(135deg, #fff5f6 0%, #ffe4e6 100%); }
    .story-card { background: white; border-radius: 20px; padding: 25px; border: 3px solid #ffcad4; color: #5d4a3b; }
    </style>
    <marquee style="color: #ff8d94; font-weight: bold;">🌸 正在为老婆北加载时空碎片... 🌸</marquee>
""", unsafe_allow_html=True)

# --- 2. 侧边栏：音乐与重置 (解决乱改问题的关键) ---
with st.sidebar:
    st.title("领航员控制台")
    # 这里放音乐，Streamlit 网页打开后，点一下播放就能一直播
    st.write("🎵 专属 BGM: Photograph")
    st.audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3")
    
    if st.button("🔴 重置旅程 (清除所有错误)"):
        st.session_state.clear()
        st.rerun()

# --- 3. 核心逻辑 ---
# 从 Secrets 读取 API Key (保护隐私)
if "GEMINI_API_KEY" in st.secrets:
    genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
else:
    st.error("请在 Streamlit 后台设置 API Key")

st.title("🍓 Yumi美北北的 2026 秘密旅行")
st.write("---")
st.info("老婆北，点击左侧播放器开启音乐，我们要出发了。")

# 剩下的剧情显示逻辑... (先确保能跑起来)
st.balloons() # 撒花特效
