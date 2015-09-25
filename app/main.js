var app = require('app');
var BrowserWindow = require('browser-window');
var crashReporter = require('crash-reporter');

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
