// Histree Google Chrome Extension
// Javascript functions for recording page visits in tree data structure
// Chip Jackson, March 2014

// 4/13/2014: just started refactoring popup.js

"use strict";

//------------------------------------------------------------------------------
// GLOBALS
var histrees = {};	// inidividual tab histrees, keyed by tabId
var lastVisit = {};	// stores last visited page for each tab
var THUMBNAILS = false;

function init() {
// Called when extension is installed or upgraded
}
chrome.runtime.onInstalled.addListener(init);

//------------------------------------------------------------------------------
// Tree functions
function Tree() {
	this.root = null;
	this.currentNode = null;
	this.urls = {};		// allow for fast node lookup by url
}

Tree.prototype.addNode = function (node) {
// appends node as child of Tree.currentNode, points Tree.currentNode to node.
	console.info("Tree.prototype.addNode called with: ", node);

	// see if the url is already in the tree
	var oldNode = this.urls[node.url];
	if (oldNode) {
		oldNode.time = node.time;
		this.currentNode = oldNode;
		return;
	}

	// give the node a unique id
	node.id = nextNodeId();

	// add it to the tree
	node.children = [];
	if (!this.root) {
		this.root = node;
	} else {
		node.parent = this.currentNode;
		this.currentNode.children.push(node);
	}
	
	// add node url to urls hash
	this.urls[node.url] = node;

	// traverse to new currentNode
	this.currentNode = node;

	// make sure node has all data filled in
	if (!isValidNode(node)) {
		console.error("Tree.prototype.addNode called with invalid node: ", node);
	}
};

function isValidNode(node) {
// checks that node object contains all required data fields
	return (
		node.url &&
		node.title &&
		node.time &&
		node.id &&
		node.children &&
		node.tabId		// may not be needed?
	);
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
function onHistoryItemVisited(histItem) {
	console.info("HistoryItem visited: ", histItem);

	// lookup tabid
	chrome.tabs.query({active: true, currentWindow: true},
		function (tabs) {
			if (tabs.length > 1) {
				console.error("chrome.tabs.query returned more than 1 active tab.");
			}

			var tab = tabs[0];
			if (lastVisit[tab.id] && lastVisit[tab.id].url === histItem.url &&
					lastVisit[tab.id].tabUpdate) {
				// onTabUpdated already picked it up, add it to the tree
				if (THUMBNAILS && !lastVisit[tab.id].img) {
					// still need to capture a thumbnail for it, let pendingCaptures
					// callback add it to the tree
					lastVisit[tab.id].historyVisit = true;
				} else {
					histrees[tab.id].addNode(lastVisit[tab.id]);
				}
			} else {
				// add some info, let onTabUpdated add it to the tree
				lastVisit[tab.id] = {url: histItem.url, title: histItem.title,
					time: Date.now(), tabId: tab.id, historyVisit: true};
			}
		});
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
	if (changeInfo.status === 'complete' && tab.active) {
		var lv;
		if (lastVisit[tab.id] && lastVisit[tab.id].url === tab.url &&
				lastVisit[tab.id].historyVisit) {
			// onHistoryItemVisit already picked it up, add it to tree
			lv = lastVisit[tab.id];
			if (!lv.title) {
				lv.title = tab.title;
			}
			histrees[tab.id].addNode(lv);
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
			lastVisit[tab.id] = {url: tab.url, title: tab.title,
				time: Date.now(), tabId: tab.id, tabUpdate: true};
			lv = lastVisit[tab.id];
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
function onTabCreated(tab) {
	console.info("Tab created: ", tab);

	histrees[tab.id] = new Tree();
}
chrome.tabs.onCreated.addListener(onTabCreated);

function onTabRemoved(tabId, removeInfo) {
	// tab was closed, cleanup histree data
	console.info("Tab removed: tabId = %d, removeInfo = %o", tabId, removeInfo);

	delete histrees[tabId];
	delete lastVisit[tabId];
}
chrome.tabs.onRemoved.addListener(onTabRemoved);
