 
function displayHistree(eventPage) {
  var visitList = document.getElementById('visit-list');
  chrome.tabs.query({active: true}, function (tabs) {
    var histree = eventPage.histrees[tabs[0].id];
    displayNode(tabs[0].id, visitList, histree.root, 0);
//    for (var i=0; i < 10; i++) {
 //     appendVisitEntry(visitList, 
 //       {
 //         url: "http://google.com", 
 //         favicon: "http://g.etfv.co/http://www.google.com",
 //         title: "Google #" + i
 //       },
 //       i % 5
 //       );
 //   }
  });
}

function displayNode(tabId, list, node, initialIndent) {
  if (node.children) {
    // display it's children, youngest first
    var children = node.children.sort(function (a, b) {
      return b.data.lastVisit - a.data.lastVisit; // sort: youngest to oldest
    });
    for (var i = 0; i < children.length; i++) {
      displayNode(tabId, list, children[i], initialIndent+i);
    }
  } 
  // then display the node
  appendVisitEntry(tabId, list, node.data, initialIndent);
}

function appendVisitEntry(tabId, list, data, indentLevel) {
  var li = document.createElement('li');
  var entry = document.createElement('div');
  var title = document.createElement('div');
  var a = document.createElement('a');
  
  li.className = "entry";
  li.href = data.url;
  li.style.paddingLeft = 10 + indentLevel * 20 + "px";
  li.style.cursor = "pointer";
  li.onclick = function () {
    chrome.tabs.update(tabId, {url: data.url});
    eventPage.updateNode(data.url, Date.now);
  }
  entry.setAttribute("class", "visit-entry");
  entry.style.backgroundImage = "url(http://g.etfv.co/" + data.url + ")";
  
  title.className = "title";

  a.href = data.url;
  a.innerHTML = data.title;

  title.appendChild(a);
  entry.appendChild(title);
  li.appendChild(entry);
  list.appendChild(li);
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.getBackgroundPage(displayHistree);
});
