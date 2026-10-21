# vibe-knowledge-interactive

你一定刷到过这种视频：黑底、没有人说话、中英双语字幕一行行往上走，最后停在一句能截图的话上。抖音上叫「Vibe 知识大赏」，看完确实有收获。

这个仓库是一个 **Agent Skill**，把这类视频从选题做到成片 MP4 —— 全程代码，不打开任何剪辑软件。

下面这条 8 秒，是它做出来的开头。**注意看 0.8 秒：它没有报结论，而是先让你下注。**

![生日悖论 · 互动式开场](assets/hook-birthday.gif)

41 个头像铺满右侧 → 抛出「5% 还是 90%」二选一 → **停 2 秒倒计时，让你用手指选** → 翻答案、红线穿人群。下注之后，正确答案才有冲击力。

换一个题材，是另一种视觉骨架——四层同心圆，圈上按真实人数排点：

![邓巴数 · 同心圆](assets/hook-dunbar.gif)

## 它跟别的「vibe 知识大赏 skill」差在哪

GitHub 上同题材仓库已经二十来个，大多在比谁的动效更花。这个仓库的差别是**选题有数据支撑，不是拍脑袋**：

- 抓了 **100 条真实爆款样本**（总播放 1220 万），带播放量、点赞、分类、可点击原片链接 → [`data/top100.csv`](data/top100.csv)
- 按题材统计**单条效率**，得出一个反直觉结论：条数最多的题材往往不跑量。认知心理 11 条、单条均值 11.4 万；社会经济 8 条、单条均值只有 1.4 万
- 由此得出 6 条被数据验证的选题策略 + **25 个避开已爆题目的新选题**（每个带钩子、结论、可视化支点）→ [`docs/选题策略与25个选题.md`](docs/选题策略与25个选题.md)

采集脚本和分类口径都在，数据可以重新跑、可以质疑。别家写「深度拆解爆款」，这里给的是能被核对的表。

## 成片规格

- 1920×1080 · 30fps · 168 拍 = 134.4 秒（75 BPM，1 拍 = 0.8 秒）· 无旁白 · 中英双语字幕
- Canvas 2D 逐帧绘制 + Playwright 截图 + ffmpeg 编码，没有模板文件，每一帧都是代码算出来的
- 产出：成片 + 封面 + 发布文案，每期两版音轨（配乐版 / 只音效版，后者发布时叠抖音曲库）

## 目录结构

```
.
├── assets/                          # README 里那两条 GIF
├── data/top100.csv                  # 100 条爆款样本（播放/点赞/分类/链接）
├── docs/选题策略与25个选题.md         # 策略推导 + 25 个选题
├── skill/vibe-explainer-video/      # 技能本体（整目录丢进 skills/ 即可）
│   ├── SKILL.md                     # 168 拍时间表、每段怎么写、验收标准
│   ├── kit/                         # lib.js / render / sheet / synth / vibe_audio / bgm / encode
│   ├── docs/                        # ep07–ep10 分镜与文案格式
│   └── examples/                    # ep07–ep10 可运行源文件
└── samples/                         # 4 条样片 + 源码 + 联系表
```

> 仓库名是 `vibe-knowledge-interactive`，技能目录名仍是 `vibe-explainer-video`。装的时候保持目录名不变，否则 Agent 找不到技能。

## 安装

```bash
git clone https://github.com/wchhywizd/vibe-knowledge-interactive.git
cp -r vibe-knowledge-interactive/skill/vibe-explainer-video ~/.workbuddy/skills/
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
| `试片C-v2-同一天生日.mp4` | 概率 | 15.2s | 41 人 90.3%；只要 23 人就过半 | 41 人头像 + 5%/90% 二选一 + 2 秒倒计时 |
| `试片C-同一天生日.mp4` | 概率 | 14.4s | 23 人同生日概率 50.7% | 23 人点阵，撞日连线 |
| `试片B-一百五十.mp4` | 关系 | 14.4s | 稳定社交上限约 150 人（邓巴数） | 四层同心圆，圈上按人数排点 |
| `试片A-看不见的学会.mp4` | 认知 | 14.4s | 读得越顺，越容易高估自己学会了多少 | 同内容两份排版 + 自评/实测四柱反差 |

**C 的 v2 和 v1 建议对比着看**：v1 开口就报「23 人」，v2 先让你在 5% / 90% 之间下注、留 2 秒让你选、再翻答案。同一个知识点，停留时长完全不是一回事——这就是这个仓库最想让你拿走的东西。

数值均可复核：41 人 90.32%（820 对）· 23 人 50.73%（253 对）· 41/365 = 11.2%。

## 两个容易踩的坑

1. **时间单位不统一**：`lib.js` 里 `scene()`、`titleCard()` 的起止，以及 `SUBS` / `TOPLABELS` / `NOTES` 数组，**单位都是「拍」**（`B(n) = n × 0.8s`）；只有自己写的 `seg()` / `txtIn()` 用秒。按秒写会得到「开场在 8.1 秒被切断」「字幕整体错位」这类灵异现象。
2. **音频不像视频那样能逐帧校对**：`vibe_audio.py` 默认音乐床约 113 BPM，拍网格是 75 BPM，音效用的是重音/转场类、不卡音乐拍。要做「音效严格卡鼓点」的期，用 `NO_BGM=1` 回合成配乐。

## 关于样本数据的边界（请先读这段再引用）

- **样本来自 B 站，不是抖音。** 抖音搜索页与话题页均需登录态渲染，取不到全量；本仓库的 100 条是同标签 B 站公开数据（创作者普遍双平台分发）。**看结构配比可信，绝对播放量不要跨平台对标抖音。**
- **100 条是「有多少算多少」的 top 切片**，不是随机抽样，头部集中度（Top3 占 54.5%）会因此被放大。
- 分类由规则 + 人工修正得出，口径写在 `docs/` 里，有异议欢迎提 issue 改。

## 版权与免责

- **BGM**：`kit/bgm-default.mp3` 是《千年之后(氛围版)》，音源来自 B 站他人上传的视频，**版权不在本仓库作者手里**。保留它是为了样片可复现；商用或公开发布前请自行取得授权，或替换成你有权使用的曲子（`BGM_FILE=path`）。
- **样片数据**：A 片柱高是示意值不是真实实验数据；B 片的 150 有争议，不同人群差异大，不要讲成硬定律；C 片 41 人 90.3% 与 23 人 50.7% 是 365 天均匀分布下的精确值。
- **5% / 90% 是刻意的二选一**：真实直觉区间在 5%–12%，给 5% 是为了让 90% 显得离谱、制造下注欲。片中只说「答案是 90.3%」，不说「正确答案是 90%」——数字精确，框选是剪辑手段。
- 所有事实类内容在 `SKILL.md` 里都要求先核验再上片，查不到就不放，不编数字、不编文献原话。

## License

- **代码**（`kit/`、`samples/src/` 下的 .js .py .sh .html）：MIT，见 [LICENSE](LICENSE)
- **文档与文案**（`SKILL.md`、`README.md`、`docs/`）：CC BY 4.0，见 [LICENSE-docs](LICENSE-docs)
- **数据** `data/top100.csv`：样本本身版权归各原作者，播放量等元数据可自由引用，请注明来源
- **音频** `kit/bgm-default.mp3`：**不在以上任何授权范围内**，版权归原权利人，仅作可复现素材保留
