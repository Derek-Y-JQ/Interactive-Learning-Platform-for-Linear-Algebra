export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Mat2 = [[number, number], [number, number]];
export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '0';
  const cleaned = Math.abs(n) < 1e-9 ? 0 : n;
  if (Math.abs(cleaned - Math.round(cleaned)) < 1e-6) {
    return String(Math.round(cleaned));
  }
  return cleaned.toFixed(digits).replace(/\.?0+$/, '');
}

export function dot2(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function norm2(a: Vec2): number {
  return Math.hypot(a[0], a[1]);
}

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function norm3(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function det2(m: Mat2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

export function mulMat2Vec(m: Mat2, v: Vec2): Vec2 {
  return [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
}

export function mulMat2(a: Mat2, b: Mat2): Mat2 {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

export function invMat2(m: Mat2): Mat2 | null {
  const d = det2(m);
  if (Math.abs(d) < 1e-8) return null;
  return [
    [m[1][1] / d, -m[0][1] / d],
    [-m[1][0] / d, m[0][0] / d],
  ];
}

export function det3(m: Mat3): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

/** Analytical 2x2 SVD: A = U * diag(s1, s2) * V^T */
export interface Svd2Result {
  U: Mat2;
  S: [number, number];
  Vt: Mat2;
  thetaV: number; // rotation angle of V^T
  thetaU: number; // rotation angle of U
  reflectU: boolean;
}

export function svd2(A: Mat2): Svd2Result {
  const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
  // A^T A is 2x2 symmetric: [[p, q], [q, r]]
  const p = a * a + c * c;
  const q = a * b + c * d;
  const r = b * b + d * d;

  // Eigenangle of A^T A
  const phi = 0.5 * Math.atan2(2 * q, p - r);
  const c1 = Math.cos(phi);
  const s1 = Math.sin(phi);

  // V columns are v1 = [c1, s1], v2 = [-s1, c1]
  // Check singular values
  let av1: Vec2 = [a * c1 + b * s1, c * c1 + d * s1];
  let av2: Vec2 = [-a * s1 + b * c1, -c * s1 + d * c1];
  let sig1 = norm2(av1);
  let sig2 = norm2(av2);

  let v1: Vec2 = [c1, s1];
  let v2: Vec2 = [-s1, c1];
  if (sig2 > sig1) {
    [sig1, sig2] = [sig2, sig1];
    [av1, av2] = [av2, av1];
    [v1, v2] = [v2, v1];
  }

  // Ensure det(V) = +1 so V^T is a pure rotation
  if (v1[0] * v2[1] - v1[1] * v2[0] < 0) {
    v2 = [-v2[0], -v2[1]];
    av2 = [-av2[0], -av2[1]];
  }

  let u1: Vec2 = sig1 > 1e-9 ? [av1[0] / sig1, av1[1] / sig1] : [1, 0];
  let u2: Vec2;
  if (sig2 > 1e-9) {
    u2 = [av2[0] / sig2, av2[1] / sig2];
  } else {
    u2 = [-u1[1], u1[0]];
  }

  const detU = u1[0] * u2[1] - u1[1] * u2[0];
  const reflectU = detU < 0;

  const U: Mat2 = [
    [u1[0], u2[0]],
    [u1[1], u2[1]],
  ];
  const Vt: Mat2 = [
    [v1[0], v1[1]],
    [v2[0], v2[1]],
  ];

  // Angle of Vt (which rotates v1 -> e1): atan2(Vt[1][0], Vt[0][0])
  const thetaV = Math.atan2(Vt[1][0], Vt[0][0]);
  const thetaU = Math.atan2(u1[1], u1[0]);

  return { U, S: [sig1, sig2], Vt, thetaV, thetaU, reflectU };
}

/** 2x2 eigenvalues (real or complex conjugate) */
export interface Eigen2Result {
  isReal: boolean;
  values: { re: number; im: number }[];
  vectors: Vec2[]; // real unit eigenvectors if real
}

export function eigen2(A: Mat2): Eigen2Result {
  const tr = A[0][0] + A[1][1];
  const dt = det2(A);
  const disc = tr * tr - 4 * dt;
  if (disc < -1e-9) {
    const im = Math.sqrt(-disc) / 2;
    return {
      isReal: false,
      values: [
        { re: tr / 2, im },
        { re: tr / 2, im: -im },
      ],
      vectors: [],
    };
  }
  const sd = Math.sqrt(Math.max(0, disc));
  const l1 = (tr + sd) / 2;
  const l2 = (tr - sd) / 2;

  const findVec = (lam: number): Vec2 | null => {
    const r1: Vec2 = [A[0][0] - lam, A[0][1]];
    const r2: Vec2 = [A[1][0], A[1][1] - lam];
    const row = norm2(r1) >= norm2(r2) ? r1 : r2;
    if (norm2(row) < 1e-8) return null; // scalar matrix
    const v: Vec2 = [-row[1], row[0]];
    const n = norm2(v);
    return [v[0] / n, v[1] / n];
  };

  if (Math.abs(l1 - l2) < 1e-6) {
    const v = findVec(l1);
    if (!v) {
      return {
        isReal: true,
        values: [{ re: l1, im: 0 }, { re: l2, im: 0 }],
        vectors: [[1, 0], [0, 1]],
      };
    }
    return {
      isReal: true,
      values: [{ re: l1, im: 0 }, { re: l2, im: 0 }],
      vectors: [v], // defective (Jordan block)
    };
  }

  const v1 = findVec(l1) ?? [1, 0];
  const v2 = findVec(l2) ?? [0, 1];
  return {
    isReal: true,
    values: [{ re: l1, im: 0 }, { re: l2, im: 0 }],
    vectors: [v1, v2],
  };
}

/** General m x n RREF */
export interface RrefResult {
  rref: number[][];
  pivots: number[];
  rank: number;
}

export function computeRref(matrix: number[][], eps = 1e-8): RrefResult {
  const m = matrix.length;
  const n = matrix[0]?.length ?? 0;
  const A = matrix.map((row) => [...row]);
  const pivots: number[] = [];
  let r = 0;

  for (let c = 0; c < n && r < m; c++) {
    let pivotRow = r;
    let maxVal = Math.abs(A[r][c]);
    for (let i = r + 1; i < m; i++) {
      if (Math.abs(A[i][c]) > maxVal) {
        maxVal = Math.abs(A[i][c]);
        pivotRow = i;
      }
    }
    if (maxVal < eps) continue;
    [A[r], A[pivotRow]] = [A[pivotRow], A[r]];
    const pv = A[r][c];
    for (let j = c; j < n; j++) A[r][j] /= pv;
    for (let i = 0; i < m; i++) {
      if (i !== r && Math.abs(A[i][c]) > eps) {
        const f = A[i][c];
        for (let j = c; j < n; j++) A[i][j] -= f * A[r][j];
      }
    }
    pivots.push(c);
    r++;
  }
  // Clean near-zero entries
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(A[i][j]) < eps) A[i][j] = 0;
    }
  }
  return { rref: A, pivots, rank: pivots.length };
}

/** Nullspace basis from RREF */
export function nullspaceBasis(matrix: number[][]): number[][] {
  const n = matrix[0]?.length ?? 0;
  const { rref, pivots } = computeRref(matrix);
  const pivotSet = new Set(pivots);
  const freeCols: number[] = [];
  for (let j = 0; j < n; j++) {
    if (!pivotSet.has(j)) freeCols.push(j);
  }
  return freeCols.map((fc) => {
    const v = new Array(n).fill(0);
    v[fc] = 1;
    pivots.forEach((pc, rowIdx) => {
      v[pc] = -rref[rowIdx][fc];
    });
    return v;
  });
}

export function transpose(matrix: number[][]): number[][] {
  const m = matrix.length;
  const n = matrix[0]?.length ?? 0;
  const res: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) res[j][i] = matrix[i][j];
  }
  return res;
}

/** Complex eigenvalues of a 3x3 real matrix via companion/QR or Cardano + Newton */
export function eigen3Complex(A: Mat3): { re: number; im: number }[] {
  // Characteristic polynomial: -lam^3 + c2*lam^2 + c1*lam + c0 = 0
  // => lam^3 + a*lam^2 + b*lam + c = 0
  const tr = A[0][0] + A[1][1] + A[2][2];
  const m01 = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const m02 = A[0][0] * A[2][2] - A[0][2] * A[2][0];
  const m12 = A[1][1] * A[2][2] - A[1][2] * A[2][1];
  const d = det3(A);

  const a = -tr;
  const b = m01 + m02 + m12;
  const c = -d;

  // Depressed cubic t^3 + p t + q = 0 with lam = t - a/3
  const p = b - (a * a) / 3;
  const q = (2 * a * a * a) / 27 - (a * b) / 3 + c;
  const disc = (q * q) / 4 + (p * p * p) / 27;
  const shift = -a / 3;

  if (disc > 1e-10) {
    const sd = Math.sqrt(disc);
    const u = Math.cbrt(-q / 2 + sd);
    const v = Math.cbrt(-q / 2 - sd);
    const r1 = u + v + shift;
    const re = -(u + v) / 2 + shift;
    const im = ((u - v) * Math.sqrt(3)) / 2;
    return [
      { re: r1, im: 0 },
      { re, im },
      { re, im: -im },
    ];
  } else if (Math.abs(disc) <= 1e-10) {
    const u = Math.cbrt(-q / 2);
    return [
      { re: 2 * u + shift, im: 0 },
      { re: -u + shift, im: 0 },
      { re: -u + shift, im: 0 },
    ];
  } else {
    const rho = Math.sqrt(Math.max(0, -(p * p * p) / 27));
    const theta = Math.acos(Math.max(-1, Math.min(1, -q / (2 * rho))));
    const m = 2 * Math.cbrt(rho);
    return [0, 1, 2].map((k) => ({
      re: m * Math.cos((theta + 2 * Math.PI * k) / 3) + shift,
      im: 0,
    }));
  }
}

export function mat2ToTex(m: Mat2, digits = 2): string {
  return `\\begin{pmatrix} ${fmt(m[0][0], digits)} & ${fmt(m[0][1], digits)} \\\\ ${fmt(m[1][0], digits)} & ${fmt(m[1][1], digits)} \\end{pmatrix}`;
}

export function matToTex(m: number[][], digits = 2): string {
  const rows = m.map((r) => r.map((v) => fmt(v, digits)).join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}
