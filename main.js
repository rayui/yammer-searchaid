var getTemplate = function(path, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(data) {
		if (data.target.readyState === 4) {
			callback(data.target.responseText);
		}
	};
	xhr.open("GET", chrome.extension.getURL(path), true);
	xhr.send();
}

chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	  chrome.declarativeContent.onPageChanged.addRules([
			{
				conditions: [
					new chrome.declarativeContent.PageStateMatcher({
						pageUrl: { hostEquals: 'www.yammer.com', schemes: ['https']}
					})
				],
				actions: [
					new chrome.declarativeContent.ShowPageAction()
				]
			}
		]);
	});
});

chrome.pageAction.onClicked.addListener(function(tab) {
	window.setTimeout(function() {
		chrome.tabs.sendMessage(tab.id, chrome.app.getDetails().id);
	}, 1);
});

chrome.webNavigation.onDOMContentLoaded.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {file: "searchaid.js"});
});