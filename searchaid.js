(function(context) {
	var appKey;
	var divId = "searchAid"
  var port = chrome.runtime.connect();
  var $sidebarEl;

  var addPostMessageListener = function() {
	  context.addEventListener("message", function(event) {
	    if (event.source != context) return;
	    if (event.data.type && (event.data.type == "FROM_PAGE")) {
	    	var data = parseDataString(event.data.text);
	    	storeLink(data);
				createLink(data);
			}
	  }, false);
	};

	var createLink = function(data) {
		if ($sidebarEl.length) {
			var $el = $('<div class="link"><span><a href="' + data.href + '">' + data.title + '</a></span></div>')
			$el.click(sendMessageToYammer);
			$sidebarEl.append($el);
		}
	};

	var storeLink = function(data) {
		var store = {};
		store[data.title.replace(/\W+/g, "_")] = data;
		chrome.storage.sync.set(store);
	};

	var loadLinks = function() {
		chrome.storage.sync.get(null, function(keys) {
			for (key in keys) {
				createLink(keys[key]);
			}
		});
	};

  var parseDataString = function(strData) {
    return JSON.parse(strData);
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

	var injectScript = function() {
		var s = document.createElement('script');
		s.appendChild(document.createTextNode('window.yammerSearchAidKey="' + appKey + '";'));
		(document.head||document.documentElement).appendChild(s);
		s = document.createElement('script');
		s.src = chrome.extension.getURL('dragDrop.js');
		(document.head||document.documentElement).appendChild(s);
	};

	var getDivSelector = function() {
		return '#' + divId;
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

		$sidebarEl = $('<div id="' + divId + '" ondrop="onDrop(event)" ondragover="allowDrop(event)"></div>');
		$sidebarEl.html("<h1>Yammer SearchAid</h1>");
		$sidebarEl.css({
			position:'fixed',
			top:'0px',
			right:'0px',
			width:'25%',
			height:'100%',
			background:'white',
			'box-shadow':'inset 0 0 1em black',
			'z-index':999999,
			'display': 'none'
		});

		$('body').append($sidebarEl);
	}

	var toggleSidebar = function() {
		//only attempt toggle if sidebar exists
		if(!$sidebarEl || $sidebarEl.length === 0) return;

		if($sidebarEl.css('display') === 'none') {
			$sidebarEl.show();
		} else {
			$sidebarEl.hide();
		}
	};

	var getAppKey = function(key) {
		appKey = key;
		//appKey && chrome.runtime.sendMessage(appKey, {data: 'hi'});
	};

	var start = function(key) {
		appKey = key;
		if(!$sidebarEl) {
			injectScript();
			addPostMessageListener();
			createSidebar();
			loadLinks();
			addDroppables();
		}

		toggleSidebar();

	};

	chrome.runtime.onMessage.addListener(start);

})(window);