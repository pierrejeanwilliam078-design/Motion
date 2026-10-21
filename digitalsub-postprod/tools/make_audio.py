"""Original, fully synthesized music bed, SFX and DigitalSub sound logo.

Everything is generated from oscillators and noise, so the result is free of
third-party rights and cleared for commercial use.
Outputs 48 kHz / 24-bit stereo WAV stems: music.wav, sfx.wav and logo.wav.
"""
import sys
import wave

import numpy as np

SR = 48000
TOTAL = 44.2
N = int(TOTAL * SR)
rng = np.random.default_rng(2024)

BEAT = 60 / 96
CARD = 40.85  # end card starts (dissolve)
LOGO_HIT = 41.20  # logo reveal


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def stereo():
    return np.zeros((N, 2), np.float32)


def place(buf, sig, t, gain=1.0, pan=0.0):
    """Mix a mono (n,) or stereo (n,2) signal at time t with constant-power pan."""
    i = int(round(t * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    j = min(N, i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x)).astype(np.float32)


def reverb(x, decay=2.2, tau=0.5, wet=0.25, hi=7000, predelay=0.018):
    n_ir = int(decay * SR)
    t = np.arange(n_ir) / SR
    out = np.empty_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n_ir).astype(np.float32) * np.exp(-t / tau)
        ir = fft_filter(ir, lo=180, hi=hi)
        ir = np.concatenate([np.zeros(int(predelay * SR), np.float32), ir])
        ir /= np.sqrt((ir ** 2).sum())
        L = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, ch] = x[:, ch] + wet * y
    return out


# ---------------------------------------------------------------- music bed
CHORDS = {  # pad voicing, bass note
    "D": ([50, 57, 61, 64, 66], 38),   # Dmaj9
    "Bm": ([54, 57, 62, 64, 66], 35),  # Bm7(11)
    "G": ([55, 59, 62, 66, 69], 43),   # Gmaj9
    "A": ([57, 62, 64, 66, 69], 45),   # A6sus4
}
PROG = ["A"] + ["D", "Bm", "G", "A"] * 2 + ["D"]  # lands on D under the logo
CHORD_LEN = 8 * BEAT  # 5 s
FIRST = CARD - (len(PROG) - 1) * CHORD_LEN  # chord grid aligned on the end card


def pad_note(f, dur, attack=1.2, release=1.6):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / attack, 1) * np.clip((dur + release - t) / release, 0, 1) ** 1.5
    out = np.zeros((n, 2), np.float32)
    for det, pan in ((-7, -0.7), (0, 0.0), (7, 0.7)):
        fd = f * 2 ** (det / 1200)
        ph = rng.uniform(0, 2 * np.pi)
        v = sum(np.sin(2 * np.pi * fd * k * t + ph * k) * (np.exp(-k / 2.4) / k) for k in range(1, 9))
        a = (pan + 1) * np.pi / 4
        out[:, 0] += v * env * np.cos(a)
        out[:, 1] += v * env * np.sin(a)
    return out


def pluck(f, dur=0.9, tau=0.22):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(t / 0.004, 1) * np.exp(-t / tau)
    return (np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.08)
            + 0.1 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.05)) * env


def bass_note(f, dur):
    t = np.arange(int((dur + 0.4) * SR)) / SR
    env = np.minimum(t / 0.03, 1) * np.clip((dur + 0.4 - t) / 0.4, 0, 1) * (0.75 + 0.25 * np.exp(-t / 0.5))
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * env


def hat():
    n = int(0.05 * SR)
    x = rng.standard_normal(n).astype(np.float32)
    x = x - np.convolve(x, np.ones(6) / 6, "same")
    return x * np.exp(-np.arange(n) / SR / 0.012)


def music():
    pads, plk, low, hats = stereo(), stereo(), stereo(), stereo()
    pattern = [0, 2, 1, 3, 2, 4, 1, 3]
    for ci, name in enumerate(PROG):
        notes, bass = CHORDS[name]
        t0 = FIRST + ci * CHORD_LEN
        last = ci == len(PROG) - 1
        dur = 1.6 if last else CHORD_LEN
        for m in notes:
            sig = pad_note(midi(m), dur, release=2.4 if last else 1.6)
            s = max(t0, 0)
            sig = sig[int((s - t0) * SR):]
            place(pads, sig, s, 0.035)
        if t0 >= 0 and not last:
            place(low, bass_note(midi(bass), BEAT * 3.5), t0, 0.22)
            place(low, bass_note(midi(bass), BEAT * 3.5), t0 + 4 * BEAT, 0.18)
        if last:
            continue
        for k in range(16):  # eighth-note arpeggio
            t = t0 + k * BEAT / 2
            if t < 0.85 or t >= CARD:
                continue
            if rng.random() < 0.12:
                continue
            m = notes[pattern[k % 8]] + 12
            vel = (0.85 if k % 2 == 0 else 0.6) * rng.uniform(0.85, 1.0) * min(1, (t + 0.5) / 4)
            place(plk, pluck(midi(m)), t, 0.05 * vel, pan=rng.uniform(-0.35, 0.35))
            if k % 2 == 1 and 5.8 < t < CARD - 0.1:
                place(hats, hat(), t, 0.018 * rng.uniform(0.8, 1.0), pan=0.25)
    # ping-pong dotted-eighth delay on the plucks
    d = int(0.75 * BEAT * SR)
    echo = np.zeros_like(plk)
    echo[d:, 1] += plk[:-d, 0] * 0.32
    echo[2 * d:, 0] += plk[:-2 * d, 0] * 0.16
    echo[3 * d:, 1] += plk[:-3 * d, 0] * 0.08
    mix = pads + plk + echo + low + hats
    mix = reverb(mix, decay=2.6, tau=0.6, wet=0.35)
    # gentle fade-in under the first words
    mix *= np.minimum(np.arange(N) / SR / 1.0, 1)[:, None]
    return mix


# ---------------------------------------------------------------------- SFX
def sweep_noise(dur, f0, f1, bw=0.6, shape=0.65, block=1024):
    """Band-passed noise whose centre glides f0 -> f1 (overlap-add STFT)."""
    n = int(dur * SR)
    hop = block // 2
    win = np.hanning(block).astype(np.float32)
    x = rng.standard_normal(n + block).astype(np.float32)
    y = np.zeros(n + block, np.float32)
    f = np.fft.rfftfreq(block, 1 / SR)
    for i in range(0, n, hop):
        p = i / n
        fc = f0 * (f1 / f0) ** p
        g = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / bw) ** 2)
        y[i:i + block] += np.fft.irfft(np.fft.rfft(x[i:i + block] * win) * g, block) * win
    y = y[:n]
    t = np.arange(n) / n
    env = np.where(t < shape, (t / shape) ** 2, ((1 - t) / (1 - shape)) ** 1.5)
    return y / (np.abs(y).max() + 1e-9) * env


def whoosh(dur=0.6, f0=300, f1=2600, pan=(-0.6, 0.6)):
    w = sweep_noise(dur, f0, f1)
    n = len(w)
    p = np.linspace(pan[0], pan[1], n)
    a = (p + 1) * np.pi / 4
    return np.stack([w * np.cos(a), w * np.sin(a)], 1) * np.sqrt(2)


def soft_impact():
    t = np.arange(int(1.0 * SR)) / SR
    f = 42 + 30 * np.exp(-t / 0.06)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.003, 1) * np.exp(-t / 0.32)
    click = fft_filter(rng.standard_normal(len(t)).astype(np.float32), hi=2500) * np.exp(-t / 0.008) * 0.25
    air = fft_filter(rng.standard_normal(len(t)).astype(np.float32), lo=250, hi=1400) * np.exp(-t / 0.25) * 0.08
    return body + click + air


def digital_swipe(dur=0.24):
    w = sweep_noise(dur, 2500, 8500, bw=0.35, shape=0.4)
    t = np.arange(len(w)) / SR
    gate = 0.55 + 0.45 * (np.sin(2 * np.pi * 46 * t) > 0)
    chirp = np.sin(2 * np.pi * np.cumsum(1700 * 2 ** (t / dur)) / SR) * np.exp(-t / 0.07) * 0.18
    return w * gate + chirp


def sparkle(count=5, spread=0.03):
    out = np.zeros(int(0.6 * SR), np.float32)
    for k in range(count):
        f = rng.uniform(3200, 6800)
        t = np.arange(int(0.4 * SR)) / SR
        ping = np.sin(2 * np.pi * f * t) * np.minimum(t / 0.002, 1) * np.exp(-t / 0.09) * (0.8 ** k)
        i = int(k * spread * SR)
        out[i:i + len(ping)] += ping
    return out


def fm_bell(f, dur=2.6, ratio=2.0, index=1.6):
    t = np.arange(int(dur * SR)) / SR
    mod = index * np.exp(-t / 0.35) * np.sin(2 * np.pi * f * ratio * t)
    return np.sin(2 * np.pi * f * t + mod) * np.minimum(t / 0.002, 1) * np.exp(-t / 1.1)


def sound_logo():
    """Rising air swell into an arpeggiated Dmaj9 bell + warm bed + sub."""
    out = stereo()[: int(3.4 * SR)]
    pre = 0.40
    swell = sweep_noise(pre, 900, 5200, bw=0.8, shape=0.97)
    place_local(out, np.stack([swell, swell[::-1] * 0.4 + swell * 0.6], 1), 0, 0.22)
    for k, (m, pan) in enumerate(((74, -0.25), (78, 0.2), (81, -0.1), (88, 0.3))):
        place_local(out, fm_bell(midi(m)), pre + k * 0.045, 0.16 * (0.9 ** k), pan)
    t = np.arange(int(2.6 * SR)) / SR
    warm = sum(np.sin(2 * np.pi * midi(m) * t) for m in (62, 69)) * np.minimum(t / 0.03, 1) * np.exp(-t / 0.9)
    place_local(out, warm, pre, 0.06)
    sub = np.sin(2 * np.pi * midi(38) * t) * np.minimum(t / 0.004, 1) * np.exp(-t / 0.45)
    place_local(out, sub, pre, 0.30)
    return out, pre


def place_local(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def sfx():
    out = stereo()
    place(out, digital_swipe(), 0.02, 0.05, pan=0.2)                 # first subtitle
    place(out, whoosh(0.70, 250, 2200), 5.10, 0.085)                  # punch-in, list
    place(out, whoosh(0.45, 400, 3000, (0.5, -0.5)), 13.45, 0.075)    # punch-in
    place(out, soft_impact(), 13.86, 0.32)                             # "Mais ... pas magique"
    place(out, whoosh(0.50, 2200, 350, (-0.4, 0.4)), 15.95, 0.05)     # ease out
    place(out, whoosh(0.70, 300, 2400, (0.6, -0.6)), 24.80, 0.07)     # new idea
    place(out, whoosh(0.55, 300, 2600), 31.75, 0.06)                  # push to DigitalSub
    place(out, sparkle(), 32.36, 0.035, pan=-0.2)                      # "DigitalSub" highlight
    place(out, digital_swipe(0.28), 37.32, 0.07, pan=-0.3)            # CTA panel in
    place(out, sparkle(4, 0.025), 37.90, 0.03, pan=0.3)                # « ChatGPT »
    place(out, whoosh(0.75, 250, 3200), 40.45, 0.07)                  # into the end card
    place(out, sparkle(3, 0.04), 42.42, 0.022, pan=0.25)               # light sweep
    bed = fft_filter(rng.standard_normal(int(3.3 * SR)).astype(np.float32), lo=3000, hi=11000)
    tb = np.arange(len(bed)) / SR
    place(out, bed * np.minimum(tb / 0.8, 1) * np.clip((3.3 - tb) / 1.0, 0, 1), CARD, 0.012)  # air texture
    return reverb(out, decay=2.4, tau=0.55, wet=0.28, hi=9000)


def logo_stem():
    """Sound logo on its own stem so the mix can set its level independently."""
    out = stereo()
    logo, pre = sound_logo()
    place(out, logo, LOGO_HIT - pre)
    return reverb(out, decay=3.0, tau=0.7, wet=0.35, hi=9000)


def write_wav(path, x, peak_db=-3.0, fixed=False):
    """Peak-normalise (music) or keep absolute level (SFX stems, mixed by ear)."""
    if not fixed:
        x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    assert np.abs(x).max() < 1.0, "stem would clip"
    x = x + (rng.random(x.shape) - rng.random(x.shape)) / 2 ** 23  # TPDF dither
    i = np.clip(np.round(x * (2 ** 23 - 1)), -2 ** 23, 2 ** 23 - 1).astype("<i4")
    b = i.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


if __name__ == "__main__":
    out_dir = sys.argv[1]
    write_wav(f"{out_dir}/music.wav", music())
    write_wav(f"{out_dir}/sfx.wav", sfx(), fixed=True)
    write_wav(f"{out_dir}/logo.wav", logo_stem(), fixed=True)
    print("audio stems written")
