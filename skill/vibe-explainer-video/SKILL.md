---
name: "vibe-explainer-video"
description: "做抖音 vibe 大赏风格的知识科普横版视频（134 秒、75 BPM、中英字幕、无旁白）：从选题到成片 MP4、封面和发布文案。用户说做一期、做全、按新规则做视频时使用。"
---

# vibe 大赏知识科普视频 · 全流程

成片规格：1920×1080 · 30fps · 168 拍 = 134.4 秒（75 BPM，1 拍 = 0.8 秒）· 无旁白 · 中英双语字幕 · 每期两版音轨 + 封面 + 发布文案。默认音轨自带 vibe大赏 BGM《千年之后(氛围版)》（`kit/bgm-default.mp3`，约 113 BPM，与拍网格不同速，音效不卡音乐拍）；`NO_BGM=1` 回退 75 BPM 合成配乐（与 We Never 同速）；`SFX_ONLY=1` 只出音效，发布时在抖音叠平台曲库。
验收标准：让尽可能多的人感兴趣。

## 0. 准备工具包（每个新会话先做）

工具包已随本 skill 一起装在 `<本 skill 目录>/kit/`，另有一份示例源文件在 `<本 skill 目录>/examples/`。开工时把它们复制到当前工作目录：

```
SK=~/.workbuddy/skills/vibe-explainer-video
mkdir -p kit && cp "$SK"/kit/* kit/
```

工具包内容：
- `lib.js`：公共渲染库（背景三层视差、扫光、颗粒、暗角、字幕、顶标、注释、片名卡、封面、预测卡、文献卡、工具卡、金句、问题卡、说明卡等）
- `render_frames.py` + `render.sh`：Playwright 逐帧渲染（2 路并行，已有帧跳过，可断点续渲）
- `sheet.py`：按时间点出联系表，同时报 JS 报错
- `synth.py`（第 06 期合成器）+ `vibe_audio.py`：配乐 + 公共音效 + 本期专属音效
- `bgm-default.mp3`：默认音乐床《千年之后(氛围版)》（vibe大赏 BGM），可用 `BGM_FILE=path` 换成其他曲子，`BGM_GAIN`（默认 0.8）调相对音量，`NO_BGM=1` 回退合成配乐
- `encode.sh`：两遍响度归一 + H.264 编码 + 封面
- `events-*.py`：已做期的专属音效示例

参考成片源文件：`<本 skill 目录>/examples/ep09-gambler.html`（结构最完整），`docs/ep07~10-*.md`（分镜与文案格式）。

依赖（本机已装好）：python + playwright（Chromium 已在本机缓存）、numpy、scipy、ffmpeg。**必须用这个解释器跑所有 kit 脚本**，系统 python3 里没有 playwright：

```
export PYTHON=~/.workbuddy/binaries/python/envs/default/bin/python
$PYTHON kit/sheet.py ...      # 而不是 python3 kit/sheet.py
PYTHON=$PYTHON kit/render.sh page.html frames/
```

缺包时装：`~/.workbuddy/binaries/python/envs/default/bin/pip install numpy scipy playwright`；缺字体或装不上就直说，不要静默降级。

## 1. 选题与核实

- 选题方向（抖音 661 条样本中，过万赞比例）：哲学 17.9%、心理学 16.7%、社会经济 15.9%、数学 14.2%；AI 只有 6.9%。从已爆内容里换一个维度讲。
- 开场类型：反常识结论 14.4% 最好；标题 11.9%、提问 9.6% 次之；纯画面 5.5%、猜谜 3.6% 最差。
- 每期要准备的素材：
  - 一个日常物件或生活场景当主角（手机、账单、牌、工资条、走势图）
  - 一个能先猜后揭晓的问题
  - 1–2 个真实历史案例或研究，要有年份、人名、数字
  - 一条边界或反转（别把结论讲死）
- 所有事实先用 WebSearch 核实，记下出处。不编引文、不编文献原话、不编数字；查不到就不放，或改成能核实的说法。
- 演示性画面一律标“示意”或“虚构示例”。健康、理财、博彩题材全程挂免责：“不构成投资建议”或“不构成购彩建议”。
- 理财类配色按国内习惯：红涨 #E5484D / #FF7A7E，绿跌 #1FA971 / #4FD39A。

## 2. 168 拍时间表（所有画面、字幕、音效读同一张拍表）

| 拍 | 秒 | 段落 | 要点 |
|---|---|---|---|
| 0–12 | 0–9.6 | 活封面 + 钩子 | 第 0 帧就是封面：主角物件已在画面里动着，左侧大字两行（`coverText`），0.8–1.65 秒溶解。第一句说观众自己的生活，5–7 拍内落反常识结论，9.5 拍抛下一个钩子 |
| 12–18 | 9.6–14.4 | 片名卡 | `titleCard(t,12,18.6,片名,副标题,英文,两字印章)` |
| 18–34 | 14.4–27.2 | 历史 / 第一个案例 | 文献卡 `docCard`，盖印 |
| 34–50 | 27.2–40 | 规律本身 | 一张图讲清楚 |
| 50–64 | 40–51.2 | 机制：为什么 | |
| 64–73 | 51.2–58.4 | 铺垫预测题 | 把题目画出来 |
| 73–79 | 58.4–63.2 | 暂停预测 | `predict(t,73,[A标题,A小字],[B标题,B小字],答案下标,{header:'先别划走 · …'})`：74/75/76 拍倒数 3-2-1，77 拍屏住，78 拍揭晓（重音 2） |
| 78–100 | 62.4–80 | 揭晓 + 真实案例 / 反转 | |
| 100–118 | 80–94.4 | 放到生活里 / 边界 | |
| 118–134 | 94.4–107.2 | 回收 | 回到开头的物件，给出新的看法 |
| 134–150 | 107.2–120 | 工具卡 | `toolCard(t,134,150.6,工具名,英文,[[小标题,正文,英文]×3],'自问：…')`，三行分别在 136/140/144 拍出现 |
| 150–158 | 120–126.4 | 金句 | `goldenLine(t,150,158.6,第一行,第二行,'——补一句',英文)`，152 拍是重音 3，要能截图转发 |
| 158–164 | 126.4–131.2 | 结尾问题 | `questionCards(…, [[选项,英文]×4])`，可直接报 A/B/C/D 的选项 |
| 164–168 | 131.2–134.4 | 说明卡 | `endNote(t,164,[出处、示意说明、免责])`，最后 0.6 秒淡出 |

全片只放 3 个重音：钩子结论、78 拍揭晓、152 拍金句，其余都用轻音效。

## 3. 写 HTML（每期一个文件，和 lib.js 放同一目录）

结构照 `examples/ep09-gambler.html`：
```
<canvas id="c" width="1920" height="1080"></canvas>
<script> 本期常量与场景函数 …; window.EP = {…}; </script>
<script src="lib.js"></script>
```
`window.EP` 字段：
- `NO`：期号字符串，占位可改
- `BEATS`：168，试片用 16
- `SUBS`：`[[起拍, 止拍, 中文, 英文], …]`，每条 2.5–3.5 拍，每句只说一件事
- `TOPLABELS`：`[[起, 止, '段落顶标'], …]`
- `NOTES`：`[[起, 止, '示意 / 数据来源小字'], …]`
- `SCENES`：`[场景函数, t => titleCard(…), …]`
- `cover`：`t => coverText(t, 第一行, 第二行, 副题, 小标, {s1, scrimW, l2color, l2glow})`
- `background`：可选

场景写法：
- `function sXxx(t){ scene(t, 起拍, 止拍+0.6, A => {…}, {cx, cy}) }`：自带淡入淡出和 3%–5% 镜头缓推。
- 元素出场：`k = eo(segB(t, a, b))` 后用 `txtIn(s, x, y, k, o)`。
- 重点数字：`popTxt(s, x, y, t, 拍, o)`。
- 渲染必须是 t 的纯函数，随机数用 `rng(seed)`，不能用 Math.random。

常用件：`paperCard` / `pText` 纸卡，`seal` 两字印章（三个字会坏版），`rectStamp` 方章，`glow`，`rrect`，`fmtInt`。

版式规矩：
- 字幕区在画面底部约 y 920–1060，不能压字。
- 画面主体放在 y 150–860。
- 同一屏只有一个主角。
- 文字最小 22px。
- 叠层时先盖一层暗底 `rgba(6,6,26,.8)`，再放新内容。

## 4. 先做 16 拍试片

1. 把 `BEATS` 设成 16，只放钩子和片名卡，跑联系表：
   `$PYTHON kit/sheet.py "[0.1,1,2,3,4,5,6,7,8,9,10,11,12]" sheet.png 4 /abs/path/page.html`
   时间点单位是秒，拍数要先乘 0.8。
2. 看图检查第 0 帧是否像封面、3 秒内结论有没有落下、字有没有重叠。
3. 一次做多期时，先把试片联系表给用户看方向，再做全片。用户已经说了“做全”就直接往下做。

## 5. 全片自检（编码前必须做）

每段取 1–2 个时间点（共约 24 个）出联系表，逐格查下面这些问题，修完重出表，直到干净：
- 文字和字幕重叠，或文字和文字重叠
- 叠层下面有残留：灰框、上一段的标签
- 某一格画面空了：动画还没开始、透明度为 0、元素画到了屏外
- 印章显示 `undefined`（印章字超过两个）
- 预测卡和揭晓画面打架，揭晓大字要比 78 拍晚一点出现
- 编出来的数字或引文，有就删
- `sheet.py` 报出 JS 错误（errors 必须是 `[]`）

## 6. 渲染、音轨、编码

```
PYTHON=$PYTHON kit/render.sh page.html frames/ff_name   # 4032 帧，约 3–6 分钟
$PYTHON kit/vibe_audio.py events-name.py aud/name-music.wav
SFX_ONLY=1 $PYTHON kit/vibe_audio.py events-name.py aud/name-sfx.wav
kit/encode.sh frames/ff_name aud/name-music.wav aud/name-sfx.wav out/epNN-片名
```
- `events-name.py` 只写本期专属音效。公共音效 vibe_audio.py 已经带了：片名卡、段落转场、预测倒计时与揭晓、工具卡、金句、问题卡。
- 默认音轨（`$PYTHON kit/vibe_audio.py events-name.py aud/name-music.wav`）= BGM《千年之后(氛围版)》+ 音效；要换成 75 BPM 合成配乐就加 `NO_BGM=1`，要换曲子就 `BGM_FILE=路径`。
- 写法：`add(out, 乐器(...), b2s(拍), pan=…)`。可用乐器：tick、flip、stamp、swish、chime、pop、impact、riser、bandnoise、kick、piano。
- 音效要对上画面事件（翻牌、盖章、计数、弹出），参考 `events-*.py`。
- 只修了某几段画面时，删掉对应帧号（秒 × 30）再跑 render.sh，只补渲那几段。
- 编码很慢（2 核机器上每个 MP4 约 8–10 分钟）：用 `run_in_background` 加长 timeout，多期串行跑。被中断时，留下的 MP4 可能是半截，要用 ffprobe 查时长，坏了就删掉重编。

## 7. 成片检查

- ffprobe 查每个 MP4 时长是否为 134.4 秒。
- `encode.sh` 末尾会打印响度：配乐版应为 −16 LUFS，只音效版应为 −20 LUFS。
- 从 MP4 抽 16 帧拼成 4×4 联系表，再看一遍。

## 8. 交付

1. 每期写一个 md（如 `<系列>-epNN-<短名>.md`），格式照 `docs/ep07-deck.md`：
   - 规格行
   - 前三秒与互动钩子表
   - 分镜表：时间、段落、画面、字幕要点
   - 工具卡
   - 抖音发布文案：标题“系列名NN｜反常识结论”；正文三句，含转发理由与免责；置顶评论由作者先答一个选项；两条评论区科普，带数字和出处
   - 资料清单
2. HTML 源文件同目录留档：`<系列>-epNN-<短名>-source.html`。
3. lib.js 或工具包有改动时，同步回写 `~/.workbuddy/skills/vibe-explainer-video/kit/`。
4. 用 present_files 把每期的配乐版 MP4、只音效版 MP4 和封面 JPG 一起发给用户。
5. 最后用几句话说明：
   - 每期的钩子、预测题、金句
   - 期号是占位，改 `EP.NO` 后重渲即可
   - 删改了哪些没核实的说法
   - 建议先发哪一期