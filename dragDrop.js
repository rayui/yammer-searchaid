(function(context) {

  context.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != context) return;
    if (event.data.type && (event.data.type == "NAVIGATE")) {
      var data = parseDataString(event.data.strData);
      window.location = data.href;
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
    window.postMessage({ type: "TRASH", text: event.dataTransfer.getData('text') }, "*");
  };

  context.sidebarDrop = function(event) {
    event.preventDefault();
    var href = event.dataTransfer.getData('text');
    var type = detectContentType(href);
    var title;

    window.postMessage({ type: "WAITING", text: type }, "*");

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
          var titleStart = otherData.indexOf('<title>') + 7;
          var titleLength = otherData.indexOf('</title>') - titleStart - 5;
          var title = otherData.substr(titleStart, titleLength).trim();
          postLinkObject(href, title, type);
        });
    }

    yam.$('#searchAid').removeClass('shown');

  };

  var postLinkObject = function(href, title, type) {
    var strData = createDataString(href, truncateTitle(title), type);
    window.postMessage({ type: "NEW_LINK", text: strData }, "*");
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

  var parseDataString = function(strData) {
    data = JSON.parse(strData);
    return data;
  };

  var createDataString = function(href, title, type) {
    return JSON.stringify({
      href: href,
      title: title,
      type: type
    });
  };

})(window);