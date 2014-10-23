(function(context) {
	var appKey;
	var DIVID = "searchAid"
	var SIDEBAR_TEMPLATE = "sidebar.html"
  var port = chrome.runtime.connect();
  var $sidebarEl;

  var addPostMessageListener = function() {
	  context.addEventListener("message", function(event) {
	  	event.preventDefault();

	  	if (event.source != context) return;

	  	if (event.data.type) {
	    	if (event.data.type === "FROM_PAGE") {
					var data = parseDataString(event.data.text);
					var key = storeLink(data);
					var $h2 = $sidebarEl.find('.title-' + data.type);
					$h2.removeClass('waiting');
					createLink(data, key);
				} else if (event.data.type === "WAITING") {
					var $h2 = $sidebarEl.find('.title-' + event.data.text);
					$h2.addClass('waiting');
				} else if (event.data.type === "TRASH") {
					var href = event.data.text;
					removeLink(href);
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
			var $el = $('<li class="link"><span><a data-key=' + key + ' href="' + data.href + '">' + data.title + '</a></span></li>');

			$ul.append($el);
			$ul.find('.links-list-cta').remove();
			$el.click(sendMessageToYammer);
		}
	};

	var removeLink = function(href) {
		var $link = $sidebarEl.find('a[href="' + href + '"]');
		var key = $link.data('key');
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
		var key = getKeyFromTitle(data.title);

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
		window.postMessage({ type: "FROM_SIDEBAR", strData: strInfo}, "*");
  };

	var injectScripts = function() {
		var s = document.createElement('script');
		s.appendChild(document.createTextNode('window.yammerSearchAidKey="' + appKey + '";'));
		(document.head||document.documentElement).appendChild(s);
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

	var createSidebar = function() {
		//don't recreate sidebar
		if($sidebarEl && $sidebarEl.length > 0) return;

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
		if(!$sidebarEl || $sidebarEl.length === 0) return;

		$sidebarEl.toggleClass('off');
	};

	var start = function(key) {
		appKey = key;
		if(!$sidebarEl) {
			injectScripts();
			addPostMessageListener();
			createSidebar();
		}
	};

	start();
	chrome.runtime.onMessage.addListener(toggleSidebar);

})(window);