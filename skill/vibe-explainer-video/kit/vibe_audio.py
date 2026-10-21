# 整片音轨：默认音乐床 = kit/bgm-default.mp3（vibe大赏BGM《千年之后(氛围版)》，约113 BPM）+ 公共音效 + 每期专属音效
# usage: [SFX_ONLY=1] [NO_BGM=1] [BGM_FILE=path] [BGM_GAIN=0.8] [SYNTH=path/to/synth.py] python3 vibe_audio.py events.py out.wav
#   默认 → 文件BGM + 音效。注意：BGM 约113 BPM，与 75BPM 拍网格不同速，音效均为重音/转场，不卡音乐拍
#   NO_BGM=1 → 回退 synth.py 合成配乐（75 BPM，与拍网格同速）；SFX_ONLY=1 → 只出音效（发抖音时叠平台曲库）
#   BGM_FILE=path：换默认音乐文件；BGM_GAIN=0.8：BGM 相对增益（嫌音效被压就调低，嫌BGM弱就调高）
#   events.py：本期专属音效，可用 add/out/music/b2s/BEAT/SR/hz/midi/penta 与乐器
#   piano pad_note bass_note kick tick flip stamp swish chime pop impact riser bandnoise snap
import sys, os, subprocess
here = os.path.dirname(os.path.abspath(__file__))
events, outwav = sys.argv[1], sys.argv[2]
src = open(os.environ.get('SYNTH', os.path.join(here, 'synth.py')), encoding='utf-8').read()
head = src.split('# ---------------- SFX events (beats) ----------------')[0]
tail = '# ---------------- reverb on music bus ----------------' + src.split('# ---------------- reverb on music bus ----------------')[1]
BGM_PATH = os.environ.get('BGM_FILE', os.path.join(here, 'bgm-default.mp3'))
BGM_GAIN = float(os.environ.get('BGM_GAIN', '0.8'))
USE_BGM = not os.environ.get('NO_BGM') and not os.environ.get('SFX_ONLY') and os.path.exists(BGM_PATH)
PRE = 'music[:] = 0.0  # 文件BGM模式：清掉合成旋律床，只留 COMMON/events 的点缀钢琴\n' if USE_BGM else ''
BGM = r'''
# ---------------- file BGM (vibe大赏 千年之后氛围版) ----------------
import subprocess as _sp
_raw = _sp.run(['ffmpeg', '-v', 'error', '-i', BGM_PATH, '-f', 'f32le',
                '-acodec', 'pcm_f32le', '-ac', '2', '-ar', str(SR), '-'],
               capture_output=True).stdout
_bgm = np.frombuffer(_raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
if len(_bgm) < out.shape[0]:
    _bgm = np.tile(_bgm, (int(np.ceil(out.shape[0] / len(_bgm))), 1))
out += _bgm[:out.shape[0]] * BGM_GAIN
''' if USE_BGM else ''
COMMON = r'''
# title card
add(out, swish(0.8), b2s(11.6)); add(out, impact(0.45), b2s(12)); add(out, stamp(0.6), b2s(12) + int(2.4 * SR), pan=.3)
# section entrances
for b in (18, 34, 50, 64, 100, 118, 134, 158): add(out, swish(0.65), b2s(b), g=1)
# pause-and-predict: two cards pop, 3-2-1, held breath, reveal (ACCENT 2)
add(out, pop(660), b2s(73.1)); add(out, pop(880), b2s(73.3), pan=.3)
for k, b in enumerate((74, 75, 76)): add(out, tick(1800 + 300 * k, 1.6), b2s(b))
add(out, impact(0.6), b2s(78)); add(out, stamp(0.8), b2s(78.05), pan=.4)
# tool card rows
for k, b in enumerate(() if SFX_ONLY else (136, 140, 144)): add(music, piano(hz(midi('A', 5) + [0, 4, 7][k]), 2.4, 0.9, bright=1.2), b2s(b), g=.9)
for b in (136, 140, 144): add(out, flip(0.5), b2s(b), pan=-.3)
if not SFX_ONLY: add(music, piano(hz(midi('E', 6)), 2.4, 0.8), b2s(146), g=.8)
# golden line (ACCENT 3)
add(out, riser(2.0, 1.0), b2s(150)); add(out, impact(1.15), b2s(152))
for m in ([] if SFX_ONLY else chord_notes('Am', 4) + chord_notes('Am', 5)): add(music, piano(hz(m), 4.0, 0.8), b2s(152), g=.6)
# question cards
for k in range(4): add(out, flip(0.8, pitch=hz(midi('A', 5) + [0, 3, 7, 10][k])), b2s(159 + k * .5), pan=(k - 1.5) / 3)
penta = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22]
'''
sys.argv = [sys.argv[0], outwav]
exec(head + PRE + COMMON + open(events, encoding='utf-8').read() + BGM + tail,
     {'__name__': '__main__', 'BGM_PATH': BGM_PATH, 'BGM_GAIN': BGM_GAIN})
