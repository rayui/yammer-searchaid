(function(context) {
  context.onDrag = function(event) {
    event.dataTransfer.setData("text/html", event.srcElement.href);
  }

  context.allowDrop = function(event) {
    event.preventDefault();
  }

  context.onDrop = function(event) {
    event.preventDefault();
    window.postMessage({ type: "FROM_PAGE", text: event.dataTransfer.getData('text') }, "*");
  }
})(window);