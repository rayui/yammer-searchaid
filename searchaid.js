(function(context) {
	var appKey;
	var divId = "searchAid"
  var port = chrome.runtime.connect();
  var $sidebarEl;

  context.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != context) return;
    if (event.data.type && (event.data.type == "FROM_PAGE")) {
    	if ($sidebarEl.length) {
    		var $el = $('<div class="link"><span>' + event.data.text + '</span></div>')
    		$sidebarEl.append($el);
    	}
    }
  }, false);

	var injectScript = function() {
		var s = document.createElement('script');
		s.appendChild(document.createTextNode('window.yammerSearchAidKey="' + appKey + '";'));
		(document.head||document.documentElement).appendChild(s);
		s = document.createElement('script');
		s.src = chrome.extension.getURL('dragDrop.js');
		(document.head||document.documentElement).appendChild(s);
	}

	var getDivSelector = function() {
		return '#' + divId;
	}

	var addDroppables = function() {
		var links = $('body a');
		links.attr({
			draggable: true,
			ondragstart: 'onDrag(event)'
		});
	}

	var toggleSidebar = function() {
		$sidebarEl = $(getDivSelector());

		if($sidebarEl.length) {
			$sidebarEl.remove();
		}
		else {
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
				'z-index':999999
			});

			$('body').append($sidebarEl);
		}
	}

	var getAppKey = function(key) {
		appKey = key;
		//appKey && chrome.runtime.sendMessage(appKey, {data: 'hi'});
	}

	var start = function(key) {
		appKey = key;
		injectScript();
		toggleSidebar();
		addDroppables();
	}

	chrome.runtime.onMessage.addListener(start);

})(window);