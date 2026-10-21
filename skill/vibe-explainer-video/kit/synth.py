# 《没有尾巴的老鼠》配乐与音效 · 75 BPM · A 小调 · numpy 合成
# 所有时刻以“拍”为单位，与 goodhart.html 的节拍表一致
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
import wave, sys

SR = 44100
BPM = 75   # matched to We Never (~75 BPM)
BEAT = 60 / BPM
TOTAL_BEATS = 168
DUR = TOTAL_BEATS * BEAT
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)

def b2s(b): return int(round(b * BEAT * SR))
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def midi(n, o): return 12 * (o + 1) + NOTE[n]

CH = {  # root, third, fifth (pitch classes)
    'Am': ('A', [0, 3, 7]), 'F': ('F', [0, 4, 7]), 'C': ('C', [0, 4, 7]), 'G': ('G', [0, 4, 7]),
    'Dm': ('D', [0, 3, 7]), 'E': ('E', [0, 4, 7]),
}
CHORDS = [(0, 'Am'), (4, 'F'), (8, 'E'), (12, 'Am'), (16, 'F'), (20, 'C'), (24, 'G'), (28, 'Am'), (32, 'F'), (36, 'C'), (40, 'G'),
          (44, 'Am'), (48, 'F'), (52, 'Dm'), (56, 'E'), (60, 'Am'), (64, 'F'), (68, 'Dm'), (72, 'E'),
          (78, 'Am'), (82, 'F'), (86, 'C'), (90, 'G'), (94, 'Am'), (98, 'F'), (102, 'C'), (106, 'G'), (110, 'Am'), (114, 'F'),
          (118, 'Dm'), (122, 'F'), (126, 'E'), (128, 'Am'), (132, 'F'), (134, 'C'), (138, 'G'), (142, 'Am'), (146, 'F'), (150, 'E'),
          (152, 'Am'), (156, 'F'), (160, 'C'), (164, 'Am'), (168, 'Am')]

def chord_at(beat):
    c = CHORDS[0][1]
    for s, n in CHORDS:
        if beat >= s: c = n
    return c

# ---------------- section plan ----------------
# each entry: (start_beat, end_beat, dict of layer gains)
SECTIONS = [
    (0, 12, dict(pad=.55, keys=.5, pulse=.5)),
    (12, 18, dict(pad=.6, keys=.55, chordhit=1)),
    (18, 28, dict(pad=.5, arp=.42, bass=.5, kick=.55)),
    (28, 44, dict(pad=.5, arp=.5, bass=.6, kick=.7, shaker=.35)),
    (44, 59, dict(pad=.5, arp=.5, bass=.6, kick=.7, shaker=.3)),
    (59, 60, dict(pad=.35)),                                       # breath before the law
    (60, 64, dict(pad=.65, keys=.55, bass=.5)),
    (64, 73, dict(pad=.5, keys=.45, kick=.45, bass=.4)),
    (73, 77, dict(pad=.4, heart=.9, tick=.7)),
    (77, 78, dict(pad=.2)),                                        # held breath, frame darkens
    (78, 100, dict(pad=.5, arp=.55, bass=.65, kick=.8, shaker=.4)),
    (100, 118, dict(pad=.5, arp=.55, bass=.65, kick=.8, shaker=.42)),
    (118, 134, dict(pad=.55, keys=.55)),
    (134, 150, dict(pad=.5, arp=.38, bass=.45, kick=.45)),
    (150, 152, dict(pad=.8, arp=.5, bass=.5)),
    (152, 158, dict(pad=.7, arp=.55, bass=.7, kick=.85, shaker=.35)),
    (158, 168, dict(pad=.55, keys=.5)),
]
import os
SFX_ONLY = os.environ.get('SFX_ONLY') == '1'
MUSIC_LAYERS = {'pad', 'arp', 'keys', 'kick', 'bass', 'pulse', 'shaker'}
def gain(layer, beat):
    if SFX_ONLY and layer in MUSIC_LAYERS: return 0.0
    for s, e, g in SECTIONS:
        if s <= beat < e: return g.get(layer, 0.0)
    return 0.0

out = np.zeros((N, 2))
music = np.zeros((N, 2))   # goes to reverb

def add(buf, sig, start, pan=0.0, g=1.0):
    if start < 0: sig = sig[-start:]; start = 0
    end = min(N, start + len(sig))
    if end <= start: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[start:end, 0] += sig[:end - start] * g * l * 1.414
    buf[start:end, 1] += sig[:end - start] * g * r * 1.414

def env_adsr(n, a, d, s, r_len):
    t = np.arange(n) / SR
    e = np.ones(n)
    ai = int(a * SR); e[:ai] = np.linspace(0, 1, ai) if ai > 0 else 1
    return e

# ---------------- instruments ----------------
def piano(f, dur=2.2, vel=1.0, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for k in range(1, 8):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > 16000: break
        a = (1 / k ** 1.45) * (bright if k > 2 else 1)
        s += a * np.sin(2 * np.pi * fk * t + rng.random() * 6.28) * np.exp(-t * (1.1 + 0.9 * k))
    att = np.minimum(1, t / 0.004)
    s *= att * vel
    # hammer
    s[:200] += rng.standard_normal(200) * np.linspace(.04, 0, 200) * vel
    return s * 0.32

def pad_note(f, dur, a=0.7, r=1.0):
    n = int((dur + r) * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.0035, 0, 0.0031):
        ff = f * (1 + det)
        s += np.sin(2 * np.pi * ff * t + rng.random() * 6.28) + 0.28 * np.sin(4 * np.pi * ff * t) + 0.08 * np.sin(6 * np.pi * ff * t)
    e = np.minimum(1, t / a) * np.where(t < dur, 1, np.exp(-(t - dur) / (r / 3)))
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.21 * t)
    return s * e * lfo * 0.06

def bass_note(f, dur=1.4):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.06 * np.sin(6 * np.pi * f * t)
    e = np.minimum(1, t / 0.008) * np.exp(-t * 2.2)
    return s * e * 0.34

def kick(vel=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 42 + 70 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s[:120] += rng.standard_normal(120) * np.linspace(.15, 0, 120)
    return s * 0.55 * vel

def bandnoise(dur, lo, hi, decay, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    sos = butter(2, [lo, hi], btype='band', fs=SR, output='sos')
    s = sosfilt(sos, rng.standard_normal(n)) * np.exp(-t * decay)
    return s * vel

def shaker(vel=1.0): return bandnoise(0.09, 5000, 11000, 60, 0.05 * vel)

def heart(vel=1.0):
    s = np.zeros(int(0.6 * SR))
    for off, v in ((0, 1), (0.18, .7)):
        n = int(0.22 * SR); t = np.arange(n) / SR
        h = np.sin(2 * np.pi * (48 + 20 * np.exp(-t * 25)) * t) * np.exp(-t * 16) * v
        i = int(off * SR); s[i:i + n] += h
    return s * 0.6 * vel

def tick(f=2600, vel=1.0):
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 110) + bandnoise(0.05, 3000, 9000, 140, .2)[:n]) * 0.22 * vel

def flip(vel=1.0, pitch=None):
    s = bandnoise(0.14, 1400, 6500, 32, 0.22 * vel)
    s2 = bandnoise(0.05, 300, 1200, 70, 0.18 * vel)
    s[:len(s2)] += s2
    if pitch:
        p = piano(pitch, 1.2, 0.45 * vel, bright=1.3)
        out_ = np.zeros(max(len(s), len(p))); out_[:len(s)] += s; out_[:len(p)] += p
        return out_
    return s

def stamp(vel=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (85 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 18) * 0.6
    s[:int(.04 * SR)] += bandnoise(0.04, 600, 4000, 90, 0.35)
    return s * vel

def swish(dur=0.7, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # sweep: blend two band filters by envelope
    lo = sosfilt(butter(2, [400, 1600], btype='band', fs=SR, output='sos'), x)
    hi = sosfilt(butter(2, [1600, 6000], btype='band', fs=SR, output='sos'), x)
    u = t / dur
    e = np.sin(np.pi * u) ** 2
    return (lo * (1 - u) + hi * u) * e * 0.07 * vel

def snap(vel=1.0):
    s = piano(hz(midi('E', 6)), 0.8, 0.5, bright=1.6)
    s[:int(.03 * SR)] += bandnoise(0.03, 2000, 9000, 100, 0.5)
    n = int(0.25 * SR); t = np.arange(n) / SR
    s[:n] += np.sin(2 * np.pi * 140 * t * (1 - t * 1.5)) * np.exp(-t * 14) * 0.25
    return s * vel

def chime(vel=1.0):
    s = np.zeros(int(2.0 * SR)); t = np.arange(len(s)) / SR
    for f, d, a in ((hz(midi('E', 6)), 0, 1), (hz(midi('B', 6)), 0.09, .8), (hz(midi('E', 7)), 0.18, .5)):
        i = int(d * SR); tt = t[:len(s) - i]
        s[i:] += a * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6)) * np.exp(-tt * 3.2)
    return s * 0.09 * vel

def pop(f, vel=1.0):
    n = int(0.25 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t * (1 + 0.15 * np.exp(-t * 40))) * np.exp(-t * 22) * 0.2 * vel

def impact(vel=1.0):
    n = int(3.0 * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 6)) * t) * np.exp(-t * 1.6)
    body = sosfilt(butter(2, 900, btype='low', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 5) * 0.5
    s = (sub * 0.9 + body * 0.6)
    s[:int(.02 * SR)] += bandnoise(0.02, 1500, 8000, 120, .4)
    return s * 0.7 * vel

def riser(beats=1.0, vel=1.0):
    n = int(beats * BEAT * SR); t = np.arange(n) / SR; u = t / t[-1]
    x = rng.standard_normal(n)
    s = sosfilt(butter(2, [300, 5000], btype='band', fs=SR, output='sos'), x) * u ** 2.5 * 0.08
    s += np.sin(2 * np.pi * (60 + 200 * u ** 2) * t) * u ** 2 * 0.08
    return s * vel

# ---------------- music layers ----------------
def chord_notes(name, octave):
    root, iv = CH[name]
    r = midi(root, octave)
    return [r + i for i in iv]

# pad: per chord span
spans = CHORDS + [(TOTAL_BEATS, 'Am')]
for (s, c), (e, _) in zip(CHORDS, CHORDS[1:]):
    if e <= s: continue
    gmid = gain('pad', s + 0.01)
    if gmid <= 0: continue
    notes = chord_notes(c, 3) + [chord_notes(c, 4)[0], chord_notes(c, 4)[1]]
    dur = (e - s) * BEAT
    for k, m in enumerate(notes):
        add(music, pad_note(hz(m), dur), b2s(s), pan=(-.35 + .17 * k), g=gmid)

beats = np.arange(0, TOTAL_BEATS, 0.5)
ARP_PAT = [0, 2, 4, 2, 5, 4, 2, 1]   # indices into extended chord tones
for bt in beats:
    c = chord_at(bt)
    tones = chord_notes(c, 4) + chord_notes(c, 5)
    g = gain('arp', bt)
    if g > 0:
        idx = ARP_PAT[int(bt * 2) % len(ARP_PAT)]
        vel = 0.75 + 0.25 * (bt % 1 == 0)
        add(music, piano(hz(tones[idx]), 1.6, vel), b2s(bt), pan=(-.3 if int(bt * 2) % 2 else .3), g=g)
    if bt % 1 == 0:
        g = gain('keys', bt)
        if g > 0 and int(bt) % 2 == 0:
            tone = chord_notes(c, 5)[int(bt / 2) % 3]
            add(music, piano(hz(tone), 2.6, 0.8, bright=1.2), b2s(bt), pan=.15, g=g)
        g = gain('kick', bt)
        if g > 0 and int(bt) % 2 == 0: add(out, kick(), b2s(bt), g=g)
        g = gain('bass', bt)
        if g > 0 and int(bt) % 2 == 0:
            add(out, bass_note(hz(chord_notes(c, 2)[0])), b2s(bt), g=g)
        g = gain('pulse', bt)
        if g > 0: add(out, bass_note(hz(chord_notes(c, 2)[0]), 0.6) * 0.6, b2s(bt), g=g)
        g = gain('heart', bt)
        if g > 0: add(out, heart(), b2s(bt), g=g)
        g = gain('tick', bt)
        if g > 0: add(out, tick(2200), b2s(bt), pan=.2, g=g)
    else:
        g = gain('shaker', bt)
        if g > 0: add(out, shaker(), b2s(bt), pan=.4, g=g)

# chord hit at title
for m in ([] if SFX_ONLY else chord_notes('Am', 3) + chord_notes('Am', 4)):
    add(music, piano(hz(m), 3.5, 0.9), b2s(12), g=.7)

# ---------------- SFX events (beats) ----------------
# 0) opening: the step-shaker rattles from frame 0 (one swing per half beat), pull-back reveal, "0 步" lands
for k in range(13):
    b = k * 0.5
    v = 0.45 if b < 2.6 else 0.8
    add(out, tick(900, v) + 0, b2s(b), pan=(-.25 if k % 2 else .25))
    add(out, stamp(0.12 * v), b2s(b), pan=(-.25 if k % 2 else .25))
add(out, swish(0.7, 1.1), b2s(2.5))                              # camera pulls back
add(music, chime(0.8), b2s(3.0), g=1)                            # leaderboard figure
add(out, impact(0.5), b2s(3.4))                                  # "0 步"
add(out, stamp(0.9), b2s(3.42), pan=-.4)
add(out, swish(0.8), b2s(6.2))                                   # cards drop in
for i in range(7): add(out, flip(0.35), b2s(6.6) + int(i * 0.05 * SR), pan=(i - 3) / 4)
# 1) hook: cascade flip at beat 10 (ACCENT 1)
for i in range(7):
    add(out, flip(0.9, pitch=hz(midi('A', 5) + [0, 3, 7, 12, 7, 3, 0][i])), b2s(10) + int(abs(i - 3) * 0.09 * SR), pan=(i - 3) / 4, g=.8)
add(out, riser(1.0, 0.9), b2s(9))
add(out, impact(1.0), b2s(10), g=1.0)
# title
add(out, swish(0.8), b2s(11.6), g=1)
add(out, impact(0.45), b2s(12), g=1)
add(out, stamp(0.6), b2s(12) + int(2.4 * SR), pan=.3)            # 古德哈特 seal on title card
# history
add(out, swish(0.7), b2s(18), g=1)
add(out, stamp(0.8), b2s(24.6), pan=.4)                          # 鼠疫 seal
add(out, swish(0.7), b2s(27), g=1)
add(out, flip(0.8), b2s(27.6))
add(out, stamp(0.9), b2s(29.1), pan=.2)                          # 悬赏
add(music, chime(1.0), b2s(30.6), g=1)                           # 1¢ coin
add(out, swish(0.6), b2s(34), g=1)
for k in range(16):                                              # tails piling: rising soft ticks
    add(out, tick(1400 + k * 90, 0.6), b2s(34.6 + k * 0.4), pan=-.4)
add(out, swish(0.5, 1.2), b2s(36.4), pan=-.6)                    # rats dash
for k in range(4): add(out, bandnoise(0.06, 2500, 7000, 80, .12), b2s(39.1 + k * .35), pan=.0)  # snip snip
add(out, flip(0.8), b2s(41.5))
add(out, stamp(0.9), b2s(42.5), pan=.2)                          # 鼠场
# mechanism
add(out, swish(0.7), b2s(44), g=1)
add(music, chime(0.9), b2s(50.6), g=1)                           # coin drop
add(out, riser(1.5, 0.6), b2s(50.5))
add(out, snap(1.0), b2s(52))
add(out, swish(0.7), b2s(54), g=1)
add(out, stamp(0.9), b2s(57.05), pan=.3)                         # 古德哈特 seal
add(out, riser(1.0, 1.0), b2s(59))
add(out, impact(1.1), b2s(60))                                   # ACCENT 2: the law
# Mexico
add(out, swish(0.7), b2s(64), g=1)
for i in range(10): add(out, flip(0.4), b2s(64.2) + int(i * 0.07 * SR), pan=(i - 4.5) / 6)
for d in range(5): add(out, stamp(0.35), b2s(67.5 + d), pan=(d - 2) / 3)
add(out, pop(660), b2s(73.1)); add(out, pop(880), b2s(73.3), pan=.3)
for k, b in enumerate((74, 75, 76)): add(out, tick(1800 + 300 * k, 1.6), b2s(b))
add(out, impact(0.5), b2s(78))                                   # reveal
add(out, stamp(0.8), b2s(78.05), pan=.4)
penta = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22]
for i in range(10): add(out, pop(hz(midi('A', 5) + penta[i]), 0.9), b2s(81.3 + i * .25), pan=(i - 4.5) / 6)
add(out, snap(0.7), b2s(95.5))
# Wells Fargo
add(out, swish(0.7), b2s(100), g=1)
for k in range(28): add(out, tick(1500 + k * 45, 0.55), b2s(103.5 + k * 0.107), pan=.35)
add(out, impact(0.35), b2s(106.5))
add(out, stamp(1.0), b2s(107.05), pan=.4)                        # 罚
# life
add(out, swish(0.6), b2s(109), g=1)
for k, b in enumerate((109.5, 111, 112.5)): add(out, flip(0.9, pitch=hz(midi('E', 5) + [0, 3, 7][k])), b2s(b), pan=(k - 1) * .5)
# callback
add(out, swish(0.8), b2s(118), g=1)
add(music, chime(0.7), b2s(124.6), g=1)
add(out, impact(0.4), b2s(128))
add(out, stamp(1.0), b2s(128.05))
# tool card
add(out, swish(0.7), b2s(134), g=1)
for k, b in enumerate(() if SFX_ONLY else (136, 140, 144)): add(music, piano(hz(midi('A', 5) + [0, 4, 7][k]), 2.4, 0.9, bright=1.2), b2s(b), g=.9)
if not SFX_ONLY: add(music, piano(hz(midi('E', 6)), 2.4, 0.8), b2s(146), g=.8)
# golden line
add(out, riser(2.0, 1.0), b2s(150))
add(out, impact(1.15), b2s(152))                                 # ACCENT 3
for m in ([] if SFX_ONLY else chord_notes('Am', 4) + chord_notes('Am', 5)): add(music, piano(hz(m), 4.0, 0.8), b2s(152), g=.6)
# question
add(out, swish(0.6), b2s(158), g=1)
for k in range(4): add(out, flip(0.8, pitch=hz(midi('A', 5) + [0, 3, 7, 10][k])), b2s(159 + k * .5), pan=(k - 1.5) / 3)

# ---------------- reverb on music bus ----------------
def ir(seconds=2.4, seed=1):
    r = np.random.default_rng(seed); n = int(seconds * SR); t = np.arange(n) / SR
    x = r.standard_normal(n) * np.exp(-t * 3.0)
    x = sosfilt(butter(2, 5200, btype='low', fs=SR, output='sos'), x)
    x[:int(.012 * SR)] = 0
    return x / np.sqrt(np.sum(x ** 2))
wetL = fftconvolve(music[:, 0] + out[:, 0] * 0.15, ir(seed=1))[:N]
wetR = fftconvolve(music[:, 1] + out[:, 1] * 0.15, ir(seed=2))[:N]
mix = out + music
mix[:, 0] += wetL * 0.32; mix[:, 1] += wetR * 0.32

# gentle high-pass to remove DC/subsonic
hp = butter(2, 28, btype='high', fs=SR, output='sos')
mix[:, 0] = sosfilt(hp, mix[:, 0]); mix[:, 1] = sosfilt(hp, mix[:, 1])

# fade in/out
n_end = int(DUR * SR)
mix = mix[:n_end]
fi = int(0.02 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(2.5 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

# soft clip safety, then normalize peak to -1 dBFS (loudness handled by ffmpeg)
mix = np.tanh(mix * 0.9) / 0.9
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'bgm.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', DUR)
