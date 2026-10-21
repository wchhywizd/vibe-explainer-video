# vibe-explainer-video

抖音「vibe 知识大赏」风格的知识科普视频制作技能包 —— 一套让 AI Agent 从选题走到成片 MP4 的完整工作流，附 4 条样片。

- **成片规格**：1920×1080 · 30fps · 168 拍 = 134.4 秒（75 BPM，1 拍 = 0.8 秒）· 无旁白 · 中英双语字幕
- **技术栈**：Canvas 2D 逐帧绘制 + Playwright 截图 + ffmpeg 编码，没有剪辑软件、没有模板文件，全部是代码
- **产出**：成片视频 + 封面 + 发布文案，每期两版音轨（配乐版 / 只音效版）

## 目录结构

```
.
├── skill/vibe-explainer-video/     # 技能本体（可直接丢进 Agent 的 skills 目录）
│   ├── SKILL.md                    # 全流程说明：168 拍时间表、每段怎么写、验收标准
│   ├── kit/                        # 工具包
│   │   ├── lib.js                  # 公共渲染库（背景/扫光/颗粒/字幕/各类卡片）
│   │   ├── render_frames.py/.sh    # Playwright 逐帧渲染，可断点续渲
│   │   ├── sheet.py                # 按时间点出联系表，同时报 JS 错误
│   │   ├── synth.py                # 75 BPM 合成配乐（备用音轨）
│   │   ├── vibe_audio.py           # 音轨合成：BGM + 公共音效 + 本期专属音效
│   │   ├── bgm-default.mp3         # 默认音乐床
│   │   └── encode.sh               # 两遍响度归一 + H.264 + 封面
│   ├── docs/                       # ep07–ep10 分镜与文案格式
│   └── examples/                   # ep07–ep10 可运行源文件
└── samples/                        # 4 条样片 + 源码 + 联系表
```

## 安装

```bash
git clone https://github.com/wchhywizd/vibe-explainer-video.git
cp -r vibe-explainer-video/skill/vibe-explainer-video ~/.workbuddy/skills/
# 或：~/.claude/skills/
```

装好后对 Agent 说「按 vibe 大赏风格做一期讲 XX 的」，技能会被触发。

## 依赖

```
python 3.11+ · playwright（Chromium）· numpy · scipy · ffmpeg
```

```bash
pip install numpy scipy playwright && playwright install chromium
```

## 快速开始（渲一条样片）

```bash
cd samples/src
# 1. 出联系表，先看静态帧有没有版式问题
python ../../skill/vibe-explainer-video/kit/sheet.py "[0.1,2.0,4.6,6.6,8.9]" sheet.png 5 pilotC-birthday.html

# 2. 逐帧渲染（2 路并行，中断可续）
PYTHON=python bash ../../skill/vibe-explainer-video/kit/render.sh pilotC-birthday.html frames/

# 3. 合成音轨 + 编码
python ../../skill/vibe-explainer-video/kit/vibe_audio.py events.py audio.wav
bash ../../skill/vibe-explainer-video/kit/encode.sh frames/ audio.wav out.mp4
```

## 样片

| 文件 | 题材 | 时长 | 核心结论 | 可视化支点 |
|---|---|---|---|---|
| `试片A-看不见的学会.mp4` | 认知 | 14.4s | 读得越顺，越容易高估自己学会了多少（流畅性错觉） | 同内容两份排版 + 自评/实测四柱反差 |
| `试片B-一百五十.mp4` | 关系 | 14.4s | 稳定社交上限约 150 人（邓巴数） | 四层同心圆，圈上按人数排点 |
| `试片C-同一天生日.mp4` | 概率 | 14.4s | 23 人同生日概率 50.7% | 23 人点阵，撞日连线 |
| `试片C-v2-同一天生日.mp4` | 概率 | 15.2s | 41 人 90.3%；只要 23 人就过半 | 41 人头像 + 5%/90% 二选一 + 2 秒倒计时 |

v2 是对 v1 开场的重构：从「直接报结论」改成「先让你下注」——41 个头像铺满右侧，抛 5% / 90% 二选一，**留 2 秒倒计时条让观众用手指选**，再翻答案。两条可以对比着看，能看出互动式钩子和陈述式钩子的差别。

数值均可复核：41 人 90.32%（820 对）· 23 人 50.73%（253 对）· 41/365 = 11.2%。

## 两个容易踩的坑

1. **时间单位不统一**：`lib.js` 里 `scene()`、`titleCard()` 的起止，以及 `SUBS` / `TOPLABELS` / `NOTES` 数组，**单位都是「拍」**（`B(n) = n × 0.8s`）；只有自己写的 `seg()` / `txtIn()` 用秒。按秒写会得到「开场在 8.1 秒被切断」「字幕整体错位」这类灵异现象。
2. **音频不像视频那样能逐帧校对**：`vibe_audio.py` 默认音乐床约 113 BPM，拍网格是 75 BPM，音效用的是重音/转场类、不卡音乐拍。要做「音效严格卡鼓点」的期，用 `NO_BGM=1` 回合成配乐。

## 版权与免责

- **BGM**：`kit/bgm-default.mp3` 是《千年之后(氛围版)》，音源来自 B 站他人上传的视频，**版权不在本仓库作者手里**。仓库里保留它是为了样片可复现；商用或公开发布前请自行取得授权，或替换成你有权使用的曲子（`BGM_FILE=path`）。
- **样片数据**：A 片柱高是示意值不是真实实验数据；B 片的 150 有争议，不同人群差异大，不要讲成硬定律；C 片 41 人 90.3% 与 23 人 50.7% 是 365 天均匀分布下的精确值。
- **5% / 90% 是刻意的二选一**：真实直觉区间在 5%–12%，给 5% 是为了让 90% 显得离谱、制造下注欲。片中只说「答案是 90.3%」，不说「正确答案是 90%」——数字精确，框选是剪辑手段。
- 所有事实类内容在 `SKILL.md` 里都要求先核验再上片，查不到就不放，不编数字、不编文献原话。

## License

代码部分（`kit/`、`samples/src/`）MIT。文档与文案 CC BY 4.0。音频见上方版权说明，不在授权范围内。
