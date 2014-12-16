// Histree Google Chrome Extension
// Javascript functions for recording page visits in tree data structure.
// Chip Jackson, September 2014

var histree;
var lastActiveTabId;
var Tree;
var tabAliasManager;

(function () {
	"use strict";

	//------------------------------------------------------------------------------
	histree = new Tree.Tree();
	lastActiveTabId = 0;
	tabAliasManager = new TabAliasManager();

	// stores last visited page for each tab
	var lastVisit = null,
		activeTabId = 0;

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
	// TabAliasManager Class for mapping between active tabId's and the
	// corresponding original tabId's found in histree. Allows new tabs
	// to be associated with old histree branches as tabs are closed and reopened.
	function TabAliasManager() {
		this.tabAliases = {};
	}

	TabAliasManager.prototype.update = function (addedTab, removedTab) {
		if (!removedTab) {
			this.tabAliases[addedTab] = {"orig": addedTab, "active": addedTab};
			return;
		}
		var alias = this.tabAliases[removedTab];
		if (alias.orig !== removedTab) {
			delete this.tabAliases[removedTab];
		}
		alias.active = addedTab;
		this.tabAliases[addedTab] = alias;
	};

	TabAliasManager.prototype.add = function (origTab, activeTab) {
		var alias = this.tabAliases[origTab];
		if (!alias) {
			this.tabAliases[origTab] = {"orig": origTab, "active": activeTab};
		} else {
			alias.active = activeTab;
		}
		this.tabAliases[activeTab] = alias;
	};

	TabAliasManager.prototype.remove = function (removedTab) {
		var alias = this.tabAliases[removedTab];
		if (!alias) {
			return;
		}
		alias.active = null;
		if (alias.orig !== removedTab) {
			delete this.tabAliases[removedTab];
		}
	};

	TabAliasManager.prototype.lookupActive = function (origTab) {
		return this.tabAliases[origTab].active;
	};

	TabAliasManager.prototype.lookupOrig = function (activeTab) {
		var alias = this.tabAliases[activeTab];
		if (alias) {
			return alias.orig;
		}
		else {
			this.tabAliases[activeTab] = {"orig": activeTab, "active": activeTab};
			return activeTab;
		}
	};

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
			lv = lastVisit;
			if (histItem.title) {
				lv.title = histItem.title;
			}
			histree.addNode(lv);
		} else {
			// add some info, let onTabUpdated add it to the tree
			lastVisit = new Tree.Node({url: histItem.url, title: histItem.title,
				time: Date.now(), historyVisit: true});
		}
	}
	chrome.history.onVisited.addListener(onHistoryItemVisited);

	function onTabUpdated(tabId, changeInfo, tab) {
		console.info("Tab updated: tabId = %d, tab = %o, changeInfo = %o", tabId, tab,
				changeInfo);

		var tabAlias = tabAliasManager.tabAliases[tabId];
		if (changeInfo.status === 'complete') {
			var lv;
			if (tab.title.match(newTabRegex)) {
				lv = new Tree.Node({url: tab.url, title: tab.title,
					time: Date.now(), tabId: tab.id, tabUpdate: true,
					openerTabId: tabAliasManager.lookupOrig(tab.openerTabId),
					tabAlias: tabAlias});
				histree.addNode(lv);
			} else if (lastVisit && lastVisit.url === tab.url &&
					lastVisit.historyVisit) {
				// onHistoryItemVisit already picked it up, add it to tree
				lv = lastVisit;
				if (tab.title) {
					lv.title = tab.title;
				}
				lv.tabId = tab.id;
				lv.tabAlias = tabAlias;
				lv.openerTabId = tabAliasManager.lookupOrig(tab.openerTabId);
				histree.addNode(lv);
			} else {
				// add some info, let onHistoryItemVisit add it to tree
				lastVisit = new Tree.Node({url: tab.url, title: tab.title,
					time: Date.now(), tabId: tab.id, tabUpdate: true,
					openerTabId: tabAliasManager.lookupOrig(tab.openerTabId),
					tabAlias: tabAlias});
			}
		}
	}
	chrome.tabs.onUpdated.addListener(onTabUpdated);

	//------------------------------------------------------------------------------
	// Callbacks for tab creation and removal

	function onTabActivated(activeInfo) {
		lastActiveTabId = activeTabId;
		activeTabId = tabAliasManager.lookupOrig(activeInfo.tabId);
	}
	chrome.tabs.onActivated.addListener(onTabActivated);

	function onTabCreated(tab) {
		console.info("Tab created: ", tab);
	}
	chrome.tabs.onCreated.addListener(onTabCreated);

	function onTabRemoved(tabId, removeInfo) {
		// tab was closed, cleanup histree data
		console.info("Tab removed: tabId = %d, removeInfo = %o", tabId, removeInfo);
		tabAliasManager.remove(tabId);
	}
	chrome.tabs.onRemoved.addListener(onTabRemoved);

	function onTabReplaced(addedTabId, removedTabId) {
		console.info("Tab replaced: addedTabId = %d, removedTabId = %d", addedTabId, removedTabId);
		tabAliasManager.update(addedTabId, removedTabId);
		// histree.currentNode[addedTabId] = histree.currentNode[removedTabId];
	}
	chrome.tabs.onReplaced.addListener(onTabReplaced);

})();
