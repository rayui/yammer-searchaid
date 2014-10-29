(function(context) {
	var DIVID = "searchAid";
	var SIDEBAR_TEMPLATE = "sidebar.html";
	var $sidebarEl;
	var MSG_NEW_LINK = 'NEW_LINK';
	var MSG_WAITING = 'WAITING';
	var MSG_TRASH = 'TRASH';
	var MSG_NAVIGATE = 'NAVIGATE';

	var guid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}

	var addPostMessageListener = function() {
		context.addEventListener("message", function(event) {
			event.preventDefault();

			if (event.source != context) return;

			if (event.data.type) {
				if (event.data.type === MSG_NEW_LINK) {
					var data = parseDataString(event.data.text);
					var key = storeLink(data);
					var $h2 = $sidebarEl.find('.title-' + data.type);
					$h2.removeClass('waiting');
					createLink(data, key);
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

	var createLink = function(data, key) {
		if ($sidebarEl && $sidebarEl.length) {
			var type = data.type ? data.type : 'other';
			var $ul = $sidebarEl.find('.links-list.links-' + type);
			var $el = $('<li class="link"><span><a ondragstart="listItemDrag(event)" data-key=' + key + ' href="' + data.href + '">' + data.title + '</a></span></li>');

			$ul.append($el);
			$ul.find('.links-list-cta').remove();
			$el.click(sendMessageToYammer);
		}
	};

	var removeLink = function(key) {
		var $link = $sidebarEl.find('a[data-key="' + key + '"]');
		$link.parent().remove();
		chrome.storage.sync.remove(key);
		return false;
	}

	var getKeyFromTitle = function(title) {
		return title.replace(/\W+/g, "_");
	}

	var storeLink = function(data) {
		var store = {};
		var replace = false;
		var key = guid(); //getKeyFromTitle(data.title);

		store[key] = data;

		chrome.storage.sync.set(store);

		return key;
	};

	var loadLinks = function() {
		chrome.storage.sync.get(null, function(keys) {
			for (key in keys) {
				createLink(keys[key], key);
			}
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

	var createDataString = function(href, title) {
		return JSON.stringify({
			href: href,
			title: title
		});
	};

	var sendMessageToYammer = function(event) {
		event.preventDefault();
		var target = $(event.currentTarget).find('a');
		var strInfo = createDataString(target.attr('href'), target.text());
		window.postMessage({ type: MSG_NAVIGATE, strData: strInfo}, "*");
	};

	var injectScripts = function() {
		s = document.createElement('script');
		s.src = chrome.extension.getURL('dragDrop.js');
		(document.head||document.documentElement).appendChild(s);
		s = document.createElement('link');
		s.href = chrome.extension.getURL('searchAid.css');
		s.media = 'screen, projection';
		s.rel = 'stylesheet';
		s.type = 'text/css';
		(document.head||document.documentElement).appendChild(s);
	};

	var getDivSelector = function() {
		return '#' + DIVID;
	};

	var addDroppables = function() {
		var links = $('body a');
		links.attr({
			draggable: true,
			ondragstart: 'onDrag(event)'
		});
	};

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
		addPostMessageListener();
		createSidebar();
		chrome.runtime.onMessage.addListener(toggleSidebar);
	}
	

})(window);