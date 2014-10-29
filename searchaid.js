(function(context) {
	var DIVID = "searchAid";
	var SIDEBAR_TEMPLATE = "sidebar.html";
	var $sidebarEl;
	var MSG_NEW_LINK = 'NEW_LINK';
	var MSG_WAITING = 'WAITING';
	var MSG_TRASH = 'TRASH';
	var MSG_NAVIGATE = 'NAVIGATE';

	//Utilities

	var guid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}

	//Scripts and templates

	var injectScripts = function() {

		var addChild = function(el) {
			(document.head||document.documentElement).appendChild(el);
		}

		var dragDrop = document.createElement('script');
		dragDrop.src = chrome.extension.getURL('dragDrop.js');
		addChild(dragDrop);

		var styles = document.createElement('link');
		styles.href = chrome.extension.getURL('searchAid.css');
		styles.media = 'screen, projection';
		styles.rel = 'stylesheet';
		styles.type = 'text/css';
		addChild(styles);
	};

	var getTemplate = function(path, callback) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(data) {
			if (data.target.readyState === 4) {
				callback(data.target.responseText);
			}
		};
		xhr.open("GET", chrome.extension.getURL(path), true);
		xhr.send();
	};

	//Message data utilities

	var createDataString = function(href, title) {
		return JSON.stringify({
			href: href,
			title: title
		});
	};

	var parseDataString = function(strData) {
		var data;

		try {
			data = JSON.parse(strData);
		} catch (err) {
			data = {
				href: strData,
				title: strData
			}
		}

		return data;
	};

	//Event handling

	var sendMessageToYammer = function(event) {
		event.preventDefault();
		context.postMessage({ type: MSG_NAVIGATE, strData: event.currentTarget.attributes.href.value}, "*");
	};

	var listenToYammer = function() {
		context.addEventListener("message", function(event) {
			event.preventDefault();

			if (event.source != context) return;

			if (event.data.type) {
				if (event.data.type === MSG_NEW_LINK) {
					var data = parseDataString(event.data.text);
					var key = guid();
					var $h2 = $sidebarEl.find('.title-' + data.type);
					
					storeLink(key, data);
					createLink(key, data);
					$h2.removeClass('waiting');
				} else if (event.data.type === MSG_WAITING) {
					var $h2 = $sidebarEl.find('.title-' + event.data.text);
					$h2.addClass('waiting');
				} else if (event.data.type === MSG_TRASH) {
					var key = event.data.text;
					removeLink(key);
				}
			}
		}, false);
	};

	//Link management

	var createLink = function(key, data) {
		if ($sidebarEl && $sidebarEl.length) {
			var type = data.type ? data.type : 'other';
			var $ul = $sidebarEl.find('.links-list.links-' + type);
			var $el = $('<li class="link"><span><a ondragstart="listItemDrag(event)" data-key=' + key + ' href="' + data.href + '">' + data.title + '</a></span></li>');

			$ul.append($el);
			$ul.find('.links-list-cta').remove();
			$el.find('a').click(sendMessageToYammer);
		}
	};

	var removeLink = function(key) {
		var $link = $sidebarEl.find('a[data-key="' + key + '"]');
		$link.parent().remove();
		chrome.storage.sync.remove(key);
		return false;
	}

	var storeLink = function(key, data) {
		var store = {};
		
		store[key] = data;
		chrome.storage.sync.set(store);
	};

	var loadLinks = function() {
		chrome.storage.sync.get(null, function(keys) {
			for (key in keys) {
				createLink(key, keys[key]);
			}
		});
	};

	//Sidebar handlers

	var hasSidebar = function() {
		var $el = $('#searchAid');
		return $el && $el.length > 0;
	}

	var createSidebar = function() {
		getTemplate(SIDEBAR_TEMPLATE, function(template) {
			$sidebarEl = $(Mustache.to_html(template, {
				id: DIVID,
				ext_path: chrome.extension.getURL('')
			}));
			$sidebarEl.addClass('off');
			$sidebarEl.click(toggleSidebar);
			$('body').append($sidebarEl);
			loadLinks();
		});
	}

	var toggleSidebar = function() {
		//only attempt toggle if sidebar exists
		if(!hasSidebar()) return;

		$sidebarEl.toggleClass('off');
	};

	if(!hasSidebar()) {
		injectScripts();
		listenToYammer();
		createSidebar();
		chrome.runtime.onMessage.addListener(toggleSidebar);
	}
	

})(window);