
describe("Popup window", function() {

	beforeEach(function() {
		tr = buildTestTree();
	});

	describe("HistreeDisplay class", function() {

		beforeEach(function() {
			hd = new HistreeDisplay(tr.currentNode);
		});

		describe("next method", function() {

			it("should traverse from an oldest child to a parent", function() {
				var oldChild = tr.urls["file:///Users/chipjacks/Applications/Contents/MacOS/"];
				expect(oldChild.isOldestChild()).toBe(true);
				var parent = tr.urls["file:///Users/chipjacks/Applications/Contents/"];
				hd.jumpTo(oldChild);
				expect(hd.next()).toBe(parent);
			});

			it("should traverse from a not oldest child to a older sibling", function() {
				var youngSibling = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
				expect(youngSibling.isOldestChild()).toBe(false);
				var olderSibling = tr.urls["file:///Users/chipjacks/Applications/Contents/Frameworks/"];
				hd.jumpTo(youngSibling);
				expect(hd.next()).toBe(olderSibling);
			});

			it("should increase indent when traversing from a youngest child to an older sibling", function() {
				var youngSibling = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
				expect(youngSibling.isOldestChild()).toBe(false);
				expect(youngSibling.isYoungestChild()).toBe(true);
				var olderSibling = tr.urls["file:///Users/chipjacks/Applications/Contents/Frameworks/"];
				hd.jumpTo(youngSibling);
				var prevIndent = hd.curNode.indent;
				hd.next();
				expect(hd.curNode.indent).toEqual(prevIndent + 1);
				expect
			});

			it("should traverse from a sibling to an older siblings youngest child if the older sibling has children", function() {
				var youngSibling = tr.urls["file:///Users/chipjacks/Applications/"];
				var nephew = tr.urls["file:///Users/chipjacks/Dropbox/books/"];
				hd.jumpTo(youngSibling);
				expect(hd.next()).toBe(nephew);
			});

			it("should increase indent when traversing from a sibling to an older siblings youngest child", function() {
				var youngSibling = tr.urls["file:///Users/chipjacks/Applications/"];
				var nephew = tr.urls["file:///Users/chipjacks/Dropbox/books/"];
				hd.jumpTo(youngSibling);
				var prevIndent = hd.curNode.indent;
				hd.next();
				expect(hd.curNode.indent).toEqual(prevIndent + 1);
				expect(hd.curNode.indent).toBeTruthy();
			});

			it("should return null eventually", function() {
				var node = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
				hd.jumpTo(node);
				for (var i = 0; i < 50; i++) {
					hd.next();
				}
				expect(hd.next()).toBe(null);
			});
		});

		xdescribe("prev method", function() {

			it("should undo the next method", function() {
				var node = tr.urls["file:///Users/chipjacks/Applications/Contents/Resources/"];
				var last = node;
				hd.jumpTo(node);
				while (hd.next()) {
 					expect(hd.prev()).toBe(last);
 					last = hd.next();
 				}
			});
		});
	
	});

	xdescribe("tree drawing routine", function() {

		beforeEach(function() {
			spyOn(window, 'displayHistree');
			spyOn(window, 'displayNode');
			displayHistree(tr);
		});

		it("should call displayNode for every node in tree", function() {
			for (var i = 0; i < nodes.length; i++) {
				expect(window.displayNode).toHaveBeenCalledWith(tr.urls[nodes[i]["url"]]);
			}
		});

	});

});
