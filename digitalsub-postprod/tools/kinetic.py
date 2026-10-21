"""Shared 2D kinetic-typography building blocks (word reveals, colour blocks, Reels-style chunks)."""
import mg
from mg import CYAN, W, WHITE, inout3, out3, out5, out_back, prog, rrect, text, text_width

BRANDS = {"DigitalSub"}  # never re-cased


def fit(s, weight, size, maxw):
    while size > 20 and text_width(s, weight, size) > maxw:
        size -= 2
    return size


def pop_in(t, ts, dur=0.24):
    p = prog(t, ts - 0.04, dur)
    return out3(p), 0.84 + 0.16 * out_back(p), (1 - out3(p)) * 14


# ------------------------------------------------------------------ face cam


def box_word(cv, t, s, weight, size, x, base, t0, box_col, txt_col, alpha=1.0, pad=(22, 16)):
    """Word on a colour block: the block wipes in, then the word is revealed."""
    w = text_width(s, weight, size)
    f = mg.font(weight, size)
    asc, desc = f.getmetrics()
    cap = asc * 0.78
    bp = out5(prog(t, t0 - 0.06, 0.32))
    if bp <= 0:
        return w
    bw = (w + 2 * pad[0]) * bp
    rrect(cv, x - pad[0], base - cap - pad[1], bw, cap + 2 * pad[1], 10, box_col, alpha)
    text(cv, s, weight, size, txt_col, x, base, alpha * out3(prog(t, t0, 0.2)), reveal=out3(prog(t, t0, 0.3)))
    return w


def rise_word(cv, t, s, weight, size, color, x, base, t0, alpha=1.0, anchor="l", tracking=0.0):
    """Word that slides up through an invisible mask line (cinematic reveal)."""
    p = prog(t, t0 - 0.05, 0.38)
    if p <= 0:
        return
    e = out5(p)
    text(cv, s, weight, size, color, x, base + (1 - e) * size * 0.5, alpha * out3(p), anchor=anchor,
         reveal=e, reveal_dir="y", tracking=tracking * (1 - e))


def chunk(cv, t, toks, t_end, base=1405, keys=(), key_col=CYAN):
    """Reels-style subtitle chunk: 1–3 words that pop in as they are spoken."""
    t0 = toks[0][1] - 0.06
    if not (t0 <= t <= t_end + 0.12):
        return
    out = inout3(prog(t, t_end, 0.12))
    a = 1 - out
    parts = []
    for w, s, _ in toks:
        k = w.strip(",.?").lower() in keys
        wt, sz = ("anton", 96) if k else ("xbold", 74)
        parts.append((w.upper() if k and w not in BRANDS else w, s, wt, sz, key_col if k else WHITE))
    sp = 22
    total = sum(text_width(p[0], p[2], p[3]) for p in parts) + sp * (len(parts) - 1)
    x = W / 2 - total / 2
    for s_, ts, wt, sz, col in parts:
        e, sc, dy = pop_in(t, ts)
        ww = text_width(s_, wt, sz)
        text(cv, s_, wt, sz, col, x + ww / 2, base + dy - 8 * out, a * e, anchor="c", scale=sc)
        x += ww + sp


def chunks(cv, t, spec, base=1405):
    """spec: list of (text, near, keywords); each chunk lasts until the next starts."""
    for i, (toks, keys) in enumerate(spec):
        nxt = spec[i + 1][0][0][1] - 0.06 if i + 1 < len(spec) else toks[-1][2] + 0.25
        chunk(cv, t, toks, nxt, base, keys)
