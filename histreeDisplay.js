// Histree Google Chrome Extension
// Iterator to traverse tree data structure in order nodes will be printed in
// popup.
// Chip Jackson, September 2014

var HistreeDisplay = (function () {
	
	"use strict";

	//------------------------------------------------------------------------------
	// HistreeDisplay class methods
	// HistreeDisplay iterates through histree in the order nodes should be
	// displayed.
	function HistreeDisplay(startNode) {
		this.curNode = startNode;
		this.curNode.indent = 0;
	}

	HistreeDisplay.prototype.jumpTo = function (node) {
		this.curNode = node;
		this.curNode.indent = 0;
	};

	HistreeDisplay.prototype.next = function () {
		// Return either older brother, older brothers youngest child, or parent.
		// Increase indent if moving from youngest child to older brother.
		// Decrease indent if moving from oldest child to parent (except when oldest
		// is an only child).
		var next = null;
		if (this.curNode.isOldestChild() && this.curNode.parent) {
			// moving to parent, indent to match youngest child
			next = this.curNode.parent;
			next.indent = next.youngestChild().indent;
		} else if (this.curNode.bigBro()) {
			// moving to big brother or his children if he has some
			next = this.curNode.bigBro();
			while (next.youngestChild()) {
				next = next.youngestChild();
			}
			if (this.curNode.isYoungestChild()) {
				next.indent = this.curNode.indent + 1;
			} else {
				next.indent = this.curNode.indent;
			}
		}
		if (next) {
			this.curNode = next;
		}
		return next;
	};

	HistreeDisplay.prototype.prev = function () {
		// return either little brother, oldest child or parents lil bro.
		// Increase indent if returning child, but not youngest child.
		// Decrease indent if return little brother who is youngest child.
		// TODO: broken, needs youngest child to parents lil bro case to be added.
		var prev = null;
		if (this.curNode.isYoungestChild()) {
			if (this.curNode.children.length) {
				prev = this.curNode.children[this.curNode.children.length - 1];
				if (!prev.isYoungestChild()) {
					this.curIndent += 1;
				}
			}
		} else {
			prev = this.curNode.lilBro();
			if (prev.isYoungestChild()) {
				this.curIndent -= 1;
			}
		}
		if (prev) {
			this.curNode = prev;
			return prev;
		} else {
			return null;
		}
	};

	HistreeDisplay.prototype.getIndent = function () {
		return this.curNode.indent;
	};

	return HistreeDisplay;
})();
