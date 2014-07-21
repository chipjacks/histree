// Histree Google Chrome Extension
// Javascript functions for recording page visits in tree data structure
// Chip Jackson, July 2014

"use strict";

//------------------------------------------------------------------------------
// GLOBALS
var histree = new Tree();	// inidividual tab histrees, keyed by tabId
var lastVisit = null;	// stores last visited page for each tab
var THUMBNAILS = false;
var lastActiveTabId = 0;
var activeTabId = 0;
var newTabRegex = /.*New Tab.*/;

// TODO: deal with any necessary initilization
function init() {
// Called when extension is installed or upgraded
	console.info("Histree extension initializing");
}
chrome.runtime.onInstalled.addListener(init);

function startup() {
// Called when extension is started
	console.info("Histree extension starting");
}
chrome.runtime.onStartup.addListener(startup);
//------------------------------------------------------------------------------
// Tree class methods
function Tree() {
	this.root = null;
	this.currentNode = {};	//tracks current node for each tab
	this.urls = {};		// allow for fast node lookup by url
	this.youngestNode = null;
}

Tree.prototype.addNode = function (node) {
// appends node as child of Tree.currentNode, points Tree.currentNode to node.
	console.info("Tree.prototype.addNode called with: ", JSON.stringify(node));
	var thisTree = this;
	// lookup tabid
	chrome.tabs.query({active: true, currentWindow: true},
		function (tabs) {
			if (tabs.length > 1) {
				console.error("chrome.tabs.query returned more than 1 active tab.");
			}

			var tab = tabs[0];

			// see if the url is already in the tree
			var oldNode = thisTree.urls[node.url];
			if (oldNode && oldNode.tabId == node.tabId) {
				// it is already in the tree
				oldNode.time = node.time;
				if (oldNode.parent) {
					// keep it's array of siblings sorted from oldest to youngest
					var siblings = oldNode.parent.children;
					siblings.splice(siblings.indexOf(oldNode), 1);
					siblings.push(oldNode);
				}
				thisTree.currentNode[node.tabId] = oldNode;
				return;
			}

			// give the node a unique id
			node.id = nextNodeId();

			// add it to the tree
			node.children = [];
			if (!thisTree.root) {
				thisTree.root = node;
			} else {
				if (node.title.match(newTabRegex)) {
					node.parent = thisTree.currentNode[lastActiveTabId];
					if (!node.parent) {
						node.parent = thisTree.currentNode[tab.openerTabId];
					}
				} else if (thisTree.currentNode[tab.id]) {
					node.parent = thisTree.currentNode[tab.id];
				} else {
					node.parent = thisTree.currentNode[tab.openerTabId];
				}
				if (!node.parent) {
					console.error("couldnt find a parent!");
				}
				node.parent.children.push(node);
			}
			
			// add node url to urls hash
			thisTree.urls[node.url] = node;

			// traverse to new currentNode
			thisTree.currentNode[node.tabId] = node;

			thisTree.youngestNode = node;

			// make sure node has all data filled in
			if (!node.isValid()) {
				console.error("Tree.prototype.addNode called with invalid node: ", node);
			}
		});
};

//------------------------------------------------------------------------------
// Node class methods
function Node(initObj) {
	for (var fld in initObj) {
		this[fld] = initObj[fld];
	}
	this.children = [];
}

Node.prototype.isValid = function() {
// checks that node object contains all required data fields
	return (
		this.url &&
		this.title &&
		this.time &&
		this.id &&
		this.children &&
		this.tabId		// may not be needed?
	);
}

Node.prototype.isYoungestChild = function() {
	if (!this.parent) {
		return true;
	} else {
		var siblings = this.parent.children;
		return siblings[siblings.length - 1] === this;
	}
}

Node.prototype.youngestChild = function() {
	if (!this.children.length) {
		return null;
	} else {
		return this.children[this.children.length - 1];
	}
}

Node.prototype.isOldestChild = function() {
	if (!this.parent) {
		return true;
	} else {
		var siblings = this.parent.children;
		return siblings[0] === this;
	}
}

Node.prototype.oldestChild = function() {
	if (!this.children.length) {
		return null;
	} else {
		return this.children[0];
	}
}

Node.prototype.bigBro = function() {
	if (this.isOldestChild()) {
		return null;
	} else {
		var siblings = this.parent.children;
		var myIndex = siblings.indexOf(this);
		return siblings[myIndex - 1];
	}
}

Node.prototype.lilBro = function() {
	if (this.isYoungestChild()) {
		return null;
	} else {
		var siblings = this.parent.children;
		var myIndex = siblings.indexOf(this);
		return siblings[myIndex + 1];
	}
}

function nextNodeId() {
// generates increasing unique id's to indicate order for nodes in histrees
	if (!nextNodeId.i) {
		nextNodeId.i = 0;
	}
	nextNodeId.i += 1;
	return nextNodeId.i;
}

//------------------------------------------------------------------------------
// Callbacks for recording page visits and adding them to histree
// Uses two callbacks to verify page visits before adding them to histree to
// prevent duplicate entries.
// For example: http://facebook.com and https://facebook.com are both
// registered as historyItemVisits when you navigate to facebook.com, so we need
// to wait for an onTabupdated with status "complete" to make sure we are at our
// final destination before adding a page to histree.

// Work around for old browsers that haven't implemented Date.now()
if (!Date.now) {
	Date.now = function now() {
		return new Date().getTime();
	};
}

function onHistoryItemVisited(histItem) {
	console.info("HistoryItem visited: ", histItem);
	var lv;
	if (lastVisit && lastVisit.url === histItem.url &&
			lastVisit.tabUpdate) {
		// onTabUpdated already picked it up, add it to the tree
		if (THUMBNAILS && !lastVisit[tab.id].img) {
			// still need to capture a thumbnail for it, let pendingCaptures
			// callback add it to the tree
			lastVisit.historyVisit = true;
		} else {
			lv = lastVisit;
			if (histItem.title) {
				lv.title = histItem.title;
			}
			histree.addNode(lv);
		}
	} else {
		// add some info, let onTabUpdated add it to the tree
		lastVisit = new Node({url: histItem.url, title: histItem.title,
			time: Date.now(), historyVisit: true});
	}
}
chrome.history.onVisited.addListener(onHistoryItemVisited);

function onTabUpdated(tabId, changeInfo, tab) {
	console.info("Tab updated: tabId = %d, tab = %o, changeInfo = %o", tabId, tab,
		changeInfo);

	if (THUMBNAILS) {
		if (changeInfo.status === 'loading' && tab.active &&
				pendingCaptures[tab.id]) {
			// tab is changing pages, try and capture last page if we haven't already
			pendingCaptures[tab.id].call();
			pendingCaptures[tab.id] = void(0);
		} else if (changeInfo.status === 'complete' && tab.active) {
			// try and capture tab after a half second to let page content finish 
			// loading
			setTimeout(function () {
				pendingCaptures[tab.id].call();
				pendingCaptures[tab.id] = void(0);
			}, 500);
		}
	}
	if (changeInfo.status === 'complete') {
		var lv;
		if (tab.title.match(newTabRegex)) {
			lv = new Node({url: tab.url, title: tab.title,
				time: Date.now(), tabId: tab.id, tabUpdate: true});
			histree.addNode(lv);
		} else if (lastVisit && lastVisit.url === tab.url &&
				lastVisit.historyVisit) {
			// onHistoryItemVisit already picked it up, add it to tree
			lv = lastVisit;
			if (tab.title) {
				lv.title = tab.title;
			}
			lv.tabId= tab.id;
			histree.addNode(lv);
			if (THUMBNAILS) {
				pendingCaptures[tab.id] = function () {
					chrome.tabs.captureVisibleTab(function (dataUrl) {
						lv.img = dataUrl;
						addToHistree(tab.id, lv);
					});
				};
			}
		} else {
			// add some info, let onHistoryItemVisit add it to tree
			lastVisit = new Node({url: tab.url, title: tab.title,
				time: Date.now(), tabId: tab.id, tabUpdate: true});
			lv = lastVisit;
			if (THUMBNAILS) {
				pendingCaptures[tab.id] = function () {
					chrome.tabs.captureVisibleTab(function (dataUrl) {
						lv.img = dataUrl;
						if (lv.historyVisit) {
							addToHistree(tab.id, lv);
						}
					});
				};
			}
		}
	}
}
chrome.tabs.onUpdated.addListener(onTabUpdated);

//------------------------------------------------------------------------------
// Callbacks for tab creation and removal

function onTabActivated(activeInfo) {
	lastActiveTabId = activeTabId;
	activeTabId = activeInfo.tabId;
}
chrome.tabs.onActivated.addListener(onTabActivated);

function onTabCreated(tab) {
	console.info("Tab created: ", tab);
}
chrome.tabs.onCreated.addListener(onTabCreated);

function onTabRemoved(tabId, removeInfo) {
	// tab was closed, cleanup histree data
	console.info("Tab removed: tabId = %d, removeInfo = %o", tabId, removeInfo);
}
chrome.tabs.onRemoved.addListener(onTabRemoved);

function onTabReplaced(addedTabId, removedTabId) {
	console.info("Tab replaced: addedTabId = %d, removedTabId = %d", addedTabId, removedTabId);
	histree.currentNode[addedTabId] = histree.currentNode[removedTabId];
}
chrome.tabs.onReplaced.addListener(onTabReplaced);

//------------------------------------------------------------------------------
// Testing/utility functions
var nodes = [
	{"url":"file:///","title":"Index of /","time":1405450159217,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/","title":"Index of /Users/","time":1405450169747,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/","title":"Index of /Users/chipjacks/","time":1405450215860,"tabId":224,"historyVisit":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450231137,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/class/","title":"Index of /Users/chipjacks/Dropbox/class/","time":1405450250071,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450256633,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/code/","title":"Index of /Users/chipjacks/Dropbox/code/","time":1405450257537,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450258500,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/other/","title":"Index of /Users/chipjacks/Dropbox/other/","time":1405450259527,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450260391,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/blog/","title":"Index of /Users/chipjacks/Dropbox/blog/","time":1405450262859,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450263557,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/books/","title":"Index of /Users/chipjacks/Dropbox/books/","time":1405450264458,"tabId":224,"historyVisit":true,"children":[]},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450265389,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/","title":"Index of /Users/chipjacks/","time":1405450384945,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450389417,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450393343,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450394178,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Counter-Strike%20Condition%20Zero.app/","title":"Index of /Users/chipjacks/Applications/Counter-Strike Condition Zero.app/","time":1405450394978,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450395766,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Counter-Strike.app/","title":"Index of /Users/chipjacks/Applications/Counter-Strike.app/","time":1405450396566,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450397315,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Team%20Fortress%202.app/","title":"Index of /Users/chipjacks/Applications/Team Fortress 2.app/","time":1405450398119,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450398999,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450404619,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/MacOS/","title":"Index of /Users/chipjacks/Applications/Contents/MacOS/","time":1405450405763,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450406754,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/Frameworks/","title":"Index of /Users/chipjacks/Applications/Contents/Frameworks/","time":1405450407493,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450408140,"tabId":224,"tabUpdate":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/Resources/","title":"Index of /Users/chipjacks/Applications/Contents/Resources/","time":1405450409544,"tabId":224,"historyVisit":true,"children":[]},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450410416,"tabId":224,"tabUpdate":true,"children":[]}
];

var buildTestTree = function() {
	var tr = new Tree();

	for (var i = 0; i < nodes.length; i++) {
		tr.addNode(new Node(nodes[i]));
	}
	return tr;
};

