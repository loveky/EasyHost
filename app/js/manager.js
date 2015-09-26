// node模块
var fs = require('fs');

// electron模块
var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var clipboard = require('clipboard');

// 第三方模块
var $ = require('./lib/jquery-2.1.4.min');

// 项目模块
var regexp = require('./js/hostsRegexp');
var hostAdmin = require('./js/hostAdmin');
var Host = require('./js/host');
var eventCenter = require('./js/eventCenter');
var editHostService = require('./js/editHostService');
var hostsFile = require('./js/hostsFile');


hostAdmin.init();
hostAdmin.readConfigFromDisk();

$('#search-host').bind('keyup', function () {
  var keyword = $(this).val();

  hostAdmin.filter(keyword);
});

$('#new-host').bind('click', function () {
  var host = {ipList: []};

  editHostService.edit(host, function (host) {
    hostAdmin.addHost(host);
    eventCenter.trigger('hostChanged');
  });
});

eventCenter.bind('hostChanged', function () {
  hostAdmin.saveToDisk();
});

var menu = new Menu();
var template = [
  {
    label: '操作',
    submenu: [
      {
        label: '打开Hosts文件',
        click: function() { hostsFile.open(); }
      }
    ]
  },
  {
    label: '关于',
    submenu: [
      {
        label: '关于EasyHost',
        click: function() { require('shell').openExternal('http://electron.atom.io') }
      }
    ]
  }
];

menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

$(document).on('paste', function (event) {
  event.preventDefault();

  var result;
  var text = event.originalEvent.clipboardData.getData('text');
  var lines = text.split('\n');
  lines.forEach(function (line) {
    result = line.match(regexp);

    if (result) {
      var name = result[3];
      var note = $.trim(result[5] || '');
      var ip = result[2];
      var enabled = result[1].length === 0;

      if (hostAdmin.hosts.hasOwnProperty(name)) {
        if (hostAdmin.hosts[name].ipList.indexOf(ip) == -1) {
          hostAdmin.hosts[name].ipList.push(ip);
        }

        if (enabled) {
          hostAdmin.hosts[name].use(ip);
        }
      }
      else {
        hostAdmin.addHost({
          name: name,
          note: note,
          ipList: [ip],
          enabled: enabled ? ip : false
        });
      }
    }
  });

  eventCenter.trigger('hostChanged');
});

$(document).bind("keyup", function (event) {
  if (event.keyCode == 123) {
    var currentWindow = remote.getCurrentWindow();

    currentWindow.toggleDevTools();
  }
});