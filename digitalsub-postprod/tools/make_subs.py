"""Generate the DigitalSub ASS subtitle / kinetic-typography track.

Cue text is the verbatim transcript (transcript/words.json, Whisper word
timestamps). Highlighted keywords switch from white to a brand accent at the
moment they are spoken.
"""
import sys

W, H = 1082, 1920
SUB_Y = 1395  # bottom of the subtitle block, above social-network UI zones

WHITE = "&H00FFFFFF&"
CYAN = "&H00F5E346&"    # #46E3F5
VIOLET = "&H00FA8BA7&"  # #A78BFA

# (start, end, text, [(keyword, spoken_start, spoken_end, colour), ...])
CUES = [
    (0.00, 2.34, "Tu utilises ChatGPT\\Ngratuitement ?",
     [("gratuitement ?", 1.20, 1.86, CYAN)]),
    (2.34, 5.10, "Le payant n'est intéressant\\Nque s'il te fait gagner plus.",
     [("payant", 2.60, 2.90, VIOLET), ("gagner plus.", 4.38, 4.86, CYAN)]),
    (5.70, 7.62, "ChatGPT peut t'aider\\Nà rédiger,",
     [("rédiger,", 6.92, 7.42, CYAN)]),
    (7.62, 10.75, "structurer des idées,\\Nanalyser des informations,",
     [("structurer", 7.74, 8.34, CYAN), ("analyser", 9.20, 9.74, CYAN)]),
    (10.90, 13.60, "préparer un plan\\Nou accélérer certaines tâches.",
     [("préparer", 11.00, 11.38, CYAN), ("accélérer", 12.06, 12.48, CYAN)]),
    (13.78, 16.25, "Mais un abonnement payant\\Nn'est pas magique.",
     [("payant", 14.64, 15.04, VIOLET), ("pas magique.", 15.26, 15.92, CYAN)]),
    (16.30, 18.40, "il devient intéressant\\Nquand tu utilises déjà",
     [("intéressant", 16.82, 17.36, CYAN)]),
    (18.40, 20.05, "l'outil régulièrement",
     [("régulièrement", 18.88, 19.52, CYAN)]),
    (20.05, 21.62, "et que les capacités\\Nsupplémentaires",
     [("capacités", 20.38, 20.92, VIOLET), ("supplémentaires", 20.92, 21.66, VIOLET)]),
    (21.62, 22.98, "disponibles dans la formule", []),
    (22.98, 25.15, "répondent à un vrai besoin.",
     [("vrai besoin.", 24.06, 24.68, CYAN)]),
    (25.40, 28.00, "Un entrepreneur qui travaille\\Navec l'IA chaque jour",
     [("entrepreneur", 25.68, 26.02, VIOLET), ("chaque jour", 27.32, 28.00, CYAN)]),
    (28.00, 29.72, "n'a pas la même utilisation", []),
    (29.72, 32.10, "qu'une personne qui pose\\Ndeux questions par mois.",
     [("deux questions par mois.", 30.70, 31.66, VIOLET)]),
    (32.26, 34.64, "DigitalSub peut t'aider\\Nà comparer",
     [("DigitalSub", 32.34, 33.26, CYAN), ("comparer", 34.24, 34.68, CYAN)]),
    (34.64, 37.32, "les options disponibles\\Navant de décider.",
     [("avant de décider.", 35.84, 36.84, VIOLET)]),
]

# Call to action: "Écris ChatGPT si tu veux connaître l'offre disponible."
CTA_START, CTA_END = 37.40, 40.95
CTA_LINE1 = [("Écris", 37.46), ("« ChatGPT »", 37.90)]
CTA_LINE2 = [("si", 38.70), ("tu", 39.22), ("veux", 39.34), ("connaître", 39.48),
             ("l'offre", 39.88), ("disponible.", 40.26)]


def ts(t):
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def ms(t):
    return max(0, int(round(t * 1000)))


def cue_event(start, end, text, keys):
    body = text
    for word, ws, we, col in keys:
        a = ms(ws - start - 0.04)
        b = ms(min(we, ws + 0.30) - start)
        bold, unbold = ("\\fnInter Display\\b1", "\\fnInter Display SemiBold\\b0") if word == "DigitalSub" else ("", "")
        # restore white explicitly ({\r} would also drop the halo blur)
        tagged = f"{{{bold}\\1c{WHITE}\\t({a},{b},\\1c{col})}}{word}{{\\1c{WHITE}{unbold}}}"
        assert word in body, word
        body = body.replace(word, tagged, 1)
    x, y = W // 2, SUB_Y
    # with an outline, libass blurs only the outline: a soft dark halo
    head = f"{{\\an2\\fad(170,110)\\move({x},{y + 18},{x},{y},0,260)\\blur9}}"
    return f"Dialogue: 1,{ts(start)},{ts(end)},Sub,,0,0,0,,{head}{body}"


def reveal_words(words, start, dur=0.22, extra=""):
    parts = []
    for w, t in words:
        a = ms(t - start - 0.03)
        parts.append(f"{{\\alpha&HFF&\\blur4\\t({a},{a + ms(dur)},\\alpha&H00&\\blur0.4){extra}}}{w}")
    return " ".join(parts)


def cta_events():
    s, e = CTA_START, CTA_END
    l1 = (f"{{\\an5\\pos({W // 2},1263)\\fad(0,240)}}"
          + reveal_words(CTA_LINE1[:1], s)
          + " " + reveal_words(CTA_LINE1[1:], s, 0.28, f"\\1c{CYAN}"))
    l2 = f"{{\\an5\\pos({W // 2},1352)\\fad(0,240)}}" + reveal_words(CTA_LINE2, s, 0.20)
    return [f"Dialogue: 2,{ts(s)},{ts(e)},CtaTitle,,0,0,0,,{l1}",
            f"Dialogue: 2,{ts(s)},{ts(e)},CtaBody,,0,0,0,,{l2}"]


HEADER = f"""[Script Info]
Title: DigitalSub subtitles
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter Display SemiBold,62,&H00FFFFFF,&H00FFFFFF,&H80140A06,&HFF000000,0,0,0,0,100,100,0.6,0,1,6,0,2,90,90,0,1
Style: CtaTitle,Inter Display,84,&H00FFFFFF,&H00FFFFFF,&HC0140A06,&HFF000000,-1,0,0,0,100,100,0.4,0,1,0,0,5,60,60,0,1
Style: CtaBody,Inter Display Medium,46,&H10FFFFFF,&H10FFFFFF,&HC0140A06,&HFF000000,0,0,0,0,100,100,0.6,0,1,0,0,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def main(out):
    lines = [HEADER.rstrip("\n")]
    lines += [cue_event(*c) for c in CUES]
    lines += cta_events()
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main(sys.argv[1])
