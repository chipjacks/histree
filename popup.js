 
function displayHistree(eventPage) {
  var popupDiv = document.getElementById('inner_div');
  chrome.tabs.query({active: true}, function (tabs) {
    popupDiv.appendChild(document.createTextNode(
      eventPage.histrees[tabs[0].id]));
  });
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.getBackgroundPage(displayHistree);
});
