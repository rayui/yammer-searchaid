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

chrome.webNavigation.onCompleted.addListener(function(tab) {
	//alert('here')
	chrome.tabs.executeScript(tab.id, {file: "searchaid.js"});
});