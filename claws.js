"use strict";

importScripts('vec.js', 'queue.js');

function ddm(constraints, n, progress, complete) {
    const A = new Queue(constraints);
    const R = new Queue();
    for (let i = 0; i < n; i++) {
        R.enqueue([[i, 1]]);
    }

    while (A.length > 0) {
        let bestConstraint = null;
        let bestDelta = Math.pow((R.length >> 1) + 1, 2) - R.length;

        let count = 0;
        const maxIterations = A.length;
        progress(maxIterations);

        for (; count < maxIterations; count++) {
            const a = A.dequeue(null);
            let [delta, trivial] = process(a, R, false);
            if (trivial) {
                continue;
            } else if (delta <= 0) {
                break;
            } else {
                A.enqueue(a);
                if (delta < bestDelta) {
                    bestDelta = delta;
                    bestConstraint = a;
                }
            }
        }
        if (count == maxIterations) {
            if (bestConstraint === null) {
                if (A.length > 0) {
                    throw new Error('???');
                }
            } else {
                process(bestConstraint, R, true);
            }
        }
    }

    complete(Array.from(R));
}

function process(a, R, force) {
    const n0 = R.length;
    const rneg = [];
    const rpos = [];

    for (let i = 0; i < n0; i++) {
        const r = R.dequeue(null);
        const v = SparseVector.dot(r, a);
        if (v < 0) {
            rneg.push([r, v]);
        } else if (v > 0) {
            rpos.push([r, v]);
        } else {
            R.enqueue(r);
        }
    }

    const n1 = R.length + rneg.length * rpos.length;

    if (force || n1 <= n0) {
        for (let [x, xdot] of rpos) {
            for (let [y, ydot] of rneg) {
                const z = SparseVector.axpy(-ydot, x, xdot, y)
                SparseVector.deflate(z);
                if (adjacent(z, R)) {
                    R.enqueue(z);
                }
            }
        }
    } else {
        for (let arr of [rneg, rpos]) {
            for (let [r, _] of arr) {
                R.enqueue(r);
            }
        }
    }

    return [n1 - n0, rneg.length + rpos.length === 0];
}

function adjacent(z, R) {
    for (const r of R) {
        if (supportSubset(r, z)) {
            return false;
        }
    }
    return true;
}

function supportSubset(x, y) {
    let i = 0;
    let j = 0;
    let delta_x = x.length;
    let delta_y = y.length;
    do {
        if (delta_x === 0) {
            return true;
        }

        if (delta_x > delta_y) {
            return false;
        }

        const xi = x[i][0]
        const yj = y[j][0]

        if (xi < yj) {
            return false;
        } else if (xi > yj) {
            j += 1;
            delta_y -= 1;
        } else {
            i += 1;
            j += 1;
            delta_x -= 1;
            delta_y -= 1;
        }
    } while (true);
}

onmessage = function(e) {
    const [constraints, n] = e.data;
    ddm(constraints, n, i => postMessage(['progress', i]), r => postMessage(['complete', r]));
}