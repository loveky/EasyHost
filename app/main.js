var app = require('app');
var BrowserWindow = require('browser-window');
var crashReporter = require('crash-reporter');
var ipc = require('ipc');
var exec = require('child_process').exec;

var mainWindow = null;

crashReporter.start();

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 520, height: 750, title: 'EasyHost'});
  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});

ipc.on('flush-system-cache', function () {
  exec('ipconfig /flushdns', function(error, stdout, stderr) {});
});

ipc.on('flush-browser-cache', function () {
  var flushBrowerCacheWindow = new BrowserWindow({width: 450, height: 500, title: '清空浏览器缓存'});
  flushBrowerCacheWindow.loadUrl('file://' + __dirname + '/flush_browser_cache.html');
});