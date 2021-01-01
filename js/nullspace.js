"use strict";

// Copyright 2021 Dr. Jason Dark (https://crntk.xyz)
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

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
            for (let k = i; k < m; k++) {
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
        while (rows.length > 0) {
            const row = rows.pop();
            if (row[0][0] >= n) {
                for (const entry of row) {
                    entry[0] -= n;
                }
                matrix.push(row);
            } else {
                break;
            }
        }

        return matrix;
    };

})();
