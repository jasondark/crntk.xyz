"use strict";

// We define a sparse vector type to leverage the observation that, for the most part,
// the matrix representation of a CRN is extremely sparse. Rather than use a "proper"
// sparse matrix type (CSC, CSC, etc), we note that our primary operations are row-based
// rather than matrix-based, so this keeps things a little bit simpler and presumably
// doesn't cost us too much in terms of performance.

const SparseVector = Object.create(null);

SparseVector.deflate = function(vec) {
    const factor = vec.reduce(((x, y) => gcd(x, Math.abs(y[1]))), 0);
    for (const entry of vec) {
        entry[1] /= factor;
    }
    return factor;
}

SparseVector.axpy = function(a, x, b, y) {
    const z = [];

    // we iterate while both have entries to consider
    let i = 0, j = 0;
    while (i < x.length && j < y.length) {
        const [xi, xv] = x[i];
        const [yi, yv] = y[j];

        // let's be just a little clever and make this as branchless as possible
        const lte = xi <= yi;
        const gte = xi >= yi;
        const val = a * xv * lte + b * yv * gte;
        const ind = (lte && xi) || (gte && yi);
        i += lte;
        j += gte;
        if (val !== 0) {
            z.push([ind + 0, val])
        }
    }
    // then we just copy over what's left of the two individually (at least one of the loops will be a no-op)
    for (; i < x.length; i++) {
        const [xi, xv] = x[i];
        z.push([xi, a * xv]);
    }
    for (; j < y.length; j++) {
        const [yi, yv] = y[j];
        z.push([yi, b * yv]);
    }
    return z;
}

// Compute a dot product
SparseVector.dot = function(x, y) {
    let z = 0;
    let i = 0, j = 0;
    // when one vector is done, we're done
    while (i < x.length && j < y.length) {
        const [xi, xv] = x[i];
        const [yi, yv] = y[j];

        // again, we try to be too clever by half and make this branchless
        const lte = xi <= yi;
        const gte = xi >= yi;
        z += lte && gte && (xv * yv);
        i += lte;
        j += gte;
    }
    return z;
}

// This is sort of an awkward place for the GCD implementation, but it is what it is
function gcd(u, v) {
    // We do a bunch of GCD's, so let's make it fast. In particular, here is a version stolen
    // from wikipedia and ported to JS (https://en.wikipedia.org/wiki/Binary_GCD_algorithm)
    let shift = 0;

    /* GCD(0,v) == v; GCD(u,0) == u, GCD(0,0) == 0 */
    if (u == 0) return v;
    if (v == 0) return u;
 
    /* Let shift := lg K, where K is the greatest power of 2
        dividing both u and v. */
    while (((u | v) & 1) == 0) {
        shift++;
        u >>= 1;
        v >>= 1;
    }
 
    while ((u & 1) == 0)
        u >>= 1;
 
    /* From here on, u is always odd. */
    do {
        /* remove all factors of 2 in v -- they are not common */
        /*   note: v is not zero, so while will terminate */
        while ((v & 1) == 0)
            v >>= 1;

        /* Now u and v are both odd. Swap if necessary so u <= v,
            then set v = v - u (which is even). For bignums, the
             swapping is just pointer movement, and the subtraction
              can be done in-place. */
        if (u > v) {
            let t = v; v = u; u = t; // Swap u and v.
        }
       
        v -= u; // Here v >= u.
    } while (v != 0);

    /* restore common factors of 2 */
    return u << shift;
}
