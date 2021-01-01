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

function Linkage() {
    this.complexes = new Array();
    this.reactions = new Array();
    this.type = Linkage.UNKNOWN;
}

Linkage.UNKNOWN = -1;
Linkage.NONE = 0;
Linkage.WEAKLY_REVERSIBLE = 1;
Linkage.REVERSIBLE = 2;

CRNTK.prototype.linkages = function() {
    const complexes = new Array(this.complexes.size);
    for (const [index, complex] of this.complexes.values()) {
        complexes[index] = complex;
    }
    const reactions = this.reactions;

    // We setup the associated directed graph and find its strongly connected components
    const graph = new Graph(complexes, reactions);

    // We now compute the (undirected) adjacency matrix for the strongly connected components themselves
    const adjacency = new Array(graph.count);
    for (let i = 0; i < adjacency.length; i++) {
        adjacency[i] = new Set();
    }
    for (const [lhs, rhs] of reactions) {
        const [i, j] = [graph.id[lhs], graph.id[rhs]];
        // we don't connect a component to itself
        if (i !== j) {
            adjacency[i].add(j);
            adjacency[j].add(i);
        }
    }

    // Now we assign each strongly connected component a linkage class
    const membership = adjacency.map(_ => -1);
    let nlinkages = 0;
    
    // We do this with a simple depth-first search
    const stack = [];
    for (let i = 0; i < adjacency.length; i++) {
        if (membership[i] === -1) {
            // if we haven't seen i before, let's initialize a new linkage class
            // and kick off a search.
  
            // unrolled recursion
            stack.push(i);
            while (stack.length > 0) {
                const j = stack.pop();
                membership[j] = nlinkages;
  
                for (const k of adjacency[j]) {
                    if (membership[k] === -1) {
                        // we haven't visited k before, so be sure to check its neighbors later
                        stack.push(k);
                    }
                }
            }

            nlinkages += 1;
        }
    }

    // Now we partition the CRN into its linkage classes
    const linkages = new Array(nlinkages);
    for (let i = 0; i < linkages.length; i++) {
        linkages[i] = new Linkage();
    }

    // bin up the complexes
    for (let i = 0; i < complexes.length; i++) {
        const j = graph.id[i];
        const linkage = linkages[membership[j]];
        linkage.complexes.push(i);
        if (linkage.type === Linkage.UNKNOWN) {
            // assume reversible, we will downgrade to weak when scanning through the reactions
            linkage.type = (adjacency[j].size === 0) ? Linkage.REVERSIBLE : Linkage.NONE;
        }
    }

    // bin up the reactions
    for (const [lhs, rhs] of reactions) {
        const linkage = linkages[membership[graph.id[lhs]]];
        linkage.reactions.push([lhs, rhs]);
        linkage.type = Math.min(linkage.type, graph.edges[rhs].has(lhs) ? Linkage.REVERSIBLE : Linkage.WEAKLY_REVERSIBLE);
    }

    return linkages;
}

function Graph(complexes, reactions) {
    // This is basically "Program 19.11 Strong components (Tarjan's algorithm)"
    // from "Algorithms in C++ (Third Edition), Part 5: Graph Algorithms"
    // by Robert Sedgewick

    // preorder index of each complex
    this.pre = complexes.map(_ => -1);

    // lowest preorder number in the node's component
    this.low = complexes.map(_ => -1);

    // the id of the component the node belongs to
    this.id = complexes.map(_ => -1);

    // some instance variables -- back in 1990, people did not like descriptive variable names apparently
    // so we have renamed "cnt" -> "index" and "scnt" -> "count"
    this.index = 0; // <-- this is the active preorder index
    this.count = 0; // <-- this is the active component id
    this.stack = new Array();

    // Map the reactions to edges in a directed graph
    this.edges = complexes.map(_ => new Set());
    for (const [lhs, rhs] of reactions) {
        this.edges[lhs].add(rhs);
    }

    // kick off the search
    for (let v = 0; v < complexes.length; v++) {
        if (this.pre[v] === -1) {
            this.traverse(v);
        }
    }
}

Graph.prototype.traverse = function(w) {
    // set the entries to the preorder offset
    let min = this.low[w] = this.pre[w] = this.index++;
    // start the cycle
    this.stack.push(w);
    // for each neighbor, traverse it (if we haven't already)
    for (const t of this.edges[w]) {
        if (this.pre[t] === -1) {
            this.traverse(t);
        }
        min = Math.min(min, this.low[t]);
    }
    if (min < this.low[w]) {
        // update the lowest index
        this.low[w] = min;
    } else {
        // otherwise, close the cycle
        let t = -1;
        while (t !== w) {
            t = this.stack.pop();
            this.id[t] = this.count;
            this.low[t] = this.id.length;
        }
        this.count += 1;
    }
};
