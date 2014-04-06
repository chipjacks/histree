// Histree Google Chrome Extension
// Javascript functions for tracking page visits and building histree
// Chip Jackson, March 2014

var lastVisit = {};
var pendingCaptures = {};
var histrees = {};

// pageData Class
function pageData(url, title, favicon, timestamp, img) {
  // class to store data for histree nodes
  this.lastVisit = timestamp;
  this.url = url;
  this.title = title;
  this.favicon = favicon;
  this.img = img;
}

// Node Class
function Node(parent, data) {
  // Adds child node to parent containing data.
  this.data = data;
  this.parent = parent;
  this.children = new Array();
  if (this.parent) {
    this.parent.children.push(this);
  }
}

Node.prototype.toString = function () {
  return this.data.title + "\n" + this.children.join("\n");
}

// Tree Class
function Tree(root_data) {
  // Creates a tree with root node containing root_data.
  // The tree keeps track of a currentNode, our current location on the tree.
  if (!root_data) {
    //create an empty tree
    this.root = null;
  } else {
    this.root = new Node(null, root_data);
  }
  this.currentNode = this.root;
  this.urls = {};
}

Tree.prototype.addNode = function (data) {
  // Adds a child node to tree's currentNode, containing data
  node = new Node(this.currentNode, data);
  if (!this.root) {
    this.root = node;
  }
  this.currentNode = node;
  this.urls[data.url] = node;
  return node;
}

Tree.prototype.updateNode = function (url, timestamp) {
  // Looks for node with given url. If found, update it's lastVisit and sets it
  // to be currentNode. Otherwise raise exception.
  node = this.urls[url];
  if (!node) {
    throw "Tree.updateNode failed: invalid url";
  }
  node.data.lastVisit = timestamp;
  this.currentNode = node;
}

Tree.prototype.toString = function () {
  return this.root.toString();
}
  

function addToHistree(tabId, visit) {
  var lv = visit;

  var histree = histrees[tabId];
  if (!histree) {
    // initialize the histree
    histrees[tabId] = new Tree(null);
    histree = histrees[tabId];
  }

  if (histree.urls[lv.url]) {
    histree.updateNode(lv.url, lv.time, lv.img);
  } else {
    histree.addNode(new pageData(lv.url, lv.title, 
      "chrome://favicon/" + lv.url, lv.time, lv.img));
  }
}

function processTabUpdate(tab) {
  var lv;
  if (lastVisit[tab.id] && lastVisit[tab.id].url == tab.url &&
    lastVisit[tab.id].historyVisit) {
    // processHistoryVisit already picked it up, add it to tree
    lv = lastVisit[tab.id];
    if (!lv.title) {
      lv.title = tab.title;
    }
    pendingCaptures[tab.id] = function () {
      chrome.tabs.captureVisibleTab(function (dataUrl) {
        lv.img = dataUrl;
        addToHistree(tab.id, lv);
      });
    };
  } else if (!histrees[tab.id]) {
    // this is a new tab
    lv = {url: tab.url, title: tab.title, time: Date.now(), img: null,
      tabUpdate: true};
    lastVisit[tab.id] = lv;
    pendingCaptures[tab.id] = function () {
      chrome.tabs.captureVisibleTab(function (dataUrl) {
        lv.img = dataUrl;
        addToHistree(tab.id, lv);
      });
    };
  } else {
    // add some info, let processHistoryVisit add it to tree
    lastVisit[tab.id] = {url: tab.url, title: tab.title,
      time: Date.now(), img: null, tabUpdate: true};
    lv = lastVisit[tab.id];
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

function processHistoryVisit(visit) {
  chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT},
    function (tabs) {
      var tab = tabs[0];
      if (lastVisit[tab.id] && lastVisit[tab.id].url == visit.url &&
        lastVisit[tab.id].tabUpdate) {
        // processTabUpdate already picked it up, add it to tree if it already
        // has an img
        if (lastVisit[tab.id].img) {
          addToHistree(tab.id, lastVisit[tab.id]);
        } else {
          lastVisit[tab.id].historyVisit = true;
        }
      } else {
        // add some info, let processTabUpdate add it to tree
        lastVisit[tab.id] = {url: visit.url, title: visit.title,
          time: Date.now(), img: null, historyVisit: true};
      }
    }
  );
}

// Work around for old browsers that haven't implemented Date().now()
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading' && tab.active && pendingCaptures[tab.id]) {
    // tab is changing pages, try and capture last page if we haven't already
    pendingCaptures[tab.id].call();
    pendingCaptures[tab.id] = function () { void(0); };
  } else if (changeInfo.status == 'complete' && tab.active) {
    processTabUpdate(tab);
    // try and capture tab after a half second to let javascript finish executing
    setTimeout(function () {
      pendingCaptures[tab.id].call();
      pendingCaptures[tab.id] = function () {void(0);};
    }, 500);
   }
});

chrome.history.onVisited.addListener(function (result) {
  processHistoryVisit(result);
});
