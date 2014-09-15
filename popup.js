// Histree Google Chrome Extension
// Javascript functions for parsing histree data structure and displaying in
// popup window.
// Chip Jackson, September 2014

"use strict";

//------------------------------------------------------------------------------
// GLOBALS
//var green = "#5CD65C";
var green = "#00cc00";
var lightgreen = "#00ff00";
var darkgreen = "#009900";
var brown = "#AD855C";
var CHILD_COLOR = "#11CAF0";
var SIBLING_COLOR = "#3FD657";
var PARENT_COLOR = "#FF5F58";

//------------------------------------------------------------------------------
// Methods to build HTML list of histree links in popup

// Called on popup load to parse and recursively display nodes of histree
function displayHistree(node) {
	var startNode = node;
	while (startNode.children.length) {
		startNode = startNode.children[startNode.children.length - 1];
	}
	var hd = new HistreeDisplay(startNode);
	var node = hd.curNode;
	displayNode(node, hd.getIndent());
	var count = 0;
	while (node = hd.next()) {
		displayNode(node, hd.getIndent());
		count += 1;
		//if (count > 10) break;
	}

	drawTree();
}

function displayNode(node, indent) {
	// HTML DOM structure:
	// <li class="entry" id="li7" parentid="li2" style="background-image: 
	//   url(chrome://favicon/;">
	//   <div class="title">
	//     <a href="https://chrome.google.com/webstore/">
	//       Chrome Web Store - Extensions
	//     </a>
	//   </div>
	//   <div class="lastvisit">
	//     5 min ago
	//   </div>
	//   <div class="domain">
	//     chrome.google.com
	//   </div>
	//</li>
	var visitList = document.getElementById('visit-list');

	var li = document.createElement('li');
	var title = document.createElement('div');
	var a = document.createElement('a');
	var lastvisit = document.createElement('div');
	var domain = document.createElement('div');

	li.className = "entry";
 	li.setAttribute("id", "li" + node.id);
	if (node.parent) {
 		li.setAttribute("parentId", "li" + node.parent.id);
	}
	li.href = node.url;
	li.style.marginLeft = 25 + indent * 20 + "px";
	li.style.cursor = "pointer";

	li.style.backgroundImage = "url(chrome://favicon/" + node.url + ")";

	title.className = "title";
	domain.className = "domain";
	lastvisit.className = "lastvisit";

	a.href = node.url;
	a.innerHTML = node.title;

	// Setup event callbacks
	li.onclick = function () {
		chrome.tabs.update(node.tabId, {url: node.url});
		// eventPage.updateNode(.url, Date.now);
	}
	li.onmouseover = function () {
		var host = node.url;
		domain.innerHTML = host;

		lastvisit.innerHTML = lastVisitToString(node.time);
		colorBranch(li, green);
		colorPoint(li, green);
		highlightRelatives(node);
	}
	li.onmouseout = function () {
		colorBranch(li, brown);
		colorPoint(li, brown);
		domain.innerHTML = "";
		lastvisit.innerHTML = "";
		unhighlightRelatives(node);
	}

	title.appendChild(a);
	li.appendChild(title);
	li.appendChild(lastvisit);
	li.appendChild(domain);
	visitList.appendChild(li);
}

function highlightRelatives(node) {
	for (var i = 0; i < node.children.length; i++) {
		colorNode(node.children[i], CHILD_COLOR);
	}
	if (node.parent) {
		colorNode(node.parent, PARENT_COLOR);
		for (var i = 0; i < node.parent.children.length; i++) {
			colorNode(node.parent.children[i], SIBLING_COLOR);
		}
	}
}

function unhighlightRelatives(node) {
	for (var i = 0; i < node.children.length; i++) {
		colorNode(node.children[i], brown);
	}
	if (node.parent) {
		colorNode(node.parent, brown);
		for (var i = 0; i < node.parent.children.length; i++) {
			colorNode(node.parent.children[i], brown);
		}
	}
}

function colorNode(node, color) {
	if (!node) return;
 	var li = document.getElementById("li" + node.id);
 	colorPoint(li, color);
}

//------------------------------------------------------------------------------
// Utility Methods

function lastVisitToString(lv) {
	var now = new Date();
	var yesterday = new Date();
	yesterday.setDate(now.getDate() - 1);
	var secs = (now.getTime() - lv) / 1000;
	var date = new Date(lv);
	if (secs < 60) {
		return "less then a min ago";
	} else if (secs < 3600) {
		return Math.round(secs / 60) + " min ago";
	} else if (secs < 3600 * 12) {
		var hours = Math.round(secs / 60 / 60);
		if (hours == 1) {
			return "about an hour ago";
		} else {
			return hours + " hours ago";
		}
	} else if (secs < 3600 * 24 && date.getDay() == now.getDay()) {
		// visit was earlier today
		var hours = Math.round(secs / 60 / 60);
		return hours + " hours ago";
	} else if (yesterday.toDateString() == now.toDateString()) {
		// visit was yesterday
		return "yesterday at " + date.toTimeString();
	} else {
		var months = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December']
				// just print date and time of visit
				return months[date.getMonth()] + " " + date.getDay();
	}
}

//------------------------------------------------------------------------------
// Methods to draw tree branches and leaves using SVG

// Functions for drawing the SVG lines and points linking histree nodes
function drawTree() {
	var list = document.getElementById('visit-list');
	var entries = list.children;
	for (var i = 1; i < entries.length; i++) {
		drawBranch(entries[i], brown);
	}
}

function drawBranch(toLi, color) {
	console.info("drawing branch %s", toLi.id);
	var parent = document.getElementById(toLi.getAttribute("parentId"));
	var id = toLi.id;
	if (parent) {
		drawLine(getCoords(parent), getCoords(toLi), color, id);
	}
	drawPoint(getCoords(toLi), id);
}

function colorBranch(toLi, color) {
	var parent = document.getElementById(toLi.getAttribute("parentId"));
	var id = toLi.id;
	if (parent) {
		colorLine(id, color);
		colorBranch(parent, color);
	}
	colorPoint(toLi, brown);
}

function drawLine(a, b, color, id) {
	var svg = document.getElementById('link-svg'); //TODO: make static
	var line = '<polyline id="' + id + 
		'line" points="' + a.x + ',' + a.y + ' ' + a.x + ',' + (b.y + 12) + 
		' ' + a.x + ',' + (b.y + 12) + ' ' + b.x + ',' + b.y + '" ' +
		'style="fill: none; stroke: ' + color + '; stroke-width: 3;"/>';
	svg.innerHTML += line;
}

function colorLine(id, color) {
	var line = document.getElementById(id + 'line');
	var parent = line.parentNode;
	parent.removeChild(line);
	line.style.stroke = color;
	parent.appendChild(line);
}

function drawPoint(a, id) {
	var svg = document.getElementById('link-svg'); //TODO: make static
	var circle = '<circle id="' + id + 'point" cx="' + a.x + '" cy="' + a.y +
		'" r="4" stroke="' + brown + '" fill="' + brown + '" />';
	svg.innerHTML += circle;
}

function colorPoint(li, color) {
	var point = document.getElementById(li.id + "point");
	var parent = point.parentNode;
	parent.removeChild(point);
	point.style.stroke = color;
	point.style.fill = color;
	parent.appendChild(point);
}

function getCoords(li) {
	return {x: parseInt(li.style.marginLeft) - 8, y: li.offsetTop + 11};
}

function selectNode(node) {
	if (!node) {
		return;
	}
	var li = document.getElementById("li" + node.id);
	li.scrollIntoView();
}

document.addEventListener('DOMContentLoaded',
	function () {
		chrome.runtime.getBackgroundPage(
			function (bgPage) {
				if (typeof TESTING != "undefined" && TESTING == true) {
					// displayHistree(bgPage.buildTestTree());
					return;
				}
				var histree = bgPage.histree;
				if (!histree) {
					console.error("No histree found for tab %d", tab.id);
					return;
				}
				displayHistree(histree.root);

				chrome.tabs.query({active: true, currentWindow: true},
					function (tabs) {
						if (tabs.length > 1) {
							console.error("chrome.tabs.query returned more than 1 active tab.");
						}
						var tab = tabs[0];
						setTimeout(function() {selectNode(histree.currentNode[tab.id]);}, 100);
					});
			});
	});

document.addEventListener('load',
	function () {
		chrome.runtime.getBackgroundPage(
			function (bgPage) {
				var histree = bgPage.histree;
				if (!histree) {
					console.error("No histree found for tab %d", tab.id);
					return;
				}

				chrome.tabs.query({active: true, currentWindow: true},
					function (tabs) {
						if (tabs.length > 1) {
							console.error("chrome.tabs.query returned more than 1 active tab.");
						}
						var tab = tabs[0];
						selectNode(histree.currentNode[tab.id]);
					});
			});
	});

