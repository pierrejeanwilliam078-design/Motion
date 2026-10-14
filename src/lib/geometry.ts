export type Pt = [number, number];

/**
 * Matrice CSS matrix3d qui projette le rectangle (0,0)-(w,h) sur un quadrilatère
 * quelconque (TL, TR, BR, BL). Utilisée pour plaquer l'interface 2D sur l'écran
 * du téléphone en respectant sa perspective.
 */
export const quadMatrix3d = (w: number, h: number, q: [Pt, Pt, Pt, Pt]): string => {
	const src: Pt[] = [
		[0, 0],
		[w, 0],
		[w, h],
		[0, h],
	];
	const A: number[][] = [];
	const b: number[] = [];
	for (let i = 0; i < 4; i++) {
		const [x, y] = src[i];
		const [u, v] = q[i];
		A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
		b.push(u);
		A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
		b.push(v);
	}
	const h8 = solve(A, b);
	const [a, bb, c, d, e, f, g, hh] = h8;
	// x' = (a x + b y + c) / (g x + h y + 1)
	const m = [a, d, 0, g, bb, e, 0, hh, 0, 0, 1, 0, c, f, 0, 1];
	return `matrix3d(${m.map((n) => n.toFixed(10)).join(',')})`;
};

const solve = (A: number[][], b: number[]): number[] => {
	const n = b.length;
	const M = A.map((row, i) => [...row, b[i]]);
	for (let col = 0; col < n; col++) {
		let piv = col;
		for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
		[M[col], M[piv]] = [M[piv], M[col]];
		for (let r = 0; r < n; r++) {
			if (r === col) continue;
			const k = M[r][col] / M[col][col];
			for (let c = col; c <= n; c++) M[r][c] -= k * M[col][c];
		}
	}
	return M.map((row, i) => row[n] / row[i]);
};

/**
 * Découpe le rectangle (0,0)-(w,h) par le demi-plan { p : (p - origin)·dir <= 0 }.
 * Renvoie un polygone CSS (clip-path).
 */
export const halfPlaneClip = (w: number, h: number, origin: Pt, dir: Pt): string => {
	const poly: Pt[] = [
		[0, 0],
		[w, 0],
		[w, h],
		[0, h],
	];
	const side = (p: Pt) => (p[0] - origin[0]) * dir[0] + (p[1] - origin[1]) * dir[1];
	const out: Pt[] = [];
	for (let i = 0; i < poly.length; i++) {
		const p = poly[i];
		const q = poly[(i + 1) % poly.length];
		const sp = side(p);
		const sq = side(q);
		if (sp <= 0) out.push(p);
		if ((sp <= 0) !== (sq <= 0)) {
			const t = sp / (sp - sq);
			out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
		}
	}
	if (out.length < 3) return 'polygon(0 0, 0 0, 0 0)';
	return `polygon(${out.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
};
