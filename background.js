// Histree Google Chrome Extension
// Javascript functions for recording page visits in tree data structure
// Chip Jackson, July 2014

"use strict";

//------------------------------------------------------------------------------
// GLOBALS
var histree = new Tree();	// inidividual tab histrees, keyed by tabId
var lastVisit = null;			// stores last visited page for each tab
var THUMBNAILS = false;
var lastActiveTabId = 0;
var activeTabId = 0;

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
