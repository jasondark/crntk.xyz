"use strict";

const Deque = (function() {
    function Node(x, left, right) {
        this.value = x;
        this.left = left;
        this.right = right;
    }

    function Deque(iterable) {
        this.length = 0;
        this.left = null;
        this.right = null;
        if (iterable) {
            for (const value of iterable) {
                this.pushRight(value);
            }
        }
    }

    Deque.prototype.pushLeft = function(x) {
        if (this.left === null) {
            this.left = this.right = new Node(x, null, null);
        } else {
            this.left.left = new Node(x, null, this.left);
            this.left = this.left.left;
        }

        this.length += 1;
    };

    Deque.prototype.pushRight = function(x) {
        if (this.right === null) {
            this.left = this.right = new Node(x, null, null);
        } else {
            this.right.right = new Node(x, this.right, null);
            this.right = this.right.right;
        }

        this.length += 1;
    };

    Deque.prototype.popLeft = function(defaultValue) {
        if (this.left === null) {
            return defaultValue;
        } else {
            const response = this.left.value;
            if (this.left === this.right) {
                this.left = this.right = null;
            } else {
                this.left = this.left.right;
                this.left.left = null;
            }
            this.length -= 1;
            return response;
        }
    };

    Deque.prototype.popRight = function(defaultValue) {
        if (this.right === null) {
            return defaultValue;
        } else {
            const response = this.right.value;
            if (this.left === this.right) {
                this.left = this.right = null;
            } else {
                this.right = this.right.left;
                this.right.right = null;
            }
        }
        this.length -= 1;
    };

    Deque.prototype[Symbol.iterator] = function*() {
        let node = this.left;
        while (node !== null) {
            yield node.value;
            node = node.right;
        }
    };

    return Deque;
})();
