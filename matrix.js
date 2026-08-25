/**
 * Matrix Calculator Engine for Scientific Calculator Pro
 * Performs Matrix Linear Algebra operations up to 4x4
 */

class MatrixEngine {
  constructor() {
    this.rowsA = 2;
    this.colsA = 2;
    this.rowsB = 2;
    this.colsB = 2;

    this.matrixA = [
      [1, 2],
      [3, 4]
    ];

    this.matrixB = [
      [2, 0],
      [1, 3]
    ];
  }

  // Create empty matrix with r rows, c cols initialized to 0
  createEmpty(r, c) {
    const m = [];
    for (let i = 0; i < r; i++) {
      m.push(new Array(c).fill(0));
    }
    return m;
  }

  // Matrix Addition A + B
  add(A, B) {
    const rA = A.length;
    const cA = A[0].length;
    const rB = B.length;
    const cB = B[0].length;

    if (rA !== rB || cA !== cB) {
      throw new Error(`Dimension mismatch for addition: (${rA}×${cA}) + (${rB}×${cB})`);
    }

    const res = this.createEmpty(rA, cA);
    for (let i = 0; i < rA; i++) {
      for (let j = 0; j < cA; j++) {
        res[i][j] = A[i][j] + B[i][j];
      }
    }
    return res;
  }

  // Matrix Subtraction A - B
  subtract(A, B) {
    const rA = A.length;
    const cA = A[0].length;
    const rB = B.length;
    const cB = B[0].length;

    if (rA !== rB || cA !== cB) {
      throw new Error(`Dimension mismatch for subtraction: (${rA}×${cA}) - (${rB}×${cB})`);
    }

    const res = this.createEmpty(rA, cA);
    for (let i = 0; i < rA; i++) {
      for (let j = 0; j < cA; j++) {
        res[i][j] = A[i][j] - B[i][j];
      }
    }
    return res;
  }

  // Matrix Multiplication A * B
  multiply(A, B) {
    const rA = A.length;
    const cA = A[0].length;
    const rB = B.length;
    const cB = B[0].length;

    if (cA !== rB) {
      throw new Error(`Invalid dimensions for multiplication: (${rA}×${cA}) × (${rB}×${cB}). Columns of A (${cA}) must match Rows of B (${rB}).`);
    }

    const res = this.createEmpty(rA, cB);
    for (let i = 0; i < rA; i++) {
      for (let j = 0; j < cB; j++) {
        let sum = 0;
        for (let k = 0; k < cA; k++) {
          sum += A[i][k] * B[k][j];
        }
        res[i][j] = sum;
      }
    }
    return res;
  }

  // Scalar Multiplication k * A
  scalarMultiply(k, A) {
    const r = A.length;
    const c = A[0].length;
    const res = this.createEmpty(r, c);
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        res[i][j] = k * A[i][j];
      }
    }
    return res;
  }

  // Matrix Transpose A^T
  transpose(A) {
    const r = A.length;
    const c = A[0].length;
    const res = this.createEmpty(c, r);
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        res[j][i] = A[i][j];
      }
    }
    return res;
  }

  // Determinant of Square Matrix det(A)
  determinant(A) {
    const r = A.length;
    const c = A[0].length;

    if (r !== c) {
      throw new Error('Determinant requires a square matrix');
    }

    if (r === 1) return A[0][0];
    if (r === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];

    let det = 0;
    for (let j = 0; j < c; j++) {
      const sub = this.getMinor(A, 0, j);
      det += Math.pow(-1, j) * A[0][j] * this.determinant(sub);
    }
    return det;
  }

  // Submatrix / Minor helper
  getMinor(A, row, col) {
    return A.filter((_, r) => r !== row)
            .map(r => r.filter((_, c) => c !== col));
  }

  // Inverse Matrix A^-1
  inverse(A) {
    const det = this.determinant(A);
    if (Math.abs(det) < 1e-12) {
      throw new Error('Matrix is singular (Determinant = 0). Inverse does not exist.');
    }

    const r = A.length;
    const c = A[0].length;

    if (r === 1) return [[1 / A[0][0]]];

    // Adjugate matrix / determinant
    const adj = this.createEmpty(r, c);
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        const sub = this.getMinor(A, i, j);
        const sign = Math.pow(-1, i + j);
        adj[j][i] = sign * this.determinant(sub); // Note transpose [j][i]
      }
    }

    return this.scalarMultiply(1 / det, adj);
  }

  // Round floating precision for neat matrix display
  formatMatrix(M) {
    return M.map(row => row.map(val => {
      if (Math.abs(val) < 1e-10) return 0;
      const fixed = val.toFixed(4);
      return parseFloat(fixed);
    }));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrixEngine;
} else {
  window.MatrixEngine = MatrixEngine;
}
