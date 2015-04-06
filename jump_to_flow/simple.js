var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BreakException = (function () {
    function BreakException() {
    }
    return BreakException;
})();
var NNode = (function () {
    function NNode() {
        //public index:int;
        //public prev:NNode;
        //public next:NNode;
        this.type = 'node';
        this.references = [];
    }
    Object.defineProperty(NNode.prototype, "prev", {
        //get index() { return this.block.nodes.indexOf(this); }
        get: function () {
            return this.parentBlock.getPrev(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NNode.prototype, "next", {
        get: function () {
            return this.parentBlock.getNext(this);
        },
        enumerable: true,
        configurable: true
    });
    return NNode;
})();
var NSimpleNode = (function (_super) {
    __extends(NSimpleNode, _super);
    function NSimpleNode(text) {
        _super.call(this);
        this.text = text;
        this.type = 'simple';
    }
    return NSimpleNode;
})(NNode);
/*
class NSimpleBlockNode {
    public nodes:NNode[] = [];
}
*/
var NJumpNode = (function (_super) {
    __extends(NJumpNode, _super);
    function NJumpNode(cond) {
        _super.call(this);
        this.cond = cond;
        this.type = 'jump';
    }
    Object.defineProperty(NJumpNode.prototype, "jumpNode", {
        get: function () {
            return this._jumpNode;
        },
        set: function (node) {
            this._jumpNode = node;
            node.references.push(this);
        },
        enumerable: true,
        configurable: true
    });
    NJumpNode.prototype.createRange = function () {
        return NRange.create(this, this.jumpNode);
    };
    Object.defineProperty(NJumpNode.prototype, "isForwardReference", {
        get: function () {
            return this.parentBlock.compareIndex(this.jumpNode, this) >= 0;
        },
        enumerable: true,
        configurable: true
    });
    return NJumpNode;
})(NNode);
var NRange = (function () {
    function NRange(low, high) {
        this.low = low;
        this.high = high;
        this.type = 'range';
        //assert(low.index <= high.index);
    }
    NRange.create = function (a, b) {
        return (a.parentBlock.compareIndex(a, b) <= 0) ? new NRange(a, b) : new NRange(b, a);
    };
    NRange.prototype.removeHead = function () {
        return new NRange(this.low.next, this.high);
    };
    NRange.prototype.removeTail = function () {
        return new NRange(this.low, this.high.prev);
    };
    NRange.prototype.contains = function (node) {
        return (node.parentBlock.compareIndex(node, this.low) >= 0) && (node.parentBlock.compareIndex(node, this.high) <= 0);
    };
    NRange.prototype.each = function (callback) {
        for (var node = this.low; node; node = node.next) {
            callback(node);
            if (node == this.high)
                break;
        }
    };
    NRange.prototype.internalReferencesCount = function () {
        var _this = this;
        var count = 0;
        this.each(function (node) {
            node.references.forEach(function (refnode) {
                if (_this.contains(refnode))
                    count++;
            });
            if (node instanceof NJumpNode) {
                if (_this.contains(node.jumpNode))
                    count++;
            }
        });
        return count;
    };
    NRange.prototype.externalReferencesCount = function () {
        var _this = this;
        var count = 0;
        this.each(function (node) {
            node.references.forEach(function (refnode) {
                if (!_this.contains(refnode))
                    count++;
            });
            if (node instanceof NJumpNode) {
                if (!_this.contains(node.jumpNode))
                    count++;
            }
        });
        return count;
    };
    NRange.prototype.createBlock = function () {
        var out = [];
        this.each(function (node) { return out.push(node); });
        return new NBlock(out);
    };
    //get length() { return this.high.index - this.low.index + 1; }
    NRange.prototype.toString = function () {
        return "Range(" + this.low + ", " + this.high + ")";
    };
    return NRange;
})();
var NBlock = (function () {
    function NBlock(nodes) {
        var _this = this;
        if (nodes === void 0) { nodes = []; }
        this.type = 'block';
        this.nodes = nodes;
        this.nodes.forEach(function (node) { return node.parentBlock = _this; });
    }
    NBlock.prototype.clone = function () {
        return new NBlock(this.nodes);
    };
    NBlock.prototype.add = function (node) {
        node.parentBlock = this;
        this.nodes.push(node);
        return node;
    };
    NBlock.prototype.replaceRange = function (range, node) {
        var low = this.nodes.indexOf(range.low);
        var high = this.nodes.indexOf(range.high);
        this.nodes.splice(low, high - low + 1, node);
        node.parentBlock = this;
    };
    NBlock.prototype.compareIndex = function (a, b) {
        var ai = this.nodes.indexOf(a);
        var bi = this.nodes.indexOf(b);
        if (ai < bi)
            return -1;
        if (ai > bi)
            return +1;
        return 0;
    };
    NBlock.prototype.getIndex = function (node) {
        return this.nodes.indexOf(node);
    };
    NBlock.prototype.getPrev = function (node) {
        return this.nodes[this.getIndex(node) - 1];
    };
    NBlock.prototype.getNext = function (node) {
        return this.nodes[this.getIndex(node) + 1];
    };
    NBlock.prototype.allRange = function () {
        return new NRange(this.nodes[0], this.nodes[this.nodes.length - 1]);
    };
    return NBlock;
})();
var NDoWhileNode = (function (_super) {
    __extends(NDoWhileNode, _super);
    function NDoWhileNode(insideBlock, cond) {
        _super.call(this);
        this.insideBlock = insideBlock;
        this.cond = cond;
        this.type = 'while';
    }
    return NDoWhileNode;
})(NNode);
var NDoIfNode = (function (_super) {
    __extends(NDoIfNode, _super);
    function NDoIfNode(insideBlock, cond) {
        _super.call(this);
        this.insideBlock = insideBlock;
        this.cond = cond;
        this.type = 'if';
    }
    return NDoIfNode;
})(NNode);
var NStateMachineNode = (function (_super) {
    __extends(NStateMachineNode, _super);
    function NStateMachineNode(insideBlock) {
        _super.call(this);
        this.insideBlock = insideBlock;
        this.type = 'stateMachine';
    }
    return NStateMachineNode;
})(NNode);
function dump(node, indent) {
    if (indent === void 0) { indent = ''; }
    if (node instanceof NBlock) {
        dump(node.allRange(), indent);
    }
    else if (node instanceof NRange) {
        node.each(function (n2) { return dump(n2, indent); });
    }
    else if (node instanceof NNode) {
        //console.log('' + node);
        if (node instanceof NSimpleNode) {
            console.log(indent + node.text + ';');
        }
        else if (node instanceof NJumpNode) {
            console.log(indent + 'jump_if:' + node.cond);
        }
        else if (node instanceof NDoWhileNode) {
            console.log(indent + 'do {');
            node.insideBlock.allRange().each(function (n2) {
                dump(n2, indent + '  ');
            });
            console.log(indent + ("} while (" + node.cond + ");"));
        }
        else if (node instanceof NDoIfNode) {
            console.log(indent + ("if (!(" + node.cond + ")) {"));
            node.insideBlock.allRange().each(function (n2) {
                dump(n2, indent + '  ');
            });
            console.log(indent + "}");
        }
        else {
            console.log('?');
        }
    }
    else {
        console.log('??');
    }
}
function createNormalFlow(block) {
    var external = 0;
    do {
        var count = 0;
        external = 0;
        block.allRange().each(function (node) {
            if (node instanceof NJumpNode) {
                var jumpRange = node.createRange();
                if (jumpRange.externalReferencesCount() == 0) {
                    //console.log('jump:' + jumpRange);
                    count++;
                    if (node.isForwardReference) {
                        var block1 = jumpRange.removeHead().createBlock();
                        createNormalFlow(block1);
                        block.replaceRange(jumpRange, new NDoIfNode(block1, node.cond));
                    }
                    else {
                        var block1 = jumpRange.removeTail().createBlock();
                        createNormalFlow(block1);
                        block.replaceRange(jumpRange, new NDoWhileNode(block1, node.cond));
                    }
                }
                else {
                    //console.log('jump:' + node + '. External references!');
                    external++;
                }
            }
        });
    } while (count != 0);
    if (external > 0) {
        block.replaceRange(block.allRange(), new NStateMachineNode(block.clone()));
    }
}
var list = new NBlock();
var n0 = list.add(new NSimpleNode('b = 0'));
var n1 = list.add(new NSimpleNode('a = 0'));
var n2 = list.add(new NSimpleNode('a++'));
list.add(new NSimpleNode(''));
var n3 = list.add(new NJumpNode('a < 10'));
var n4 = list.add(new NJumpNode('a != 10'));
var n5 = list.add(new NSimpleNode('print(a)'));
var n6 = list.add(new NSimpleNode(''));
var n7 = list.add(new NJumpNode('true'));
n3.jumpNode = n2;
n4.jumpNode = n6;
n7.jumpNode = n2;
/*
range.each(node => {
   console.log('' + node);
});
console.log(range.length);
*/
/*
console.log(range.internalReferencesCount());
console.log(range.externalReferencesCount());

console.log('' + range);
console.log('' + n3.createRange() + ',' + n3.jumpType);
*/
createNormalFlow(list);
/*
console.log('-------------');
console.log(list);
dump(list);
*/
//# sourceMappingURL=simple.js.map