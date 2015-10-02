var remote = require('remote');
var aboutWindow = remote.getCurrentWindow();
var shell = require('shell');
var $ = require('./lib/jquery-2.1.4.min');

aboutWindow.setMenu(null);

$('a').on('click', function (event) {
  event.preventDefault();
  shell.openExternal($(this).attr('href'));
});