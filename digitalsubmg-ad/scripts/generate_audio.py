"""Original soundtrack + sound design for the DigitalSubMG ad (fully synthesised).

128 BPM, 64 beats = exactly 30 s. Future bass / tech house / advertising.
Outputs (44.1 kHz, stereo, 16-bit):
  public/audio/music.wav        the full 30 s music bed (no voice, no SFX)
  public/audio/sfx/*.wav        one-shot sound effects placed by <SoundEffects/>

The arrangement follows the scene grid defined in src/lib/timing.ts:
  S1 b0-6 hook | S2 b6-11 reveal | S3 b11-22 products | S4 b22-30 one click
  S5 b30-41 payment | S6 b41-49 trust | S7 b49-53 500+ | S8 b53-64 final
Deterministic: fixed random seed.

Usage: python3 scripts/generate_audio.py   (run from digitalsubmg-ad/)
"""
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
SR = 44100
BPM = 128
BEAT = 60 / BPM
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(128)


# ---------------------------------------------------------------- helpers
def b2s(b: float) -> float:
    return b * BEAT


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def note(name: str) -> int:
    names = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    return names[pitch] + 12 * (octave + 1)


def tvec(dur: float, sr: int = SR) -> np.ndarray:
    return np.arange(int(dur * sr)) / sr


def lp(x, f, order=2, sr=SR):
    return sosfilt(butter(order, min(f, sr * 0.45), "low", fs=sr, output="sos"), x, axis=-1)


def hp(x, f, order=2, sr=SR):
    return sosfilt(butter(order, f, "high", fs=sr, output="sos"), x, axis=-1)


def bp(x, lo, hi, order=2, sr=SR):
    return sosfilt(butter(order, [lo, min(hi, sr * 0.45)], "band", fs=sr, output="sos"), x, axis=-1)


def adsr(n, a, d, s, r, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, max(a_n, 1), endpoint=False),
        np.linspace(1, s, max(d_n, 1), endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    return np.pad(env, (0, max(0, n - len(env))))[:n]


def saw_os(freq, dur, phase=0.0):
    """Naive saw rendered at 4x then decimated (cheap anti-aliasing)."""
    sr4 = SR * 4
    t = np.arange(int(dur * sr4)) / sr4
    f = np.broadcast_to(freq, t.shape) if np.ndim(freq) else freq
    ph = (np.cumsum(np.full(t.shape, f) / sr4) + phase) % 1.0 if np.ndim(freq) else (t * freq + phase) % 1.0
    return resample_poly(2 * ph - 1, 1, 4)


def pan_st(mono, pan):
    """Equal-power pan, pan in [-1, 1]."""
    a = (pan + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)])


def place(buf, sig, t0, gain=1.0):
    """Mix stereo (2, n) or mono signal into stereo buffer at time t0 (s)."""
    if sig.ndim == 1:
        sig = np.stack([sig, sig])
    i0 = int(round(t0 * SR))
    if i0 >= buf.shape[1]:
        return
    s0 = max(0, -i0)
    i0 = max(0, i0)
    n = min(sig.shape[1] - s0, buf.shape[1] - i0)
    if n > 0:
        buf[:, i0:i0 + n] += sig[:, s0:s0 + n] * gain


def reverb_ir(seconds=2.2, decay=0.55, bright=7000):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.exp(-t / decay * 3.0)
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)]) * env
    ir = lp(ir, bright)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR = reverb_ir()
IR_LONG = reverb_ir(4.0, 1.5, 6000)


def reverb(st, ir=IR, mix=0.25):
    wet = np.stack([fftconvolve(st[0], ir[0])[: st.shape[1]], fftconvolve(st[1], ir[1])[: st.shape[1]]])
    return st * (1 - mix) + wet * mix * 0.35


def normalize(x, peak_db=-1.0):
    p = np.max(np.abs(x)) + 1e-9
    return x * (10 ** (peak_db / 20) / p)


def write_wav(path: Path, st: np.ndarray):
    import wave

    path.parent.mkdir(parents=True, exist_ok=True)
    if st.ndim == 1:
        st = np.stack([st, st])
    data = (np.clip(st.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------------------------------------------------------- instruments
def kick(dur=0.42, punch=1.0):
    t = tvec(dur)
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.004) * 0.35 * punch
    return np.tanh((body + click) * 1.6) * 0.9


def clap():
    t = tvec(0.35)
    noise = rng.standard_normal(len(t))
    env = np.zeros_like(t)
    for k, off in enumerate((0.0, 0.011, 0.022)):
        m = t >= off
        env[m] += np.exp(-(t[m] - off) / (0.006 if k < 2 else 0.11))
    sig = bp(noise, 900, 3800) * env
    return pan_st(sig * 0.9, 0.0) + reverb(np.stack([sig, sig]), mix=0.35) * 0.4


def hat(open_=False, pan=0.25):
    t = tvec(0.25 if open_ else 0.06)
    sig = hp(rng.standard_normal(len(t)), 7500, 3) * np.exp(-t / (0.07 if open_ else 0.012))
    return pan_st(sig * 0.5, pan)


def sub(freq, dur, sat=1.3):
    t = tvec(dur)
    sig = np.sin(2 * np.pi * freq * t)
    sig = np.tanh(sig * sat) / np.tanh(sat)
    return sig * adsr(len(t), 0.005, 0.05, 0.9, 0.05)


def offbass(freq, dur=BEAT * 0.45):
    """Tech-house style plucked bass."""
    t = tvec(dur)
    saw = saw_os(freq, dur)[: len(t)]
    cutoff_env = 250 + 1800 * np.exp(-t / 0.05)
    # piecewise filtering: approximate a sweeping LP with three bands mix
    bright = lp(saw, 2200)
    dark = lp(saw, 320)
    mix = (cutoff_env - 250) / 1800
    sig = dark * (1 - mix) + bright * mix
    sig += 0.6 * np.sin(2 * np.pi * freq * t)
    return np.tanh(sig * 1.2) * adsr(len(t), 0.003, 0.08, 0.6, 0.04) * 0.6


def supersaw(freqs, dur, cutoff=5200, a=0.01, r=0.25, voices=7, spread=0.18, width=0.85):
    n = int(dur * SR)
    L, R = np.zeros(n), np.zeros(n)
    for f in freqs:
        for v in range(voices):
            det = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
            s = saw_os(f * 2 ** (det / 12), dur, phase=rng.random())[:n]
            p = ((v % 2) * 2 - 1) * width * abs(det / spread)
            st = pan_st(s, p)
            L[: len(s)] += st[0]
            R[: len(s)] += st[1]
    st = np.stack([L, R]) / (len(freqs) * voices) ** 0.6
    st = lp(st, cutoff, 2)
    return st * adsr(n, a, 0.1, 0.85, r)


def pluck(freq, dur=0.32, bright=4200, pan=0.0):
    t = tvec(dur)
    s = saw_os(freq, dur)[: len(t)] * 0.6 + np.sign(np.sin(2 * np.pi * freq * 2 * t)) * 0.15
    s = lp(s, bright)
    return pan_st(s * np.exp(-t / 0.09), pan)


def bell(freq, dur=1.6, idx=2.4, decay=0.5):
    t = tvec(dur)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * idx * np.exp(-t / 0.3)
    car = np.sin(2 * np.pi * freq * t + mod)
    return car * np.exp(-t / decay) * adsr(len(t), 0.002, 0.0, 1.0, 0.05)


def riser(dur, f0=200, f1=4000, noise_amt=0.6, tone=True):
    t = tvec(dur)
    x = t / dur
    noise = rng.standard_normal(len(t))
    # sweep a band through the noise using 6 overlapping segments
    seg = 6
    out = np.zeros_like(t)
    for k in range(seg):
        lo = f0 * (f1 / f0) ** (k / seg)
        hi = lo * 2.2
        w = np.clip(1 - np.abs(x * seg - k - 0.5) / 1.2, 0, 1)
        out += bp(noise, lo, hi) * w
    sig = out * noise_amt
    if tone:
        f = f0 * (f1 / f0) ** (x ** 1.6) * 0.5
        sig += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = x ** 2.2
    st = np.stack([sig * env, np.roll(sig, 220) * env])
    return reverb(st, mix=0.3)


def impact(dur=2.2, f_hi=70, f_lo=28, noise_amt=0.6):
    t = tvec(dur)
    f = f_lo + (f_hi - f_lo) * np.exp(-t / 0.12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    crack = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.06) * noise_amt
    sig = np.tanh((boom + crack) * 1.5)
    return reverb(np.stack([sig, sig]), IR_LONG, mix=0.35)


def whoosh(dur=0.7, lo=300, hi=5000, pan_from=-0.9, pan_to=0.9):
    t = tvec(dur)
    x = t / dur
    noise = rng.standard_normal(len(t))
    sig = np.zeros_like(t)
    for k in range(5):
        c = lo * (hi / lo) ** (np.sin(np.pi * x) * 0.8 + 0.1)
        sig += bp(noise, lo * (1.4 ** k), lo * (1.4 ** k) * 1.6) * np.exp(-((x - (0.35 + 0.08 * k)) ** 2) / 0.03)
    env = np.sin(np.pi * x) ** 1.5
    sig = sig * env
    p = pan_from + (pan_to - pan_from) * x
    a = (p + 1) * np.pi / 4
    st = np.stack([sig * np.cos(a), sig * np.sin(a)])
    return reverb(st, mix=0.2)


# ---------------------------------------------------------------- arrangement
# Fm7 - Dbmaj7 - Abmaj9 - Eb6 (Ab major / F minor), one chord per bar.
CHORDS = [
    ["F3", "Ab3", "C4", "Eb4", "G4"],
    ["Db3", "F3", "Ab3", "C4", "Eb4"],
    ["Ab3", "C4", "Eb4", "G4", "Bb4"],
    ["Eb3", "G3", "Bb3", "C4", "F4"],
]
ROOTS = ["F1", "Db1", "Ab1", "Eb1"]
BASS = ["F2", "Db2", "Ab2", "Eb2"]


def chord_at(beat):
    return int(beat // 4) % 4


def build_music():
    drums = np.zeros((2, N))
    bass = np.zeros((2, N))
    harm = np.zeros((2, N))
    fx = np.zeros((2, N))
    kicks = []

    def k(b, g=1.0, punch=1.0):
        place(drums, kick(punch=punch), b2s(b), g)
        kicks.append(b2s(b))

    # --- S1 hook (b0-6): sub impulse, riser, brutal stabs on EN / UN / CLIC
    place(fx, impact(2.6, 60, 26, 0.3), 0.0, 0.9)
    place(fx, riser(b2s(4), 120, 2600), 0.0, 0.95)
    for b in (4, 4.5, 5):
        place(harm, supersaw([midi(note(n)) for n in CHORDS[0]], 0.2, cutoff=6000, a=0.002, r=0.08), b2s(b), 0.8)
        place(bass, pan_st(sub(midi(note(ROOTS[0])), 0.22), 0), b2s(b), 0.9)
        k(b, 0.9)
    place(fx, riser(b2s(1), 600, 7000, tone=False), b2s(5), 0.45)

    # --- groove builder
    def groove(b0, b1, *, hats16=False, clap_on=True, offbass_on=False, chords=True,
               chord_cut=5200, chord_gain=0.55, kick_gain=1.0, sub_gain=0.8):
        b = b0
        while b < b1 - 1e-6:
            ci = chord_at(b)
            k(b, kick_gain)
            if clap_on and int(b) % 2 == 1:
                place(drums, clap(), b2s(b), 0.55)
            place(drums, hat(False, 0.3), b2s(b + 0.5), 0.55)
            if hats16:
                place(drums, hat(False, -0.3), b2s(b + 0.25), 0.25)
                place(drums, hat(False, 0.3), b2s(b + 0.75), 0.3)
            if offbass_on:
                place(bass, pan_st(offbass(midi(note(BASS[ci]))), 0), b2s(b + 0.5), 0.9)
            else:
                place(bass, pan_st(sub(midi(note(ROOTS[ci])), BEAT * 0.95), 0), b2s(b), sub_gain)
            if chords and abs((b % 4)) < 1e-6:
                seg = min(4, b1 - b)
                place(harm, supersaw([midi(note(n)) for n in CHORDS[ci]], b2s(seg), cutoff=chord_cut), b2s(b), chord_gain)
            b += 1

    # --- S2 drop / reveal (b6-11)
    place(fx, impact(2.0, 80, 30, 0.7), b2s(6), 0.8)
    groove(6, 11, chord_cut=6500, chord_gain=0.6)

    # --- S3 products (b11-22): energetic, 16th hats, plucked arps
    groove(11, 22, hats16=True, chord_cut=4200, chord_gain=0.45)
    arp_steps = [0, 2, 1, 3, 4, 2, 3, 1]
    for i in range(int((22 - 11) * 2)):
        b = 11 + i * 0.5
        ci = chord_at(b)
        n = CHORDS[ci][arp_steps[i % 8]]
        place(harm, pluck(midi(note(n) + 12), pan=0.4 if i % 2 else -0.4), b2s(b), 0.32)
    place(fx, riser(b2s(2), 400, 6000, tone=False), b2s(20), 0.35)

    # --- S4 one-click groove (b22-30): tech-house offbeat bass, filtered chords
    groove(22, 30, hats16=True, offbass_on=True, chord_cut=2600, chord_gain=0.4)
    place(fx, riser(b2s(2), 300, 5000), b2s(28), 0.4)

    # --- S5 payment (b30-41): melodic progression, open chords, lead melody
    groove(30, 41, hats16=False, chord_cut=7000, chord_gain=0.5)
    melody = [("C5", 30), ("Eb5", 31), ("F5", 31.5), ("G5", 32.5), ("F5", 33.5), ("Eb5", 34),
              ("Ab5", 35), ("G5", 36), ("F5", 36.5), ("Eb5", 37.5), ("C5", 38.5), ("Eb5", 39), ("F5", 40)]
    for n, b in melody:
        place(harm, pluck(midi(note(n)), 0.5, 5200, 0.15), b2s(b), 0.45)
        place(harm, pluck(midi(note(n) + 12), 0.4, 6000, -0.25), b2s(b), 0.12)

    # --- S6 trust (b41-49): lighter groove, three punch hits on the words
    groove(41, 49, hats16=True, chords=False, clap_on=False, sub_gain=0.7)
    for b in (43, 45, 46.5):
        place(fx, impact(1.0, 110, 40, 0.9), b2s(b), 0.55)
        place(harm, supersaw([midi(note(n)) for n in CHORDS[chord_at(b)]], 0.25, cutoff=6000, a=0.002, r=0.1), b2s(b), 0.7)

    # --- S7 500+ (b49-53): impact then fast build, snare roll, stop at b52.5
    place(fx, impact(2.0, 75, 28, 0.8), b2s(49), 0.85)
    groove(49, 51, hats16=True, chords=False)
    place(fx, riser(b2s(3.5), 200, 8000), b2s(49), 0.6)
    roll_b = 51.0
    step = 0.25
    while roll_b < 52.5 - 1e-6:
        place(drums, clap(), b2s(roll_b), 0.25 + 0.35 * (roll_b - 51) / 1.5)
        roll_b += step
        if roll_b >= 52:
            step = 0.125
    k(51, 0.9)
    k(52, 0.9)

    # --- S8 final (b53-64): micro-silence b52.5-b54, final drop on the logo, sonic logo at b60
    place(fx, impact(2.6, 70, 26, 0.8), b2s(54), 0.9)
    groove(54, 60, chord_cut=5000, chord_gain=0.4, kick_gain=0.85, clap_on=True)
    # sonic logo: rising bell triad + sub + long pad
    for i, n in enumerate(["Ab5", "C6", "Eb6", "Ab6"]):
        place(harm, pan_st(bell(midi(note(n)), 2.5, decay=0.9), (-0.4, 0.2, -0.1, 0.4)[i]), b2s(60 + i * 0.25), 0.35)
    place(fx, impact(3.4, 65, 24, 0.5), b2s(60), 0.9)
    place(harm, supersaw([midi(note(n)) for n in ["Ab2", "Eb3", "Ab3", "C4", "Eb4", "G4"]], 1.875, cutoff=4500, a=0.01, r=1.2), b2s(60), 0.55)
    place(bass, pan_st(sub(midi(note("Ab1")), 1.6), 0), b2s(60), 0.85)

    # sidechain pump on bass + harmony
    t = np.arange(N) / SR
    sc = np.ones(N)
    for tk in kicks:
        m = (t >= tk) & (t < tk + 0.4)
        sc[m] = np.minimum(sc[m], 1 - 0.65 * np.exp(-(t[m] - tk) / 0.09))
    harm = reverb(harm, mix=0.28) * sc
    bass = lp(bass, 900) * sc

    mix = drums * 0.75 + bass * 0.8 + harm * 0.75 + fx * 0.7
    # micro-silence before the final drop (keep reverb of the build only)
    gate = np.ones(N)
    s0, s1 = int(b2s(52.5) * SR), int(b2s(54) * SR)
    gate[s0:s1] = 0.0
    gate[s0 - 200:s0] = np.linspace(1, 0, 200)
    gate[s1 - 300:s1] = np.linspace(0, 1, 300)
    mix = mix * gate + reverb(fx * 0.15, IR_LONG, 1.0) * (1 - gate) * 0.6
    # clean ending: fade the last 0.4 s
    fade = np.ones(N)
    fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR)) ** 2
    mix = hp(mix, 25) * fade
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    return normalize(mix, -1.5)


def build_sfx():
    s = {}
    s["sub_boom"] = impact(2.8, 55, 24, 0.2)
    s["bass_drop"] = impact(2.0, 90, 30, 0.8)
    s["logo_impact"] = impact(1.6, 120, 40, 1.0)
    s["deep_impact"] = impact(2.6, 60, 22, 0.6)
    punch = np.zeros((2, int(0.45 * SR)))
    place(punch, kick(0.4, 1.4), 0.0, 0.8)
    place(punch, pan_st(bp(rng.standard_normal(int(0.2 * SR)), 1200, 5000) * np.exp(-tvec(0.2) / 0.02), 0), 0.0, 0.5)
    s["punch"] = punch
    s["riser"] = riser(2.4, 150, 5000)
    s["whoosh"] = whoosh(0.8, 250, 5000, -0.9, 0.9)
    s["whoosh_rev"] = whoosh(0.6, 400, 7000, 0.9, -0.9)
    s["whoosh_short"] = whoosh(0.4, 600, 8000, -0.6, 0.6)
    # UI pop: pitched sine drop
    t = tvec(0.12)
    pop = np.sin(2 * np.pi * np.cumsum(1500 * np.exp(-t / 0.02) + 500) / SR) * np.exp(-t / 0.03)
    s["pop"] = reverb(np.stack([pop, pop]), mix=0.2)
    # premium UI click
    t = tvec(0.06)
    click = (np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.006) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.002) * 0.5)
    s["click"] = np.stack([click, click])
    # confirmation (two rising notes)
    conf = np.zeros(int(0.8 * SR))
    conf[: int(0.6 * SR)] += bell(midi(note("E6")), 0.6, 1.2, 0.18)
    b2 = bell(midi(note("B6")), 0.7, 1.2, 0.25)
    conf[int(0.09 * SR): int(0.09 * SR) + len(b2)] += b2[: len(conf) - int(0.09 * SR)]
    s["confirm"] = reverb(np.stack([conf, conf]) * 0.6, mix=0.3)
    # notification chime
    ch = np.zeros(int(1.2 * SR))
    for i, n in enumerate(["G6", "D7"]):
        bl = bell(midi(note(n)), 1.0, 1.6, 0.35)
        o = int(i * 0.08 * SR)
        ch[o:o + len(bl)] += bl[: len(ch) - o]
    s["chime"] = reverb(np.stack([ch, ch]) * 0.5, mix=0.35)
    # synth shimmer for the logo
    sh = np.zeros((2, int(1.8 * SR)))
    for i, n in enumerate(["Eb6", "G6", "Bb6", "Eb7", "G7"]):
        place(sh, pan_st(bell(midi(note(n)), 1.2, 0.8, 0.4) * 0.3, (-0.6, 0.6, -0.3, 0.3, 0)[i]), i * 0.05)
    s["shimmer"] = reverb(sh, IR_LONG, 0.5)
    # swipe (light, short, bright)
    s["swipe"] = whoosh(0.3, 1500, 9000, -0.4, 0.4)
    # ascending synth (for 500+)
    t = tvec(0.9)
    f = 300 * 2 ** (2.5 * t / 0.9)
    asc = lp(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR), 5000) * np.sin(np.pi * t / 0.9)
    s["ascend"] = reverb(np.stack([asc, asc]) * 0.5, mix=0.3)
    # reverse swell (transition)
    sw = supersaw([midi(note(n)) for n in CHORDS[0]], 1.0, cutoff=5000, a=0.005, r=0.4)
    sw = reverb(sw, IR_LONG, 0.8)[:, ::-1]
    s["reverse"] = sw * np.linspace(0, 1, sw.shape[1]) ** 2
    # cash/payment validation: two quick clicks + bell
    pay = np.zeros((2, int(0.9 * SR)))
    place(pay, s["click"], 0.0, 0.8)
    place(pay, s["click"], 0.06, 0.6)
    place(pay, pan_st(bell(midi(note("A6")), 0.7, 1.0, 0.25) * 0.5, 0), 0.1)
    s["payment_ok"] = reverb(pay, mix=0.25)
    for name, sig in s.items():
        write_wav(OUT / "sfx" / f"{name}.wav", normalize(sig, -3.0))


if __name__ == "__main__":
    write_wav(OUT / "music.wav", build_music())
    build_sfx()
    print("audio ready")
