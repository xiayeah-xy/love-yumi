import streamlit as st
import google.generativeai as genai
import json

# --- 1. 样式彻底重写 (还原 image_4ee415.jpg 的高级感) ---
st.set_page_config(page_title="2026 约定", layout="centered")

st.markdown("""
    <style>
    /* 全局粉色渐变背景 */
    .stApp {
        background: linear-gradient(to bottom, #ffe4e6 0%, #fff5f6 50%, #f7f2e8 100%) !important;
    }
    /* 隐藏 Streamlit 默认页眉 */
    header {visibility: hidden;}
    
    /* 还原图片中的白色圆角卡片 */
    .cover-card {
        background: white;
        border-radius: 40px;
        padding: 40px 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(255, 182, 193, 0.3);
        border: 1px solid #fff1f2;
        margin-top: 100px;
    }
    
    /* 标题艺术字体样式 */
    .title-text {
        color: #d14d56;
        font-size: 42px;
        font-family: "Microsoft YaHei", sans-serif;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    /* 副标题样式 */
    .subtitle-text {
        color: #fb7185;
        letter-spacing: 0.3em;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 30px;
    }

    /* 虚线对话框 */
    .quote-box {
        background: #fff5f7;
        border: 2px dashed #fbcfe8;
        border-radius: 30px;
        padding: 25px;
        margin: 20px auto;
        width: 85%;
        color: #8b7355;
        font-weight: 900;
        font-size: 18px;
        line-height: 1.6;
    }

    /* 精致的粉色按钮 (彻底解决按钮过长和丑陋问题) */
    div.stButton > button {
        background: #f43f5e !important;
        color: white !important;
        border-radius: 25px !important;
        border: none !important;
        padding: 15px 40px !important;
        font-size: 18px !important;
        font-weight: bold !important;
        width: 85% !important;
        margin: 0 auto !important;
        display: block !important;
        box-shadow: 0 6px 0 #be123c !important;
        transition: all 0.2s;
    }
    div.stButton > button:hover {
        background: #e11d48 !important;
        transform: translateY(2px);
        box-shadow: 0 4px 0 #be123c !important;
    }
    </style>
""", unsafe_allow_html=True)

# --- 2. 核心交互逻辑 ---
if "step" not in st.session_state:
    st.session_state.step = "home"

if st.session_state.step == "home":
    # 纯 HTML/CSS 构造的封面 (像素级还原)
    st.markdown(f"""
        <div class="cover-card">
            <div class="title-text">虎虎北的奇约之旅</div>
            <div class="subtitle-text">YUMI'S MAGIC CAT BUS ADVENTURE</div>
            <div class="quote-box">
                “Yumi，我是你的猫巴士。<br>
                奇迹已经准备就绪，<br>
                想让我也带你去哪场梦境？”
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    # 放置按钮
    if st.button("🐈 开启 2026 约定之旅"):
        st.session_state.step = "adventure"
        st.rerun()

elif st.session_state.step == "adventure":
    # 这里开始连接 Gemini 生成第一站
    st.title("📍 冒险开始")
    # 模拟 AdventureMap 进度条逻辑...
    if st.button("⬅️ 重置时空"):
        st.session_state.step = "home"
        st.rerun()
