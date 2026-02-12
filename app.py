import streamlit as st
import google.generativeai as genai
import json

# --- 1. 视觉加固：限制按钮宽度与卡片比例 ---
st.markdown("""
    <style>
    /* 修复按钮太长的问题：限制最大宽度并居中 */
    .stButton > button {
        width: 320px !important;
        margin: 0 auto;
        display: block;
        background: linear-gradient(to r, #ff8d94, #fb7185) !important;
        border-radius: 30px !important;
        border: none !important;
        color: white !important;
        height: 60px !important;
        font-weight: 900 !important;
        box-shadow: 0 8px 0 #be123c !important;
        transition: all 0.2s !important;
    }
    .stButton > button:active {
        transform: translateY(4px) !important;
        box-shadow: none !important;
    }
    /* 保持 App.tsx 的粉色卡片感 */
    .main-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 40px;
        border: 6px solid #ffffff;
        box-shadow: 0 15px 0 #fecdd3;
        padding: 40px;
        text-align: center;
    }
    </style>
""", unsafe_allow_html=True)

# --- 2. 核心逻辑：连接 Gemini 生成剧情 ---
def get_ai_response(prompt):
    if "GEMINI_API_KEY" not in st.secrets:
        return None
    
    genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
    # 注入你在 App.tsx 中定义的初始指令逻辑
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    full_prompt = f"你现在是我的猫巴士。基于以下输入生成动森风格的 JSON 剧情：{prompt}"
    response = model.generate_content(full_prompt)
    try:
        # 强制 AI 返回符合你 types.ts 定义的结构
        return json.loads(response.text.strip().replace('```json', '').replace('```', ''))
    except:
        return {"location": "云端迷路了", "story": "> 虎虎北，时空连接稍有不稳，再点一次？", "mapIndex": 1}

# --- 3. 页面渲染 ---
if "current_scene" not in st.session_state:
    # 封面页 (还原 image_4ee415.jpg)
    st.markdown('<div class="main-card">', unsafe_allow_html=True)
    st.image("https://path_to_your_cover_image.jpg") # 建议换成你截图里的那张封面图
    st.markdown(f'''
        <h1 style="color:#d14d56; font-family:serif;">虎虎北的奇约之旅</h1>
        <div style="background:#fff5f7; border:2px dashed #fbcfe8; border-radius:35px; padding:20px; margin:20px 0;">
            <p style="color:#8b7355; font-size:18px; font-weight:900;">
            “Yumi，我是你的猫巴士。<br>你想去哪里书写我们的第一个篇章？”</p>
        </div>
    ''', unsafe_allow_html=True)
    
    # 解决按钮点击无反应：使用 callback 更新状态
    if st.button("🚀 踏入 2026 的约定"):
        with st.spinner("正在勾勒 2026 的风景..."):
            first_scene = get_ai_response("开启冒险：第一站")
            st.session_state.current_scene = first_scene
            st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

else:
    # 剧情页 (还原 App.tsx 的 AdventureMap 进度条)
    scene = st.session_state.current_scene
    st.write(f"📍 当前位置：{scene['location']}")
    st.markdown(scene['story'], unsafe_allow_html=True)
    
    if st.button("⬅️ 返回主页"):
        del st.session_state.current_scene
        st.rerun()
