// Histree Google Chrome Extension
// Javascript functions for parsing histree data structure and displaying in
// popup window.
// Chip Jackson, September 2014

var HistreeDisplay;

(function () {
	"use strict";

	//------------------------------------------------------------------------------
	// GLOBALS
	//var green = "#5CD65C";
	var green = "#00cc00",
		lightgreen = "#00ff00",
		darkgreen = "#009900",
		brown = "#AD855C",
		CHILD_COLOR = "#11CAF0",
		SIBLING_COLOR = "#3FD657",
		PARENT_COLOR = "#FF5F58",
		CURRENT_NODE_COLOR = "#FF5F58";

	//------------------------------------------------------------------------------
	// Methods to build HTML list of histree links in popup

	// Called on popup load to parse and recursively display nodes of histree
	function displayHistree(startNode) {
		while (startNode.children.length) {
			startNode = startNode.children[startNode.children.length - 1];
		}
		var hd = new HistreeDisplay(startNode),
			node = hd.curNode;
		displayNode(node, hd.getIndent());
		node = hd.next();
		while (node) {
			displayNode(node, hd.getIndent());
			node = hd.next();
		}
		drawTree();
		document.dispatchEvent(popupLoadComplete);
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
		var visitList = document.getElementById('visit-list'),
			li = document.createElement('li'),
			title = document.createElement('div'),
			a = document.createElement('a'),
			lastvisit = document.createElement('div'),
			domain = document.createElement('div');

		li.className = "entry";
		li.setAttribute("id", "li" + node.id);
		if (node.parent) {
			li.setAttribute("parentId", "li" + node.parent.id);
		}
		li.href = node.url;
		li.style.marginLeft = 25 + indent * 20 + "px";
		li.style.cursor = "pointer";

		li.style.backgroundImage = "url(chrome://favicon/" + node.url + ")";
		if (node.url === 'chrome://newtab/') {
			li.style.backgroundImage = "url(assets/new_tab_icon.png)";
		}

		title.className = "title";
		domain.className = "domain";
		lastvisit.className = "lastvisit";

		a.href = node.url;
		a.innerHTML = node.title;

		// Setup event callbacks
		li.onclick = function () {
			if (node.tabAlias.active) {
				chrome.tabs.update(node.tabAlias.active, {url: node.url, active: true}, function (tab) {
					if (chrome.runtime.lastError) {
						console.error("Failed to update tab");
					} else {
						chrome.windows.update(tab.windowId, {focused: true});
					}
				});
			} else {
				chrome.tabs.create({url: node.url}, function (tab) {
					addTabAlias(node.tabAlias.orig, tab.id);
				});
			}
		};
		li.onmouseover = function () {
			var host = node.url;
			domain.innerHTML = host;

			lastvisit.innerHTML = lastVisitToString(node.time);
			colorBranch(li, green);
			colorPoint(li, green);
			//highlightRelatives(node);
		};
		li.onmouseout = function () {
			colorBranch(li, brown);
			colorPoint(li, brown);
			domain.innerHTML = "";
			lastvisit.innerHTML = "";
			//unhighlightRelatives(node);
		};

		title.appendChild(a);
		li.appendChild(title);
		li.appendChild(lastvisit);
		li.appendChild(domain);
		visitList.appendChild(li);
		li.coords = {x: parseInt(li.style.marginLeft) - 8, y: li.offsetTop + 11};
	}

	function highlightRelatives(node) {
		var i;
		for (i = 0; i < node.children.length; i += 1) {
			colorNode(node.children[i], CHILD_COLOR);
		}
		if (node.parent) {
			colorNode(node.parent, PARENT_COLOR);
			for (i = 0; i < node.parent.children.length; i += 1) {
				colorNode(node.parent.children[i], SIBLING_COLOR);
			}
		}
	}

	function unhighlightRelatives(node) {
		var i;
		for (i = 0; i < node.children.length; i += 1) {
			colorNode(node.children[i], brown);
		}
		if (node.parent) {
			colorNode(node.parent, brown);
			for (i = 0; i < node.parent.children.length; i += 1) {
				colorNode(node.parent.children[i], brown);
			}
		}
	}

	function colorNode(node, color) {
		if (!node) { return; }
		var li = document.getElementById("li" + node.id);
		colorPoint(li, color);
	}

	//------------------------------------------------------------------------------
	// Utility Methods

	function lastVisitToString(lv) {
		var now = new Date(),
			yesterday = new Date(),
			secs = (now.getTime() - lv) / 1000,
			date = new Date(lv),
			hours,
			months;
		
		yesterday.setDate(now.getDate() - 1);
		if (secs < 60) {
			return "less then a min ago";
		} else if (secs < 3600) {
			return Math.round(secs / 60) + " min ago";
		} else if (secs < 3600 * 12) {
			hours = Math.round(secs / 60 / 60);
			if (hours === 1) {
				return "about an hour ago";
			} else {
				return hours + " hours ago";
			}
		} else if (secs < 3600 * 24 && date.getDay() === now.getDay()) {
			// visit was earlier today
			hours = Math.round(secs / 60 / 60);
			return hours + " hours ago";
		} else if (yesterday.toDateString() === now.toDateString()) {
			// visit was yesterday
			return "yesterday at " + date.toTimeString();
		} else {
			months = ['January', 'February', 'March', 'April', 'May', 'June',
				'July', 'August', 'September', 'October', 'November', 'December'];
			// just print date and time of visit
			return months[date.getMonth()] + " " + date.getDay();
		}
	}

	//------------------------------------------------------------------------------
	// Methods to draw tree branches and leaves using SVG

	var svg;

	// Functions for drawing the SVG lines and points linking histree nodes
	function drawTree() {
		var list = document.getElementById('visit-list'),
			entries = list.children,
			i;
		
		svg = document.createDocumentFragment();
		
		for (i = 1; i < entries.length; i += 1) {
			drawBranch(entries[i], brown);
		}
		document.getElementById('link-svg').innerHTML = svg.innerHTML;
	}

	function drawBranch(toLi, color) {
		//console.info("drawing branch %s", toLi.id);
		var parent = document.getElementById(toLi.getAttribute("parentId")),
			id = toLi.id;
		if (parent) {
			drawLine(parent.coords, toLi.coords, color, id);
		}
		drawPoint(toLi.coords, id);
	}

	function colorBranch(toLi, color) {
		var parent = document.getElementById(toLi.getAttribute("parentId")),
			id = toLi.id;
		if (parent) {
			colorLine(id, color);
			colorBranch(parent, color);
		}
		colorPoint(toLi);
	}

	function drawLine(a, b, color, id) {
		var line = '<polyline id="' + id +
			'line" points="' + a.x + ',' + a.y + ' ' + a.x + ',' + (b.y + 12) +
			' ' + a.x + ',' + (b.y + 12) + ' ' + b.x + ',' + b.y + '" ' +
			'style="fill: none; stroke: ' + color + '; stroke-width: 3;"/>';
		svg.innerHTML += line;
	}

	function colorLine(id, color) {
		var line = document.getElementById(id + 'line'),
			parent = line.parentNode;
		parent.removeChild(line);
		line.style.stroke = color;
		parent.appendChild(line);
	}

	function drawPoint(a, id) {
		var circle = '<circle id="' + id + 'point" cx="' + a.x + '" cy="' + a.y +
			'" r="4" stroke="' + brown + '" fill="' + brown + '" />';
		svg.innerHTML += circle;
	}

	function colorPoint(li, color) {
		var point = document.getElementById(li.id + "point");
		var parent = point.parentNode;
		parent.removeChild(point);
		if (color) {
			point.style.stroke = color;
			point.style.fill = color;
		}
		parent.appendChild(point);
	}

	function selectNode(node) {
		if (!node) {
			return;
		}
		function addToFunc(prevFunc, addedFunc) {
			return function () {
				prevFunc();
				addedFunc();
			};
		}
		var li = document.getElementById("li" + node.id);
		// TODO: fix intermittent scrollTo bug.
		li.scrollIntoView(true);
		console.log("scrollTop: %i, offsetTop: %i", document.body.scrollTop, li.offsetTop);
		colorPoint(li, CURRENT_NODE_COLOR);
		li.onmouseover = addToFunc(li.onmouseover, function() {colorPoint(li, CURRENT_NODE_COLOR);});
		li.onmouseout = addToFunc(li.onmouseout, function() {colorPoint(li, CURRENT_NODE_COLOR);});
	}

	function resetTree() {
		chrome.runtime.getBackgroundPage(
			function (bgPage) {
				bgPage.histree.reset();
				location.reload(true);
			});
	}

	function addTabAlias(origTab, activeTab) {
		chrome.runtime.getBackgroundPage(
			function (bgPage) {
				bgPage.tabAliasManager.add(origTab, activeTab);
			});
	}

	var popupLoadComplete = new Event('popupLoadComplete');

	document.addEventListener('DOMContentLoaded',
		function () {
			chrome.runtime.getBackgroundPage(
				function (bgPage) {
					var histree = bgPage.histree;
					if (typeof histree === 'undefined' || histree.root === null) {
						var div = document.getElementById('inner-div'),
							img = document.createElement('img');
						img.src = 'assets/histree_full_logo.png';
						div.appendChild(img);
						div.className = "empty-tree";
						document.getElementById('reset-link').innerHTML = '';
						return;
					}
					document.addEventListener('popupLoadComplete', function () {
						console.log("popup loaded");
						chrome.tabs.query({active: true, currentWindow: true},
							function (tabs) {
								if (tabs.length > 1) {
									console.error("chrome.tabs.query returned more than 1 active tab.");
								}
								var tab = tabs[0];
								selectNode(histree.currentNode[bgPage.tabAliasManager.lookupOrig(tab.id)]);
							});
					});
					displayHistree(histree.root);
					document.getElementById('reset-link').onclick = resetTree;
				});
		});

})();
