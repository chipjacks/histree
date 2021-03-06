// Loads jasmine test suite
// reference: https://gist.github.com/ecmendenhall/3740896#file-tests-html

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("loadjasmine").addEventListener('click', loadJasmine);
});

var TESTING = true;

function loadJasmine() {
	console.log("Loading Jasmine...");
	var jasmineEnv = jasmine.getEnv();
	jasmineEnv.updateInterval = 1000;

	var htmlReporter = new jasmine.HtmlReporter(jasmineEnv);

	jasmineEnv.addReporter(htmlReporter);

	jasmineEnv.specFilter = function(spec) {
		return htmlReporter.specFilter(spec);
	};

	function execJasmine() {
		jasmineEnv.execute();
	}

	function runTests() { 
		execJasmine();
	}

	document.getElementById("runtests").addEventListener('click', runTests);

}
