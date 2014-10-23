(function(context) {

  context.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != context) return;
    if (event.data.type && (event.data.type == "FROM_SIDEBAR")) {
      var data = parseDataString(event.data.strData);
      window.location = data.href;
    }
  }, false);

  context.onDrag = function(event) {
    var $el = yam.$(event.srcElement);
    var strData = createDataString($el.attr('href'), $el.attr('title') || $el.text());
    event.dataTransfer.setData("text", strData);
  };

  context.allowDrop = function(event) {
    event.preventDefault();
  };

  context.onDrop = function(event) {
    event.preventDefault();
    window.postMessage({ type: "FROM_PAGE", text: event.dataTransfer.getData('text') }, "*");
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

})(window);