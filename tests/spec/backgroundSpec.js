// Histree Google Chrome Extension
// Background page tests
// Chip Jackson, July 2014

describe("Background page", function() {

	beforeEach(function () {
	});
		
	describe("Tree class", function() {

		beforeEach(function () {
			tr = buildTestTree();	// defined in background.js
		});

		it("should have correct size", function() {
			expect(Object.keys(tr.urls).length).toEqual(17);
			expect(nextNodeId.i).toEqual(17);
		});

		it("should contain all inserted urls", function() {
			for (var i = 0; i < nodes.length; i++) {
				expect(tr.urls[nodes[i]["url"]]).not.toBe(undefined);
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
			tr = buildTestTree();
		});

		it("should keep track of most recently visited node ", function() {
			var node = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
			expect(tr.currentNode).toBe(node);
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
});

