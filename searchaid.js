var sidebarOpen = false;

var toggleSidebar = function() {
	if(sidebarOpen) {
		var el = document.getElementById('mySidebar');
		el.parentNode.removeChild(el);
		sidebarOpen = false;
	}
	else {
		var sidebar = document.createElement('div');
		sidebar.id = "mySidebar";
		sidebar.innerHTML = "\
			<h1>Hello</h1>\
			World!\
		";
		sidebar.style.cssText = "\
			position:fixed;\
			top:0px;\
			left:0px;\
			width:30%;\
			height:100%;\
			background:white;\
			box-shadow:inset 0 0 1em black;\
			z-index:999999;\
		";
		document.body.appendChild(sidebar);
		sidebarOpen = true;
	}
}

(function() {
	var appKey;

	var getAppKey = function(key) {
		appKey = key;
		appKey && chrome.runtime.sendMessage(appKey, {data: 'hi'});
	}

	chrome.runtime.onMessage.addListener(toggleSidebar);

})();