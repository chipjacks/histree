
// Tree and node classes

var bkg = chrome.extension.getBackgroundPage();
var debug = true;

var histrees = {};

// Work around for old browsers that haven't implemented Date().now()
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

function pageData(tab) {
  // class to store data for histree nodes
  this.lastVisit = Date.now();
  this.url = tab.url;
  this.title = tab.title;
  this.favicon = tab.favIconUrl;
}

pageData.prototype.update() {
  this.lastVisit = Date.now();
}

function Node(parent, data) {
  // Adds child node to parent containing data.
  this.data = data;
  this.parent = parent;
  this.children = new Array();
  if (this.parent) {
    this.parent.children.push(this);
  }
}

function Tree(root_data) {
  // Creates a tree with root node containing root_data.
  // The tree keeps track of a currentNode, our current location on the tree.
  this.root = new Node(null, root_data);
  this.currentNode = this.root;
}

Tree.prototype.addNode = function (data) {
  // Adds a child node to tree's currentNode, containing data
  node = new Node(this.currentNode, data);
  this.currentNode = node;
  return node;
}

Tree.prototype.toString = function () {
  return this.root.toString();
}
  

Node.prototype.toString = function () {
  return this.data + "\n" + this.children.join("\n");
}

function processNewTab(tab) {
  if (debug) {
    bkg.console.log("New tab created.\n" +
      "id = " + tab.id +
      "\nhighlighted = " + tab.highlighted +
      "\nactive = " + tab.active +
      "\nurl = " + tab.url +
      "\nfaviconUrl = " + tab.faviconUrl +
      "\nstatus = " + tab.status);
  }
  // Create a new tree to store the histree for this tab.
  histrees[tab.id] = new Tree(tab.url);
}

chrome.tabs.onCreated.addListener(processNewTab);

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
      "\ntimeStamp = " + details.timeStamp);
  }
  // Add URL to tree
  if (details.transitionType == "link" || details.transitionType == "typed") {
    chrome.tabs.query({active: true}, function (tabs) {
      histrees[tabs[0].id].addNode(details.url);
    });
  }
}

chrome.webNavigation.onCommitted.addListener(processNav);

// if (chrome.webNavigation && chrome.webNavigation.onCommitted) {
//   chrome.webNavigation.onCommitted.addListener(processNav);
//   console.log("Added webNavigation onComittedListener");
// } else {
//   console.log("webNavigation undefined")
// }
