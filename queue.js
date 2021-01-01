"use strict";

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
