(function(context) {

  var DIV_CLASS = "search-aid";
  var MSG_NEW_LINK = 'NEW_LINK';
  var MSG_WAITING = 'WAITING';
  var MSG_TRASH = 'TRASH';
  var MSG_NAVIGATE = 'NAVIGATE';
  var MSG_TAG_POSITION = 'TAG_POSITION';

  context.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != context) return;
    if (event.data.type && (event.data.type === MSG_NAVIGATE)) {
      this.location = event.data.strData;
    }
  }, false);

  context.allowDrop = function(event) {
    event.preventDefault();
  };

  context.listItemDrag = function(event) {
    event.dataTransfer.setData("text", event.target.attributes['data-key'].value);
  }

  context.trashDrop = function(event) {
    event.preventDefault();
    this.postMessage({ type: MSG_TRASH, text: event.dataTransfer.getData('text') }, "*");
  };

  context.addLinkToSidebar = function(event) {
    event.preventDefault();
    var href = event.dataTransfer.getData('text');
    var type = detectContentType(href);
    var title;

    this.postMessage({ type: MSG_WAITING, text: type }, "*");

    switch (type) {
      case 'thread':
        getAPIParam(href, new RegExp(/threadId=(\d+)/), function(match) {
          makeAPIRequest('threads', match, function(threadInfo) {
            makeAPIRequest('messages', threadInfo.thread_starter_id, function(messageData) {
              postLinkObject(href, messageData.body.plain, type);
            });
          });
        });
        break;
      case 'group':
        getAPIParam(href, new RegExp(/type=in_group&feedId=(\d+)/), function(match) {
          makeAPIRequest('groups', match, function(groupData) {
            postLinkObject(href, groupData.full_name, type);
          });
        });
        break;
      case 'user':
        getAPIParam(href, new RegExp(/users\/(\w+)/), function(match) {
          makeAPIRequest('users', match, function(userData) {
            postLinkObject(href, userData.full_name, type);
          });
        });
        break;
      default:
        getHTMLPage(href, function(data) {
          var titleStart = data.indexOf('<title>') + 7;
          var titleLength = data.indexOf('</title>') - titleStart - 5;
          var title = data.substr(titleStart, titleLength).trim();
          postLinkObject(href, title, type);
        });
    }
  };

  context.startTagDrag = function(event) {
    yam.$(event.target.parentElement).addClass(DIV_CLASS + '--dragging');
  }

  context.changeTagPosition = function(event) {
    var offsetY = event.offsetY;
    var currY = parseInt(event.target.parentElement.style.top, 10);
    var newY = currY + offsetY;

    if (newY <= 0 || newY > window.screen.height - event.target.parentElement.offsetHeight) return false;

    event.target.parentElement.style.top = newY + 'px';

    return newY;
  };

  context.storeTagPosition = function(event) {
    context.postMessage({ type: MSG_TAG_POSITION, text: parseInt(event.target.parentElement.style.top, 10) }, "*");
    yam.$(event.target.parentElement).removeClass(DIV_CLASS + '--dragging');
  };

  var postLinkObject = function(href, title, type) {
    var strData = createDataString(href, truncateTitle(title), type);
    context.postMessage({ type: MSG_NEW_LINK, text: strData }, "*");
  }

  var truncateTitle = function(title) {
    if (title.length > 64) {
      return title.substr(0,64) + '...';
    }
    return title;
  }

  var detectContentType = function(href) {
    if (href.indexOf('inGroup?type=in_group') > -1) {
      return 'group';
    } else if (href.indexOf('Threads/show') > -1) {
      return 'thread';
    } else if (href.indexOf('/users/') > -1) {
      return 'user';
    }
    return 'other';
  };

  var getAPIParam = function(href, regex, cb) {
    var matches = new RegExp(regex).exec(href);
    if (matches[1]) {
      cb(matches[1]);
    }
  }

  var getHTMLPage = function(href, cb) {
    yam.request({
      url: href,
      type: 'GET',
      auth: 'oauth2',
      dataType: 'html',
      success: function(data) {
        cb(data);
      }
    })
  }

  var makeAPIRequest = function(apiName, param, cb) {
    yam.request({
      url:yam.uri.api() + '/' + apiName + '/' + param,
      type: 'GET',
      auth: 'oauth2',
      dataType: 'json',
      success: function(data) {
        cb(data);
      }
    });
  }

  var createDataString = function(href, title, type) {
    return JSON.stringify({
      href: href,
      title: title,
      type: type
    });
  };

})(window);