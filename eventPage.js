
// Tree and node classes

var bkg = chrome.extension.getBackgroundPage();
var debug = true;
var thumbnails = true;

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

pageData.prototype.update = function (timeStamp) {
  // updates histree node when user revisits it
  this.lastVisit = timeStamp;
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
    bkg.console.log("Node added to tree: " + this);
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
  
Node.prototype.toString = function () {
  return this.data.title + "\n" + this.children.join("\n");
}

function createAddNavClosure(details) {
  return function(tab) {
    addNavToTree(details, tab);
  };
}

window.addLastNav = function (tab) {};

function processNav(details) {
  if (debug) {
    bkg.console.log("Web nav committed!\n" +
      "tabId = " + details.tabId +
      "\nurl = " + details.url +
      "\nprocessId = " + details.processId +
      "\nframeId = " + details.frameId +
      "\ntransitionType = " + details.transitionType +
      "\ntransitionQualifiers = " + details.transitionQualifiers +
      "\nparentFrameId = " + details.parentFrameId +
      "\ntimeStamp = " + details.timeStamp
      );
  }

  if (details.transitionQualifiers != "forward_back" &&
    details.transitionType != "link" && details.transitionType != "typed"
    && details.transitionType != "generated") {
    return;
  }

  window.addLastNav = createAddNavClosure(details);
}

function addNavToTree(details, tab) {
    var histree = histrees[tab.id];
    if (!histree) {
      // initialize the histree
      histrees[tab.id] = new Tree(null);
      histree = histrees[tab.id];
    }
    if (histree.urls[details.url]) {
      // it's already in the histree
      histree.updateNode(details.url, details.timeStamp);
    } else {
      // add new node to tree
      if (thumbnails) {
        chrome.tabs.captureVisibleTab(function (dataUrl) {
          bkg.console.log("captured: " + dataUrl);
          histree.addNode(new pageData(details.url, tab.title, tab.favIconUrl, 
            details.timeStamp, dataUrl));
        });
      } else {
        histree.addNode(new pageData(details.url, tab.title, tab.favIconUrl, 
          details.timeStamp, null));
      }
    }
}

alert("background page loaded");

chrome.webNavigation.onCommitted.addListener(processNav);
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.active) {
    window.addLastNav(tab);
  }
});

chrome.runtime.onSuspend.addListener(function () {
  bkg.console.log("event page suspended");
});
