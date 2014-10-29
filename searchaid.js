(function(context) {
	var DIV_CLASS = "search-aid";
	var SIDEBAR_TEMPLATE = "sidebar.html";
	var MSG_NEW_LINK = 'NEW_LINK';
	var MSG_WAITING = 'WAITING';
	var MSG_TRASH = 'TRASH';
	var MSG_NAVIGATE = 'NAVIGATE';
	var MSG_TAG_POSITION = 'TAG_POSITION';

	var $sidebarEl;

	//Utilities

	var guid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}

	//Scripts and templates

	var injectScripts = function() {

		var inject = function(el) {
			(document.head||document.documentElement).appendChild(el);
		}

		var dragDrop = document.createElement('script');
		dragDrop.src = chrome.extension.getURL('dragDrop.js');
		inject(dragDrop);

		var styles = document.createElement('link');
		styles.href = chrome.extension.getURL('searchAid.css');
		styles.media = 'screen, projection';
		styles.rel = 'stylesheet';
		styles.type = 'text/css';
		inject(styles);
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
					var $title = $sidebarEl.find('.' + DIV_CLASS + '--title-' + data.type);
					
					storeLink(key, data);
					createLink(key, data);
					$title.removeClass(DIV_CLASS + '--waiting');
				} else if (event.data.type === MSG_WAITING) {
					var $title = $sidebarEl.find('.' + DIV_CLASS + '--title-' + event.data.text);
					$title.addClass(DIV_CLASS + '--waiting');
				} else if (event.data.type === MSG_TRASH) {
					var key = event.data.text;
					removeLink(key);
				}
				else if (event.data.type === MSG_TAG_POSITION) {
					var top = event.data.text;
					storeTagPosition(top);
				}
			}
		}, false);
	};

	//Link management

	var createLink = function(key, data) {
		if ($sidebarEl && $sidebarEl.length) {
			var type = data.type ? data.type : 'other';
			var $ul = $sidebarEl.find('.' + DIV_CLASS + '--links-' + type);
			var $el = $('<li class="' +
				DIV_CLASS +
				'--links-list-item"><span><a ondragstart="listItemDrag(event)" data-key=' +
				key +
				' href="' +
				data.href + '">' +
				data.title +
				'</a></span></li>'
			);

			$ul.append($el);
			$ul.find('.' + DIV_CLASS + '--links-list-cta').remove();
			$el.find('a').click(sendMessageToYammer);
		}
	};

	var removeLink = function(key) {
		var $link = $sidebarEl.find('.' + DIV_CLASS + '--links-list-item a[data-key="' + key + '"]');
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
		var $el = $('.' + DIV_CLASS);
		return $el && $el.length > 0;
	};

	var getandSetSavedPosition = function() {
		chrome.storage.sync.get(DIV_CLASS, function(data) {
			var top;

			top = data['search-aid'] && data['search-aid']['tag-top'] ?
				data['search-aid']['tag-top'] : 0;

			$sidebarEl.offset({top: top});
		});
	};

	var createSidebar = function() {
		getTemplate(SIDEBAR_TEMPLATE, function(template) {
			$sidebarEl = $(Mustache.to_html(template, {
				'master-class': DIV_CLASS,
				ext_path: chrome.extension.getURL('')
			}));
			$sidebarEl.addClass(DIV_CLASS + '--off');
			$sidebarEl.click(toggleSidebar);

			getandSetSavedPosition();

			$('body').append($sidebarEl);
			loadLinks();
		});
	}

	var toggleSidebar = function() {
		$sidebarEl.toggleClass(DIV_CLASS + '--off');
		if (!$sidebarEl.hasClass(DIV_CLASS + '--off')) {
			$sidebarEl.offset({top: 0});
		} else {
			getandSetSavedPosition();
		}
	};

	var storeTagPosition = function(top) {
		var store = {};
		
		store[DIV_CLASS] = {'tag-top': top};
		chrome.storage.sync.set(store);
	}

	if(!hasSidebar()) {
		injectScripts();
		createSidebar();
		listenToYammer();
		chrome.runtime.onMessage.addListener(toggleSidebar);
	}	

})(window);