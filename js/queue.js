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

const Queue = (function() {
    function Node(x) {
        this.value = x;
        this.next = null;
    }

    function Queue(iterable) {
        this.length = 0;
        this.front = null;
        this.back = null;
        if (iterable) {
            for (const value of iterable) {
                this.enqueue(value);
            }
        }
    }

    Queue.prototype.enqueue = function(x) {
        if (this.back === null) {
            this.front = this.back = new Node(x);
        } else {
            this.back.next = new Node(x);
            this.back = this.back.next;
        }

        this.length += 1;
    };

    Queue.prototype.dequeue = function(defaultValue) {
        if (this.front === null) {
            return defaultValue;
        } else {
            const response = this.front.value;
            this.front = this.front.next;
            this.length -= 1;
            return response;
        }
    };

    Queue.prototype[Symbol.iterator] = function*() {
        let node = this.front;
        while (node !== null) {
            yield node.value;
            node = node.next;
        }
    };

    return Queue;
})();
