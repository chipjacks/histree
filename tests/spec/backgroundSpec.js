// Histree Google Chrome Extension
// Background page unit tests
// Chip Jackson, September 2014

var urls = [
	'file:///',
	'file:///Users/',
	'file:///Users/chipjacks/',
	'file:///Users/chipjacks/Dropbox/',
	'file:///Users/chipjacks/Dropbox/other/',
	'file:///Users/chipjacks/Dropbox/',
	'file:///Users/chipjacks/Dropbox/code/',
	'file:///Users/chipjacks/Dropbox/',
	'file:///Users/chipjacks/Dropbox/other/',
	'file:///Users/chipjacks/Dropbox/',
	'file:///Users/chipjacks/Dropbox/blog/',
	'file:///Users/chipjacks/Dropbox/',
	'file:///Users/chipjacks/Dropbox/books/',
	'file:///Users/chipjacks/Dropbox/',
	'file:///Users/chipjacks/',
	'file:///Users/chipjacks/Applications/',
	'file:///Users/chipjacks/Applications/Contents/',
	'file:///Users/chipjacks/Applications/Contents/MacOS/',
	'file:///Users/chipjacks/Applications/Contents/',
	'file:///Users/chipjacks/Applications/Contents/Frameworks/',
	'file:///Users/chipjacks/Applications/Contents/',
	'file:///Users/chipjacks/Applications/Contents/Resources/',
	'file:///Users/chipjacks/Applications/Contents/'
];

var urls2 = [
	'http://seattle.craigslist.org/',
	'http://seattle.craigslist.org/ata/',
	'http://seattle.craigslist.org/',
	'http://seattle.craigslist.org/ppa/',
	'http://seattle.craigslist.org/',
	'http://seattle.craigslist.org/ara/',
	'http://seattle.craigslist.org/',
	'http://bellingham.craigslist.org/',
	'http://bellingham.craigslist.org/ata/',
	'http://bellingham.craigslist.org/',
	'http://bellingham.craigslist.org/ppa/',
	'http://bellingham.craigslist.org/',
	'http://bellingham.craigslist.org/ara/',
	'http://bellingham.craigslist.org/',
	'http://seattle.craigslist.org/'
];

xdescribe("Background page", function() {
	var testTab;
	var originalTimeout;
	var histree;
	var bgPage;

	beforeEach(function(done) {
		originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

		chrome.runtime.getBackgroundPage(function (backgroundPage) {
			bgPage = backgroundPage;
			histree = backgroundPage.histree;
		});

		spyOn(chrome.tabs, 'create').and.callThrough();
		chrome.tabs.onUpdated.addListener(onTestTabUpdated);
		var i = 0;
		function onTestTabUpdated(tabId, changeInfo, tab) {
			if (changeInfo.status == 'complete' && typeof testTab != 'undefined' &&
					tabId == testTab.id) {
				chrome.tabs.update(testTab.id, {url: urls[i++]},
						i == urls.length ? done : function(tab){});
			}
		}
		chrome.tabs.create({}, function(tab) {testTab = tab;});
	});

	afterEach(function() {
		chrome.tabs.remove(testTab.id);
	});

	it("should track tab creation", function() {
		expect(chrome.tabs.onCreated.hasListeners()).toBe(true);
		expect(chrome.tabs.create).toHaveBeenCalled();
	});

	it("should record new page visits", function() {
		expect(histree.root).not.toBe(null);
		expect(histree.currentNode[testTab.id].url).toContain("file:///Users/chipjacks/Applications/Contents/");
	});

	it("should track the last active tab", function() {
		chrome.tabs.remove(testTab.id);
		expect(bgPage.lastActiveTabId).toEqual(testTab.id);
	});
});
