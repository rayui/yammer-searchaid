(function(context) {

  context.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != context) return;
    if (event.data.type && (event.data.type == "FROM_SIDEBAR")) {
      var data = parseDataString(event.data.strData);
      window.location = data.href;
    }
  }, false);

  context.allowDrop = function(event) {
    event.preventDefault();
  };

  context.trashDrop = function(event) {
    event.preventDefault();
    var href = event.dataTransfer.getData('text');
    window.postMessage({ type: "TRASH", text: href }, "*");
  };

  context.onDrop = function(event) {
    event.preventDefault();
    var href = event.dataTransfer.getData('text');
    var type = detectContentType(href);
    var title;

    window.postMessage({ type: "WAITING", text: type }, "*");

    if (type === 'thread') {
      getThreadInfo(href, function(messageData) {
        title = truncateTitle(messageData.body.plain);
        postMessage(createDataString(href, title, type));
      });
    } else if (type === 'group') {
      getGroupInfo(href, function(groupData) {
        title = truncateTitle(groupData.full_name);
        postMessage(createDataString(href, title, type));
      });
    } else if (type === 'user') {
      getUserInfo(href, function(userData) {
        title = truncateTitle(userData.full_name);
        postMessage(createDataString(href, title, type));
      });
    } else {
      getOtherInfo(href, function(otherData) {
        var titleStart = otherData.indexOf('<title>') + 7;
        var titleLength = otherData.indexOf('</title>') - titleStart - 5;
        var title = otherData.substr(titleStart, titleLength).trim();
        postMessage(createDataString(href, title, type));
      });
    }

    yam.$('#searchAid').removeClass('shown');

  };

  var truncateTitle = function(title) {
    if (title.length > 64) {
      return title.substr(0,64) + '...';
    }
    return title;
  }

  var postMessage = function(strData) {
    window.postMessage({ type: "FROM_PAGE", text: strData }, "*");
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

  var getThreadInfo = function(href, cb) {
    var matches = new RegExp(/threadId=(\d+)/).exec(href);
    if (matches[1]) {
      makeRequest('threads', matches[1], function(threadInfo) {
        makeRequest('messages', threadInfo.thread_starter_id, cb);
      });
    }
  };

  var getGroupInfo = function(href, cb) {
    var matches = new RegExp(/type=in_group&feedId=(\d+)/).exec(href);
    if (matches[1]) {
      if (matches[1]) {
        makeRequest('groups', matches[1], cb);
      }
    }
  };

  var getUserInfo = function(href, cb) {
    var matches = new RegExp(/users\/(\w+)/).exec(href);
    if (matches[1]) {
      makeRequest('users', matches[1], cb);
    }
  };

  var getOtherInfo = function(href, cb) {
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

  var makeRequest = function(apiName, param, cb) {
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