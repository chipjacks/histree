// Histree Google Chrome Extension
// Tree data structure with smart insertion of new nodes by first checking if
// they are already in the tree, and if not locating their parent in the tree
// and inserting them as a child.
// Chip Jackson, July 2014

var newTabRegex = /.*New Tab.*/;

var Tree = (function () {

	"use strict";


	//------------------------------------------------------------------------------
	// Tree class methods
	function Tree() {
		this.root = null;
		// tracks current node for each tab
		this.currentNode = {};
		this.urls = {};
		this.youngestNode = null;
	}

	// appends node as child of Tree.currentNode, points Tree.currentNode to node.
	Tree.prototype.addNode = function (node) {
		console.info("Tree.prototype.addNode called with: ", JSON.stringify(node));
		// make an alias so object is accessible within chrome.tabs.query callback
		var thisTree = this;

		// see if the url is already in the tree
		var oldNode = thisTree.urls[node.url];
		if (oldNode && oldNode.tabAlias.orig === node.tabAlias.orig) {
			// it is already in the tree
			oldNode.time = node.time;
			if (oldNode.parent) {
				// keep it's array of siblings sorted from oldest to youngest
				var siblings = oldNode.parent.children;
				siblings.splice(siblings.indexOf(oldNode), 1);
				siblings.push(oldNode);
			}
			thisTree.currentNode[node.tabAlias.orig] = oldNode;
			return;
		}

		// give the node a unique id
		node.id = nextNodeId();

		// add it to the tree
		node.children = [];
		if (!thisTree.root) {
			thisTree.root = node;
		} else {
			if (!thisTree.currentNode[node.tabAlias.orig]) {
				node.parent = thisTree.currentNode[node.openerTabId];
				if (!node.parent) {
					node.parent = thisTree.currentNode[lastActiveTabId];
				}
			} else {
				node.parent = thisTree.currentNode[node.tabAlias.orig];
			}
			if (!node.parent) {
				console.error("Couldn't find a parent, defaulting to root as parent!");
				node.parent = thisTree.root;
			}
			node.parent.children.push(node);
		}

		// add node url to urls hash
		thisTree.urls[node.url] = node;

		// traverse to new currentNode
		thisTree.currentNode[node.tabAlias.orig] = node;

		thisTree.youngestNode = node;

		// make sure node has all data filled in
		if (!node.isValid()) {
			console.error("Tree.prototype.addNode called with invalid node: ", node);
		}
	};

	Tree.prototype.reset = function () {
		this.root = null;
		this.currentNode = {};
		this.urls = {};
		this.youngestNode = null;
	};

	//------------------------------------------------------------------------------
	// Node class methods
	function Node(initObj) {
		var fld;
		for (fld in initObj) {
			this[fld] = initObj[fld];
		}
		this.children = [];
	}

	Node.prototype.isValid = function () {
		// checks that node object contains all required data fields
		return (
			this.url &&
			this.title &&
			this.time &&
			this.id &&
			this.children &&
			this.tabAlias &&
			this.tabId		// may not be needed?
		);
	};

	Node.prototype.isYoungestChild = function () {
		if (!this.parent) {
			return true;
		} else {
			var siblings = this.parent.children;
			return siblings[siblings.length - 1] === this;
		}
	};

	Node.prototype.youngestChild = function () {
		if (!this.children.length) {
			return null;
		} else {
			return this.children[this.children.length - 1];
		}
	};

	Node.prototype.isOldestChild = function () {
		if (!this.parent) {
			return true;
		} else {
			var siblings = this.parent.children;
			return siblings[0] === this;
		}
	};

	Node.prototype.oldestChild = function () {
		if (!this.children.length) {
			return null;
		} else {
			return this.children[0];
		}
	};

	Node.prototype.bigBro = function () {
		if (this.isOldestChild()) {
			return null;
		} else {
			var siblings = this.parent.children;
			var myIndex = siblings.indexOf(this);
			return siblings[myIndex - 1];
		}
	};

	Node.prototype.lilBro = function () {
		if (this.isYoungestChild()) {
			return null;
		} else {
			var siblings = this.parent.children;
			var myIndex = siblings.indexOf(this);
			return siblings[myIndex + 1];
		}
	};

	function nextNodeId() {
		// generates increasing unique id's to indicate order for nodes in histrees
		if (!nextNodeId.i) {
			nextNodeId.i = 0;
		}
		nextNodeId.i += 1;
		return nextNodeId.i;
	}

	return {
		Tree: Tree,
		Node: Node
	};
})();
