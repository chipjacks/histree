// Histree Google Chrome Extension
// Tree class unit tests
// Chip Jackson, September 2014

var nodes = [
	{"url":"file:///","title":"Index of /","time":1405450159217,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/","title":"Index of /Users/","time":1405450169747,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/","title":"Index of /Users/chipjacks/","time":1405450215860,"tabId":224,"historyVisit":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450231137,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/class/","title":"Index of /Users/chipjacks/Dropbox/class/","time":1405450250071,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450256633,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/code/","title":"Index of /Users/chipjacks/Dropbox/code/","time":1405450257537,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450258500,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/other/","title":"Index of /Users/chipjacks/Dropbox/other/","time":1405450259527,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450260391,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/blog/","title":"Index of /Users/chipjacks/Dropbox/blog/","time":1405450262859,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450263557,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/books/","title":"Index of /Users/chipjacks/Dropbox/books/","time":1405450264458,"tabId":224,"historyVisit":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Dropbox/","title":"Index of /Users/chipjacks/Dropbox/","time":1405450265389,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/","title":"Index of /Users/chipjacks/","time":1405450384945,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450389417,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450393343,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450394178,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Counter-Strike%20Condition%20Zero.app/","title":"Index of /Users/chipjacks/Applications/Counter-Strike Condition Zero.app/","time":1405450394978,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450395766,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Counter-Strike.app/","title":"Index of /Users/chipjacks/Applications/Counter-Strike.app/","time":1405450396566,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450397315,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Team%20Fortress%202.app/","title":"Index of /Users/chipjacks/Applications/Team Fortress 2.app/","time":1405450398119,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/","title":"Index of /Users/chipjacks/Applications/","time":1405450398999,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450404619,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/MacOS/","title":"Index of /Users/chipjacks/Applications/Contents/MacOS/","time":1405450405763,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450406754,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/Frameworks/","title":"Index of /Users/chipjacks/Applications/Contents/Frameworks/","time":1405450407493,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450408140,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/Resources/","title":"Index of /Users/chipjacks/Applications/Contents/Resources/","time":1405450409544,"tabId":224,"historyVisit":true,"children":[], "tabAlias": {"orig": 224, "active": 224}},
	{"url":"file:///Users/chipjacks/Applications/Contents/","title":"Index of /Users/chipjacks/Applications/Contents/","time":1405450410416,"tabId":224,"tabUpdate":true,"children":[], "tabAlias": {"orig": 224, "active": 224}}
];

function buildTestTree(callback) {
	var tr = new Tree.Tree();

	for (var i = 0; i < nodes.length; i++) {
		tr.addNode(new Tree.Node(nodes[i]));
	}
	callback(tr);
}

describe("Tree class", function() {
	var tr;

	beforeEach(function () {
		spyOn(chrome.tabs, 'query').and.callFake(function(blah, callback) {
			callback([{id: 1}]);
		});
		buildTestTree(function (completeTr) { tr = completeTr; });
	});

	it("should have correct size", function() {
		expect(Object.keys(tr.urls).length).toEqual(17);
	});

	it("should contain all inserted urls", function() {
		for (var i = 0; i < nodes.length; i++) {
			expect(tr.urls[nodes[i].url]).not.toBe(undefined);
		}
		expect(tr.urls["sharks.com"]).toBe(undefined);
	});

	it("should have correct height", function() {
		height = function (node) {
			if (!node.children || !node.children.length) {
				return 0;
			} else {
				var max = 0;
				for (var i = 0; i < node.children.length; i++) {
					var h = height(node.children[i]);
					if (h > max) {
						max = h;
					}
				}
				return max + 1;
			}
		};
		expect(height(tr.root)).toEqual(5);
	});
});

describe("Node class", function() {

	beforeEach(function () {
		spyOn(chrome.tabs, 'query').and.callFake(function(blah, callback) {
			callback([{id: 1}]);
		});
		buildTestTree(function (completeTr) { tr = completeTr; });
	});

	it("should keep track of most recently visited node ", function() {
		var node = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
		expect(tr.currentNode[224].url).toBe(node.url);
	});

	it("should know if it's a youngest or oldest child", function() {
		var node = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
		expect(node.isYoungestChild()).toBe(true);
		expect(node.isOldestChild()).toBe(false);

		node = tr.urls["file:///Users/chipjacks/Applications/Contents/Frameworks/"];
		expect(node.isYoungestChild()).toBe(false);
		expect(node.isOldestChild()).toBe(false);

		node = tr.urls["file:///Users/chipjacks/Applications/Contents/MacOS/"];
		expect(node.isYoungestChild()).toBe(false);
		expect(node.isOldestChild()).toBe(true);

		node = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
		expect(node.isYoungestChild()).toBe(true);
		expect(node.isOldestChild()).toBe(false);

		node = tr.urls["file:///Users/chipjacks/Applications/"];
		expect(node.isYoungestChild()).toBe(true);
		expect(node.isOldestChild()).toBe(false);
	});

	it("should know who its big and little brothers are", function() {
		var lil = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
		var big = tr.urls["file:///Users/chipjacks/Applications/Contents/Frameworks/"];
		expect(lil.bigBro()).toBe(big);
		expect(big.lilBro()).toBe(lil);
	});

	it("should know who its parent is", function() {
		var child = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
		var parent = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
		expect(child.parent).toBe(parent);
	});

	it("should know who its children are", function() {
		var parent = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
		var child = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
		expect(parent.children).toContain(child);
		child = tr.urls["file:///Users/chipjacks/Applications/Contents/Frameworks/"];
		expect(parent.children).toContain(child);
		child = tr.urls["file:///Users/chipjacks/Applications/Contents/MacOS/"];
		expect(parent.children).toContain(child);
	});

	it("should know who its youngest child is", function() {
		var parent = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
		var child = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
		expect(parent.youngestChild()).toBe(child);
		expect(child.youngestChild()).toBe(null);
		child = parent;
		parent = tr.urls["file:///Users/chipjacks/Applications/"];
		expect(parent.youngestChild()).toBe(child);
	});

	it("should know who its oldest child is", function() {
		var parent = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
		var child = tr.urls["file:///Users/chipjacks/Applications/Contents/MacOS/"];
		expect(parent.oldestChild()).toBe(child);
		expect(child.oldestChild()).toBe(null);
		child = tr.urls["file:///Users/chipjacks/Applications/Counter-Strike%20Condition%20Zero.app/"];
		parent = tr.urls["file:///Users/chipjacks/Applications/"];
		expect(parent.oldestChild()).toBe(child);
	});
});

