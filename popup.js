 
// TODO:
// get it to work with websites like facebook
// favicons
// set up event page and localStorage
// convert webRequest to declaritiveWebRequest

var green = "#5CD65C";
var brown = "#AD855C";

// Work around for old browsers that haven't implemented Date().now()
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

function displayHistree(eventPage) {
  var visitList = document.getElementById('visit-list');
  chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {
    if (tabs.length != 1) { alert("Ambiguous tab query: " + tabs.length); }
    var histree = eventPage.histrees[tabs[0].id];
    displayNode(tabs[0].id, visitList, histree.root, 0, 0);
    setTimeout(drawTree, 20);
  });
}

function drawTree() {
  var list = document.getElementById('visit-list');
  var entries = list.children;
  for (var i = 1; i < entries.length; i++) {
    drawBranch(entries[i], brown);
  }
}

function nextId() {
  if (!nextId.i) {
    nextId.i = 0;
  }
  nextId.i += 1;
  return nextId.i;
}

function displayNode(tabId, list, node, initialIndent, parentId) {
  var myId = nextId();
  if (node.children) {
    // display it's children, youngest first
    var children = node.children.sort(function (a, b) {
      return b.data.lastVisit - a.data.lastVisit; // sort: youngest to oldest
    });
    for (var i = 0; i < children.length; i++) {
      displayNode(tabId, list, children[i], initialIndent+i, myId);
    }
  } 
  // then display the node
  appendVisitEntry(tabId, list, node.data, initialIndent, myId, parentId);
}

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


function appendVisitEntry(tabId, list, data, indentLevel, myId, parentId) {
  // DOM structure:
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
  var li = document.createElement('li');
  var title = document.createElement('div');
  var a = document.createElement('a');
  var lastvisit = document.createElement('div');
  var domain = document.createElement('div');
  
  li.className = "entry";
  li.setAttribute("id", "li" + myId);
  li.setAttribute("parentId", "li" + parentId);
  li.href = data.url;
  li.style.marginLeft = 25 + indentLevel * 10 + "px";
  li.style.cursor = "pointer";

  li.style.backgroundImage = "url(" + data.favicon + ")";
  
  title.className = "title";
  domain.className = "domain";
  lastvisit.className = "lastvisit";

  a.href = data.url;
  a.innerHTML = data.title;

  li.onclick = function () {
    chrome.tabs.update(tabId, {url: data.url});
    eventPage.updateNode(data.url, Date.now);
  }
  li.onmouseover = function () {
    var tb = document.getElementById("thumbnail");
    tb.removeAttribute("height");
    tb.removeAttribute("width");
    var div = document.getElementById("thumbnail-div");
    tb.src = data.img;
    tb_ratio = tb.width / tb.height;
    tb.width = div.clientWidth - 2;
    tb.height = tb.width / tb_ratio;
//    var host = a.hostname;
//     if (host) {
//       host = host.replace('www.', '');
//     } else {
//       host = "<br>";
//     }
    var host = data.url;
    domain.innerHTML = host;

    lastvisit.innerHTML = lastVisitToString(data.lastVisit);
    colorBranch(li, green);
  }
  li.onmouseout = function () {
    colorBranch(li, brown);
    domain.innerHTML = "";
    lastvisit.innerHTML = "";
  }

  title.appendChild(a);
  li.appendChild(title);
  li.appendChild(lastvisit);
  li.appendChild(domain);
  list.appendChild(li);
}

function resetSvg(li) {
  var svg = document.getElementById('link-svg'); //TODO: make static
  var lines = document.getElementsByTagName('polyline');
  for (var i = 0; i < lines.length; i++) {
    lines[i].style.color = brown;
  }
}

function drawBranch(toLi, color) {
  var parent = document.getElementById(toLi.getAttribute("parentId"));
  var id = toLi.id;
  if (parent) {
    drawLine(getCoords(parent), getCoords(toLi), color, id);
    drawBranch(parent, color);
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
  colorPoint(toLi, green);
}
 
function getCoords(li) {
  return {x: parseInt(li.style.marginLeft) - 8, y: li.offsetTop + 11};
}

function drawLine(a, b, color, id) {
  var svg = document.getElementById('link-svg'); //TODO: make static
  line = '<polyline id="' + id + 
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

function deletePoint(a) {
  var pt = document.getElementById("circle" + a.x + "-" + a.y);
}

function drawPoint(a, id) {
  var svg = document.getElementById('link-svg'); //TODO: make static
  circle = '<circle id="' + id + 'point" cx="' + a.x + '" cy="' + a.y +
    '" r="4" stroke="' + green + '" fill="' + green + '" />';
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


document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.getBackgroundPage(displayHistree);
});
