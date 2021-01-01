"use strict";

(function() {
    function swap(rows, i, j) {
        const r = rows[i];
        rows[i] = rows[j];
        rows[j] = r;
    }

    CRNTK.prototype.nullspace = function() {
        // We get the (transposed) stoichiometry matrix
        const {rows, cols} = this.stoichiometry();
        const m = rows.length;
        const n = cols.length;

        // We augment it with the identity matrix.
        // Note: this guarantees we always have non-empty
        //       row. (true story!)
        for (let i = 0; i < m; i++) {
            rows[i].push([n + i, 1]);
        }

        // Then we row-reduce it
        let i = 0;
        let j = 0;
        while (i < m && j < n) {
            // 1) Find the pivot
            let bestPivot = Number.POSITIVE_INFINITY;
            let bestIndex = -1;
            for (let k = i; k < m; i++) {
                const entry = rows[k][0];
                if (entry[0] === j) {
                    const pivot = Math.abs(entry[1]);
                    if (
                        pivot < bestPivot ||
                        (pivot === bestPivot && rows[k].length < rows[bestIndex].length)
                    ) {
                        bestPivot = pivot;
                        bestIndex = k;
                    }
                }
            }
            if (bestIndex > i) {
                swap(rows, i, bestIndex);
            } else if (bestIndex === -1) {
                j += 1;
                continue;
            }

            // 2) Eliminate the rows below
            const a = rows[i][0][1];
            for (let k = i+1; k < m; k++) {
                const entry = rows[k][0];
                if (entry[0] === j) {
                    const b = entry[1];
                    // we might get some overflow here... we should do something about that someday.
                    rows[k] = SparseVector.axpy(-b, rows[i], a, rows[k]);
                    SparseVector.deflate(rows[k]);
                }
            }

            // 3) Increment the pointers
            i += 1;
            j += 1;
        }

        // Now we grab the nullspace basis
        const matrix = [];
        for (let k = rows.length - 1; k >= 0; k--) {
            if (rows[k][0][0] >= n) {
                matrix.push(rows[k]);
                for (const entry of rows[k]) {
                    entry[0] -= n;
                }
            } else {
                break;
            }
        }

        return matrix;
    };

})();
