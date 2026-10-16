"""
Musique de la version 2 : tropical house acoustique, 102 BPM, composée note
par note (MIDI) et jouée avec de vrais échantillons d'instruments
(banque FluidR3_GM, licence MIT) : marimba, guitare nylon, steel drum,
basse, congas, maracas…

La structure suit le montage (numéros de temps = src/v2/timeline.ts) :
  temps 0–5    intro douce (accroche)
  temps 5      entrée du rythme (« Akanin'ny Nofy »)
  temps 13     respiration sans batterie (« Imaginez… »)
  temps 17     groove complet + mélodie steel drum (expériences)
  temps 29     section prix, impact au temps 32 (« 200 000 Ar »)
  temps 41     montée (dates, « Départ de Toamasina »)
  temps 45     coupure d'un temps
  temps 46     drop (« Les places sont très limitées ! »)
  temps 56     accord final, fin à 58 temps

Le script traite aussi la voix off pour qu'elle passe au-dessus de la
musique (filtre passe-haut, présence, compression, -15 LUFS).

Prérequis : pip install mido ; fluidsynth + banque GM
(Debian/Ubuntu : apt install fluidsynth fluid-soundfont-gm) ; ffmpeg.
Usage : python3 scripts/make_music_v2.py
"""
import os
import subprocess

import mido

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "public", "audio")
TMP = os.path.join(ROOT, "out", "audio-tmp")
SOUNDFONT = os.environ.get("SOUNDFONT", "/usr/share/sounds/sf2/FluidR3_GM.sf2")

BPM = 102
TPB = 480
END_BEAT = 58

# canaux et instruments General MIDI (numéros 0-based)
PAD, MARIMBA, GUITAR, BASS, STEEL, TIMPANI, REVCYM, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {PAD: 89, MARIMBA: 12, GUITAR: 24, BASS: 33, STEEL: 114, TIMPANI: 47, REVCYM: 119}

# percussions GM
KICK, SNARE, CLAP, HAT, OPEN_HAT, CRASH = 36, 38, 39, 42, 46, 49
CONGA_HI, CONGA_LO, MARACAS, TOM_HI, TOM_MID, TOM_LO = 63, 64, 70, 50, 47, 45

CHORDS = {  # tonalité Sol majeur / Mi mineur
    "Em": {"root": 40, "notes": [64, 67, 71]},
    "C": {"root": 36, "notes": [64, 67, 72]},
    "G": {"root": 43, "notes": [62, 67, 71]},
    "D": {"root": 38, "notes": [62, 66, 69]},
}

# mélodie steel drum : (temps dans la mesure, note, durée)
MELODY = {
    "Em": [(0, 71, 0.75), (1, 67, 0.5), (1.5, 69, 0.75), (2.5, 71, 1.2)],
    "C": [(0, 76, 0.75), (1, 74, 0.5), (1.5, 71, 0.75), (2.5, 67, 1.2)],
    "G": [(0, 74, 0.5), (0.5, 71, 0.5), (1.5, 74, 0.5), (2, 76, 0.5), (2.5, 74, 1.2)],
    "D": [(0, 69, 0.75), (1, 71, 0.5), (1.5, 69, 0.75), (2.5, 66, 1.2)],
}

# mesures : (temps de début, durée en temps, accord, réglages)
BARS = [
    (0, 1, "C", {"intro": True}),  # levée
    (1, 4, "C", {"intro": True, "fill": True}),
    (5, 4, "Em", {"groove": True, "crash": True}),
    (9, 4, "C", {"groove": True, "fill": True}),
    (13, 4, "Em", {"breath": True}),  # « Imaginez… »
    (17, 4, "C", {"groove": True, "lead": True, "crash": True}),
    (21, 4, "G", {"groove": True, "lead": True}),
    (25, 4, "D", {"groove": True, "lead": True, "fill": True}),
    (29, 4, "Em", {"groove": True, "crash": True, "hit": 3}),  # impact sur le prix (temps 32)
    (33, 4, "C", {"groove": True}),
    (37, 4, "G", {"groove": True, "fill": True}),
    (41, 4, "D", {"build": True}),  # dates
    (45, 1, None, {"break": True}),  # coupure
    (46, 4, "Em", {"groove": True, "lead": True, "crash": True, "drop": True}),
    (50, 4, "C", {"groove": True, "lead": True, "drop": True}),
    (54, 4, "G", {"outro": True}),
]


class Track:
    def __init__(self):
        self.events = []  # (tick, ordre, message)

    def note(self, ch, beat, pitch, dur, vel):
        on = int(round(beat * TPB))
        off = int(round((beat + dur) * TPB))
        self.events.append((on, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=max(1, min(127, int(vel))))))
        self.events.append((off, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))

    def to_midi(self, path):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
        for ch, prog in PROGRAMS.items():
            tr.append(mido.Message("program_change", channel=ch, program=prog))
        # réverbe (CC91) et chorus (CC93) modérés, volumes de mixage (CC7)
        mix = {PAD: 70, MARIMBA: 92, GUITAR: 88, BASS: 105, STEEL: 82, TIMPANI: 100, REVCYM: 70, DRUMS: 100}
        for ch, vol in mix.items():
            tr.append(mido.Message("control_change", channel=ch, control=7, value=vol))
            tr.append(mido.Message("control_change", channel=ch, control=91, value=50 if ch != BASS else 15))
            tr.append(mido.Message("control_change", channel=ch, control=93, value=20))
        last = 0
        for tick, _, msg in sorted(self.events, key=lambda e: (e[0], e[1])):
            tr.append(msg.copy(time=tick - last))
            last = tick
        tr.append(mido.MetaMessage("end_of_track", time=TPB * 2))
        mid.save(path)


def compose():
    t = Track()
    for start, length, chord_name, o in BARS:
        if o.get("break"):
            continue
        chord = CHORDS[chord_name]
        notes, root = chord["notes"], chord["root"]
        full = o.get("groove") or o.get("drop")

        # nappe
        pad_len = length if not o.get("outro") else 4
        for n in notes:
            t.note(PAD, start, n - 12, pad_len, 42 if o.get("intro") or o.get("breath") else 50)

        # marimba : arpège en croches
        arp = [notes[0], notes[1], notes[2], notes[1] + 12, notes[2], notes[1], notes[0] + 12, notes[2]]
        steps = int(length * 2) if not o.get("outro") else 4
        for i in range(steps):
            vel = 58 + (12 if i % 2 == 0 else 0) + (10 if o.get("drop") else 0)
            if o.get("intro"):
                vel -= 12
            t.note(MARIMBA, start + i * 0.5, arp[i % 8], 0.45, vel)

        if o.get("outro"):
            # deux temps de groove puis accord final au temps 56
            for b in range(2):
                t.note(DRUMS, start + b, KICK, 0.2, 100)
                t.note(DRUMS, start + b + 0.5, HAT, 0.1, 60)
                t.note(BASS, start + b, root, 0.4, 95)
            t.note(DRUMS, start + 2, CRASH, 2, 100)
            t.note(DRUMS, start + 2, KICK, 0.3, 110)
            t.note(BASS, start + 2, root, 2, 100)
            t.note(TIMPANI, start + 2, root, 2, 90)
            for n in notes + [notes[0] + 12]:
                t.note(GUITAR, start + 2, n - 12, 2, 85)
                t.note(STEEL, start + 2, n, 1.5, 75)
            continue

        if o.get("crash"):
            t.note(DRUMS, start, CRASH, 2, 100 if o.get("drop") else 85)

        if full:
            for b in range(length):
                beat = start + b
                t.note(DRUMS, beat, KICK, 0.2, 108 if b == 0 else 98)
                if b % 2 == 1:
                    t.note(DRUMS, beat, CLAP, 0.2, 88)
                t.note(DRUMS, beat + 0.5, OPEN_HAT if o.get("drop") and b % 2 else HAT, 0.15, 70)
                for s in range(4):
                    t.note(DRUMS, beat + s * 0.25, MARACAS, 0.1, 62 if s % 2 else 40)
                # congas tropicales
                if b % 2 == 0:
                    t.note(DRUMS, beat + 0.75, CONGA_LO, 0.2, 80)
                else:
                    t.note(DRUMS, beat + 0.5, CONGA_HI, 0.2, 76)
                    t.note(DRUMS, beat + 0.75, CONGA_HI, 0.2, 64)
                # guitare : accords en contretemps
                for n in notes:
                    t.note(GUITAR, beat + 0.5, n - 12, 0.3, 70)
            # basse : fondamentale, octave en syncope, quinte
            for b in range(0, length, 2):
                beat = start + b
                for off, p, v in ((0, root, 100), (0.75, root + 12, 80), (1, root, 92), (1.5, root + 7, 85)):
                    t.note(BASS, beat + off, p, 0.4, v)

        if o.get("breath"):
            for b in range(length):
                t.note(DRUMS, start + b, MARACAS, 0.1, 35)
                t.note(DRUMS, start + b + 0.5, MARACAS, 0.1, 30)
            t.note(BASS, start, root, 3.5, 70)

        if o.get("intro"):
            for b in range(length):
                t.note(DRUMS, start + b + 0.5, MARACAS, 0.1, 30)

        if o.get("lead"):
            for off, p, d in MELODY[chord_name]:
                t.note(STEEL, start + off, p, d, 82 if o.get("drop") else 64)

        if "hit" in o:
            h = start + o["hit"]
            t.note(TIMPANI, h, 40, 1.5, 110)
            t.note(DRUMS, h, CRASH, 2, 100)
            t.note(DRUMS, h, KICK, 0.3, 115)

        if o.get("fill"):
            end = start + length
            for i, p in enumerate([TOM_HI, TOM_HI, TOM_MID, TOM_LO]):
                t.note(DRUMS, end - 1 + i * 0.25, p, 0.2, 70 + i * 8)

        if o.get("build"):
            # montée : basse tenue, caisse claire qui accélère, cymbale inversée
            t.note(BASS, start, root, 4, 85)
            t.note(TIMPANI, start, root, 1.5, 70)
            beat = start
            while beat < start + length - 0.01:
                prog = (beat - start) / length
                t.note(DRUMS, beat, SNARE, 0.1, 40 + 70 * prog)
                beat += 0.5 if prog < 0.5 else 0.25 if prog < 0.85 else 0.125
            t.note(REVCYM, start + length - 2.6, 60, 2.6, 100)

    # cymbale inversée avant l'entrée du rythme
    t.note(REVCYM, 5 - 2.4, 60, 2.4, 80)
    return t


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    os.makedirs(TMP, exist_ok=True)
    mid = os.path.join(TMP, "musique-v2.mid")
    wav = os.path.join(TMP, "musique-v2.wav")
    compose().to_midi(mid)
    run(["fluidsynth", "-ni", "-g", "0.7", "-r", "44100", "-F", wav, SOUNDFONT, mid])
    end_s = END_BEAT * 60 / BPM
    run([
        "ffmpeg", "-y", "-i", wav,
        "-af", f"atrim=0:{end_s:.3f},afade=t=out:st={end_s - 0.6:.3f}:d=0.6,highpass=f=35,"
        "acompressor=threshold=-18dB:ratio=2.5:attack=10:release=150,loudnorm=I=-16:TP=-1.5:LRA=8",
        "-ar", "44100", "-b:a", "192k",
        os.path.join(AUDIO, "musique-v2.mp3"),
    ])
    # voix off adaptée au mixage : nettoyage des graves, présence, compression
    run([
        "ffmpeg", "-y", "-i", os.path.join(AUDIO, "voix-off-originale.mp3"),
        "-af", "highpass=f=90,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=3,"
        "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,loudnorm=I=-15:TP=-1.5:LRA=6",
        "-ar", "44100", "-b:a", "192k",
        os.path.join(AUDIO, "voix-off-v2.mp3"),
    ])
    print("Musique et voix V2 générées dans", AUDIO)


if __name__ == "__main__":
    main()
