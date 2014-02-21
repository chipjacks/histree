 
// TODO:
// get it to work with websites like facebook
// favicons
// figure out why event page isn't unloading
// convert webRequest to declaritiveWebRequest

// Work around for old browsers that haven't implemented Date().now()
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

function displayHistree(eventPage) {
  var visitList = document.getElementById('visit-list');
  chrome.tabs.query({active: true}, function (tabs) {
    var histree = eventPage.histrees[tabs[0].id];
    displayNode(tabs[0].id, visitList, histree.root, 0, 0);
  });
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
  var li = document.createElement('li');
  var entry = document.createElement('div');
  var title = document.createElement('div');
  var a = document.createElement('a');
  
  li.className = "entry";
  li.setAttribute("id", "li" + myId);
  li.setAttribute("parentId", "li" + parentId);
  li.href = data.url;
  li.style.marginLeft = 15 + indentLevel * 20 + "px";
  li.style.paddingLeft = 5 + "px";
  li.style.cursor = "pointer";

  entry.setAttribute("class", "visit-entry");
  entry.style.backgroundImage = "url(http://g.etfv.co/" + data.url + ")";
//  entry.style.backgroundImage = "url(icon.png)";
  
  title.className = "title";

  a.href = data.url;
  a.innerHTML = data.title;

  li.onclick = function () {
    chrome.tabs.update(tabId, {url: data.url});
    eventPage.updateNode(data.url, Date.now);
  }
  li.onmouseover = function () {
    var thumbnail = document.getElementById("thumbnail");
    thumbnail.src = data.img;
    drawBranch(this);
    var domainDiv = document.getElementById("domain");
    var host = a.hostname;
    if (host) {
      host = host.replace('www.', '');
    } else {
      host = "<br>";
    }
    domainDiv.innerHTML = host;
    var visitDiv = document.getElementById("last-visit");
    visitDiv.innerHTML = lastVisitToString(data.lastVisit);
  }
  li.onmouseout = function () {
    resetSvg();
  }


  title.appendChild(a);
  entry.appendChild(title);
  li.appendChild(entry);
  list.appendChild(li);
}

function resetSvg() {
  var svg = document.getElementById('link-svg'); //TODO: make static
  svg.innerHTML = "";

}
function drawBranch(toLi) {
  var parent = document.getElementById(toLi.getAttribute("parentId"));
  if (parent) {
    drawLine(getCoords(parent), getCoords(toLi));
    drawBranch(parent);
  }
  drawPoint(getCoords(toLi));
}

function getCoords(li) {
  return {x: parseInt(li.style.marginLeft) - 3, y: li.offsetTop + 11};
}

function drawLine(a, b) {
  var svg = document.getElementById('link-svg'); //TODO: make static
  line = '<polyline points="' + a.x + ',' + a.y + ' ' + a.x + ',' + b.y + ' ' +
    a.x + ',' + b.y + ' ' + b.x + ',' + b.y + '" ' +
    'style="fill: none; stroke: gainsboro; stroke-width: 1;"/>';
  svg.innerHTML += line;
}

function deletePoint(a) {
  var pt = document.getElementById("circle" + a.x + "-" + a.y);
}

function drawPoint(a) {
  var svg = document.getElementById('link-svg'); //TODO: make static
  circle = '<circle cx="' + a.x + '" cy="' + a.y + '" r="1" stroke="black"' +
    'fill="black" />';
  svg.innerHTML += circle;
//  var circle = document.createElement('circle');
//  circle.setAttribute('cx', a.x);
//  circle.setAttribute('cy', a.y);
//  circle.setAttribute('r', 5);
//  circle.setAttribute('stroke', 'black');
//  circle.setAttribute('fill', 'black');
//  svg.appendChild(circle);
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.getBackgroundPage(displayHistree);
});
