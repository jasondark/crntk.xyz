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

const CRNTK = (function() {
    // Since Javascript doesn't have tuple types that we can index a set with,
    // we define a set whose elements are pairs.
    function PairSet() {
        this.lookup = new Map();
    }
    PairSet.prototype.has = function(i, j) {
        return this.lookup.has(i) && this.lookup.get(i).has(j);
    };
    PairSet.prototype.add = function(i, j) {
        if (this.lookup.has(i)) {
            this.lookup.get(i).add(j);
        } else {
            this.lookup.set(i, new Set([j]));
        }
    };
    PairSet.prototype[Symbol.iterator] = function*() {
        for (const [i, set] of this.lookup.entries()) {
            for (const j of set.values()) {
                yield [i, j]
            }
        }
    };
    Object.defineProperty(PairSet.prototype, 'size', {
        get: function() {
            let size = 0;
            for (const set of this.lookup.values()) {
                size += set.size;
            }
            return size;
        }
    });

    function parseComplex(complex, speciesSet, complexes) {
        // 1) Parse the complex
        const parsed = new Map();
        for (const atom of complex.split('+')) {
            const match = /\s*(\d*)\s*\*?\s*(\S+)\s*/.exec(atom);
            // if we only match a number, it should just be zero
            if (match[1] && !match[2]) {
                throw new Error('unable to parse: ' + atom);
            } else {
                // try to match the optional multiplier
                const mult = match[1] ? parseInt(match[1], 10) : 1;
                if (!match[2]) {
                    throw new Error('unable to parse: ' + atom);
                }
                // if the multiplier is 0, just ignore the pair
                if (mult > 0) {
                    const species = match[2];
                    if (species === '0') {
                        continue;
                    }
                    speciesSet.add(species)
                    parsed.set(species, (parsed.has(species) ? parsed.get(species) : 0) + mult)
                }
            }
        }

        // 2) Flatten into a sorted array
        const canonical = Array.from(parsed.entries()).sort((x, y) => (x[0] < y[0]) ? -1 : (x[0] > y[0]) ? +1 : 0);
        const repr = canonical.map(x => x[1] + '*' + x[0]).join(' + ');

        // 3) Find or define the complex
        if (complexes.has(repr)) {
            return complexes.get(repr);
        } else {
            const val = [complexes.size, canonical];
            complexes.set(repr, val);
            return val;
        }
    }

    function CRNTK(str) {
        this.reactions = new PairSet();
        this.complexes = new Map();
        this.species = new Set();

        // split into individual lines
        for (let line of str.split(/[\r\n]+/g)) {
            // strip the comments then split in semicolons
            for (let chain of line.split('#', 1)[0].split(';')) {
                // split on (and remember) the arrows
                const atoms = chain.split(/(<[<=-]*[>=-]*>|<[<=-]*|[>=-]*>|=+)/g);
                if (atoms.length === 1) {
                    continue;
                }

                // we initialize the iteration with the first complex
                let rhs = parseComplex(atoms[0], this.species, this.complexes)[0];
                for (let i = 1; i < atoms.length; i += 2) {
                    // we slide the last complex down to the lhs
                    let lhs = rhs;
                    // parse the new complex
                    rhs = parseComplex(atoms[i+1], this.species, this.complexes)[0];
                    // and make sense of the arrow
                    const dir = -1 * (atoms[i].charAt(0) === '<') + 1 * (atoms[i].charAt(atoms[i].length-1) === '>');
                    // then we simply add the appropriate reactions
                    if (dir >= 0) {
                        this.reactions.add(lhs, rhs);
                    }
                    if (dir <= 0) {
                        this.reactions.add(rhs, lhs);
                    }
                }
            }
        }
    }

    return CRNTK;
})();

CRNTK.prototype.stoichiometry = function() {
    // Let's take an alphabetical ordering of the species.
    // We might want to do something more clever, unknown.
    const species = Array.from(this.species.values()).sort();
    const lookup = new Map();
    for (let i = 0; i < species.length; i++) {
        lookup.set(species[i], i);
    }

    // We create sparse vector representations of each complex
    const complexes = new Array(this.complexes.size);
    for (const [index, complex] of this.complexes.values()) {
        complexes[index] = complex.map(([x, k]) => [lookup.get(x), k]).sort((x, y) => x[0] - y[0])
    }

    // Now we construct the matrix. One row per reaction.
    const matrix = [];
    for (let [i, j] of this.reactions) {
        matrix.push(SparseVector.axpy(-1.0, complexes[i], +1.0, complexes[j]));
    }

    return {
        rows: matrix,
        cols: species
    };
};
