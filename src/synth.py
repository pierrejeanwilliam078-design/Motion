"""Boîte à outils de synthèse sonore partagée par les bandes-son des teasers."""
import json
import subprocess
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt  # noqa: F401  (fftconvolve réexporté)

SR = 44100
rng = np.random.default_rng(7)


def load_timeline(path):
    src = open(path, encoding="utf-8").read()
    return json.loads(src[src.index("{"): src.rindex("}") + 1])


def write_wav(path, mix):
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(bus, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    n = len(bus)
    if i >= n or i + len(sig) <= 0:
        return
    if sig.ndim == 1:
        left = np.cos((pan + 1) * np.pi / 4)
        right = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * left, sig * right], axis=1) * np.sqrt(2)
    j = min(n, i + len(sig))
    off = max(0, -i)
    bus[max(i, 0):j] += sig[off: j - i] * gain


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=0)


def sweep_filter(x, cutoff, kind="low", block=256):
    """Filtre dont la fréquence de coupure suit la courbe `cutoff` (un point par échantillon)."""
    out = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(np.clip(cutoff[min(s + block // 2, len(x) - 1)], 30, SR * 0.45))
        sos = butter(2, fc, kind, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        out[s:s + block], zi = sosfilt(sos, x[s:s + block], axis=0, zi=zi)
    return out


def saw(freq, dur, detune=0.0):
    t = t_axis(dur)
    ph = (freq * (1 + detune) * t + rng.random()) % 1.0
    return 2 * ph - 1


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ---------------------------------------------------------------- instruments

def kick(gain=1.0, dur=0.55):
    t = t_axis(dur)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = hp(noise(dur), 2500) * np.exp(-t * 180) * 0.25
    return np.tanh((body + click) * 1.6) * gain


def boom(dur=4.0, f0=70, f1=28):
    """Impact cinématique grave."""
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 3.5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * 1.3)
    crack = lp(noise(dur), 1800) * np.exp(-t * 9) * 0.9
    return np.tanh((sub * 1.4 + crack) * 1.3)


def clap(dur=0.35):
    t = t_axis(dur)
    n = bp(noise(dur), 900, 6000)
    env = np.exp(-t * 22)
    for k in (0.0, 0.011, 0.022):  # triple attaque façon clap
        env += np.exp(-np.clip(t - k, 0, None) * 120) * (t >= k) * 0.6
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * env * 0.5 + tone)


def hat(dur=0.08, bright=8000):
    t = t_axis(dur)
    return hp(noise(dur), bright) * np.exp(-t * 60)


def blip(freq, dur=0.07, square=True):
    t = t_axis(dur)
    w = np.sign(np.sin(2 * np.pi * freq * t)) if square else np.sin(2 * np.pi * freq * t)
    return lp(w, 7000) * np.exp(-t * 35) * 0.5


def glitch(dur=0.25):
    """Rafale numérique : bruit échantillonné-bloqué + bips aléatoires."""
    n = int(dur * SR)
    hold = rng.integers(20, 160)
    raw = np.repeat(rng.uniform(-1, 1, n // hold + 1), hold)[:n]
    gate = np.repeat(rng.random(n // 900 + 1) > 0.35, 900)[:n]
    t = t_axis(dur)
    tone = np.sign(np.sin(2 * np.pi * rng.uniform(600, 3200) * t))
    return (raw * 0.6 + tone * 0.25) * gate * np.exp(-t * 4)


def whoosh(dur=0.6, f_lo=300, f_hi=6000, rising=True):
    x = noise(dur)
    t = np.linspace(0, 1, len(x))
    curve = f_lo * (f_hi / f_lo) ** (t if rising else 1 - t)
    y = sweep_filter(bp(x, 150, 12000), curve, "low")
    env = np.sin(np.pi * t) ** 2 if not rising else t ** 2.2
    return y * env


def riser(dur, f_lo=200, f_hi=9000):
    """Montée : bruit filtré qui s'ouvre + glissando de sinus."""
    x = noise(dur)
    t = np.linspace(0, 1, len(x))
    noise_part = sweep_filter(x, f_lo * (f_hi / f_lo) ** (t ** 1.4), "low") * t ** 2.5
    f = 110 * 2 ** (t ** 1.6 * 3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return noise_part * 0.7 + tone * 0.18 * t ** 2


def shimmer(freqs, dur, attack=0.02, decay=1.2):
    t = t_axis(dur)
    env = np.minimum(t / attack, 1) * np.exp(-t * decay)
    s = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in freqs) / len(freqs)
    return s * env


def pad_voice(note, dur, cutoff_curve, voices=3):
    sig = sum(saw(midi(note), dur, d) for d in np.linspace(-0.006, 0.006, voices)) / voices
    return sweep_filter(sig, cutoff_curve, "low")


def pluck(note, dur=0.22, bright=3500):
    t = t_axis(dur)
    sig = saw(midi(note), dur) * 0.6 + np.sign(np.sin(2 * np.pi * midi(note) * t)) * 0.4
    return lp(sig, bright) * np.exp(-t * 14)


def reverb_ir(seconds=2.8, decay=2.2):
    t = t_axis(seconds)
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t * decay)[:, None]
    ir = lp(ir, 6000)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt(np.sum(ir ** 2, axis=0))


def delay(x, time, feedback=0.4, taps=5):
    out = x.copy()
    d = int(time * SR)
    for k in range(1, taps + 1):
        g = feedback ** k
        shifted = np.zeros_like(x)
        shifted[d * k:] = x[: len(x) - d * k] if d * k < len(x) else 0
        if k % 2:  # écho ping-pong
            shifted = shifted[:, ::-1]
        out += shifted * g
    return out


# ---------------------------------------------------------------- instruments d'orchestre hybride

def strings(notes, dur, attack=1.2, release=1.0, bright=2600, voices=5):
    """Section de cordes : dents de scie désaccordées, vibrato lent, filtre doux."""
    t = t_axis(dur)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, dur - t) / release)
    out = np.zeros_like(t)
    for n in notes:
        for d in np.linspace(-0.007, 0.007, voices):
            vib = 1 + 0.003 * np.sin(2 * np.pi * (5 + rng.random()) * t + rng.random() * 6)
            ph = np.cumsum(midi(n) * (1 + d) * vib) / SR + rng.random()
            out += 2 * (ph % 1.0) - 1
    return lp(out / (voices * len(notes)), bright, 2) * env


def staccato(note, dur=0.11, bright=3200):
    t = t_axis(dur)
    s = sum(saw(midi(note), dur, d) for d in (-0.005, 0.0, 0.005)) / 3
    return lp(s, bright) * np.minimum(1, t / 0.006) * np.exp(-t * 18)


def brass(notes, dur, swell=0.15, peak=2400, sustain=1300, drive=1.8):
    """Cuivres : ouverture rapide du filtre puis maintien, légère saturation."""
    t = np.linspace(0, 1, int(dur * SR))
    sig = sum(saw(midi(n), dur, d) for n in notes for d in (-0.004, 0.004)) / (2 * len(notes))
    tt = t * dur
    cutoff = np.where(tt < swell, 200 + (peak - 200) * tt / swell, sustain + (peak - sustain) * np.exp(-(tt - swell) * 4))
    env = np.minimum(1, tt / 0.03) * np.minimum(1, (dur - tt) / 0.4)
    return np.tanh(sweep_filter(sig, cutoff, "low") * drive) * env


def braam(dur=4.0, notes=(26, 38, 45, 50, 53)):
    """Le « braam » de bande-annonce : grappe de cuivres graves, filtre qui s'ouvre puis se referme."""
    t = t_axis(dur)
    sig = sum(saw(midi(n), dur, d) for n in notes for d in (-0.006, 0.0, 0.006)) / (3 * len(notes))
    cut = 150 + 2600 * np.exp(-((t - 0.25) ** 2) / 0.08) + 500 * np.exp(-t * 0.8)
    env = np.minimum(1, t / 0.05) * np.exp(-t * 0.55)
    return np.tanh(sweep_filter(sig, cut, "low") * 3.0) * env


def taiko(dur=1.2, f0=95, f1=48, gain=1.0):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    skin = lp(noise(dur), 900) * np.exp(-t * 25) * 0.6
    return np.tanh((body + skin) * 1.8) * gain


def choir(notes, dur, attack=0.6, release=1.2):
    """Chœur synthétique : dents de scie passées dans les formants d'un « ah »."""
    t = t_axis(dur)
    src = sum(saw(midi(n), dur, d) for n in notes for d in (-0.008, 0.0, 0.008)) / (3 * len(notes))
    voice = bp(src, 600, 800) + 0.6 * bp(src, 1100, 1350) + 0.25 * bp(src, 2400, 2800)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, dur - t) / release)
    return voice * env * 2.2


def bell(note, dur=3.0):
    t = t_axis(dur)
    f = midi(note)
    parts = [(1, 1.0, 1.2), (2.76, 0.5, 2.0), (5.4, 0.25, 3.5), (8.93, 0.12, 5.0)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in parts) * 0.5


def sub_drop(dur=2.5, f0=90, f1=24):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 2.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.9)


def crash(dur=3.5):
    t = t_axis(dur)
    return bp(noise(dur), 3500, 11000) * np.exp(-t * 2.6) * 0.35


def rev(sig):
    return sig[::-1]


# ---------------------------------------------------------------- voix off

def voice_track(path, placements, n):
    """Découpe la voix [début, fin, pose, texte] et la pose dans une piste mono de n échantillons (crête 0,7)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    src = np.frombuffer(raw, "<i2").astype(np.float64) / 32768
    voice = np.zeros(n)
    for a, b, at, _text in placements:
        seg = src[int(a * SR): int(b * SR)].copy()
        f = int(0.012 * SR)
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        i = int(at * SR)
        voice[i: i + len(seg)] += seg[: n - i]
    voice = hp(voice, 70)
    return voice * 0.7 / np.max(np.abs(voice))


def duck_envelope(voice, depth=0.6):
    """Gain à appliquer à la musique : baisse d'environ 8 dB pendant la voix (attaque 40 ms, relâche 350 ms)."""
    n = len(voice)
    env = np.abs(voice)
    smooth = np.zeros(n)
    att, rel, acc = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.35 * SR)), 0.0
    for k in range(0, n, 64):  # par blocs pour rester rapide
        peak = env[k: k + 64].max()
        acc = (att ** 64) * acc + (1 - att ** 64) * peak if peak > acc else (rel ** 64) * acc + (1 - rel ** 64) * peak
        smooth[k: k + 64] = acc
    return 1 - depth * np.clip(smooth / 0.25, 0, 1)
