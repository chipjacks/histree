// Tree and node classes
// TODO:
// deal with fast page switches

var bkg = chrome.extension.getBackgroundPage();
var debug = true;
var thumbnails = true;
var lastVisit = {};
var pendingCaptures = {};

var histrees = {};

// Work around for old browsers that haven't implemented Date().now()
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

function pageData(url, title, favicon, timestamp, img) {
  // class to store data for histree nodes
  this.lastVisit = timestamp;
  this.url = url;
  this.title = title;
  this.favicon = favicon;
  this.img = img;
}

function Node(parent, data) {
  // Adds child node to parent containing data.
  this.data = data;
  this.parent = parent;
  this.children = new Array();
  if (this.parent) {
    this.parent.children.push(this);
  }
   if (debug) {
     bkg.console.log("Node added to tree: " + this.data.url);
   }
}

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

Tree.prototype.updateNode = function (url, timestamp, img) {
  // Looks for node with given url. If found, update it's lastVisit and sets it
  // to be currentNode. Otherwise raise exception.
  node = this.urls[url];
  if (!node) {
    throw "Tree.updateNode failed: invalid url";
  }
  node.data.lastVisit = timestamp;
  node.data.img = img;
  this.currentNode = node;
}

Tree.prototype.toString = function () {
  return this.root.toString();
}
  
Node.prototype.toString = function () {
  return this.data.title + "\n" + this.children.join("\n");
}

function addToHistree(tabId, visit) {
  var lv = visit;

  var histree = histrees[tabId];
  if (!histree) {
    // initialize the histree
    histrees[tabId] = new Tree(null);
    histree = histrees[tabId];
  }

  if (!(lv.url && lv.title && lv.time && lv.img)) {
    bkg.console.log("Visit missing data!" + JSON.stringify(lv));
  }

  if (histree.urls[lv.url]) {
    histree.updateNode(lv.url, lv.time, lv.img);
  } else {
    histree.addNode(new pageData(lv.url, lv.title, 
      "chrome://favicon/" + lv.url, lv.time, lv.img));
  }
}

function processTabUpdate(tab) {
  if (lastVisit[tab.id] && lastVisit[tab.id].url == tab.url &&
    lastVisit[tab.id].historyVisit) {
    // processHistoryVisit already picked it up, add it to tree
    var lv = lastVisit[tab.id];
    if (!lv.title) {
      lv.title = tab.title;
    }

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

    var lv = lastVisit[tab.id];

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
  chrome.tabs.query({active: true}, function (tabs) {
    var tab = tabs[0];
    if (lastVisit[tab.id] && lastVisit[tab.id].url == visit.url &&
      lastVisit[tab.id].tabUpdate) {
      // processTabUpdate already picked it up, add it to tree if it already has an img
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
  });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  bkg.console.log("tab updated: " + changeInfo.status);
  if (changeInfo.status == 'loading' && tab.active && pendingCaptures[tab.id]) {
    pendingCaptures[tab.id].call();
    pendingCaptures[tab.id] = function () { void(0); };
  } else if (changeInfo.status == 'complete' && tab.active) {
    // bkg.console.log("tab updated: " + tab.title + "  " + tab.url);
    processTabUpdate(tab);
    // try and capture the tab after a half second
    setTimeout(function () {
      pendingCaptures[tab.id].call();
      pendingCaptures[tab.id] = function () {void(0);};
    }, 500);
   }
});

chrome.history.onVisited.addListener(function (result) {
  bkg.console.log("historyitem visited: " + result.title + "  " + result.url);
  processHistoryVisit(result);
});
