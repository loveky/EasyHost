var remote = require('remote');
var flushWindow = remote.getCurrentWindow();
var $ = require('./lib/jquery-2.1.4.min');
var clipboard = require('clipboard');

flushWindow.setMenu(null);

$('a').on('click', function (event) {
  event.preventDefault();

  clipboard.writeText($(this).text());
});