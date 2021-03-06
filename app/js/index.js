// node模块
var fs = require('fs');

// electron模块
var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var clipboard = require('clipboard');
var BrowserWindow = remote.require('browser-window');
var ipc = require('ipc');

// 第三方模块
var $ = require('./lib/jquery-2.1.4.min');

// 项目模块
var regexp = require('./js/hostsRegexp');
var hostAdmin = require('./js/hostAdmin');
var Host = require('./js/host');
var eventCenter = require('./js/eventCenter');
var editHostService = require('./js/editHostService');
var hostsFile = require('./js/hostsFile');
var settings = require('./js/settings');


hostAdmin.init();
hostAdmin.readConfigFromDisk();

// 初始化程序菜单
var menu = new Menu();
var template = [
  {
    label: '操作',
    submenu: [
      {
        label: '打开Hosts文件',
        click: function() { hostsFile.open(); }
      },
      {
        label: '重新载入host信息',
        click: function() { hostAdmin.readConfigFromDisk(); }
      },
      {
        type: 'separator'
      },
      {
        label: '清空系统缓存',
        click: function () {
          ipc.send('flush-system-cache');
        }
      },
      {
        label: '清空浏览器缓存',
        click: function () {
          ipc.send('flush-browser-cache');
        }
      },
      {
        type: 'separator'
      },
      {
        label: '编辑host过滤条件',
        click: function () {
          settings.edit();
        }
      }
    ]
  },
  {
    label: '关于',
    submenu: [
      {
        label: '关于EasyHost',
        click: function() {
          var aboutWindow = new BrowserWindow({width: 400, height: 400, title: '关于EasyHost', 'use-content-size': true});
          aboutWindow.loadUrl('file://' + __dirname + '/about.html');
        }
      }
    ]
  }
];

menu = Menu.buildFromTemplate(template);
remote.getCurrentWindow().setMenu(menu);

// 触发hostChanged事件时将配置写入硬盘
eventCenter.bind('hostChanged', function () {
  hostAdmin.saveToDisk();
});

// 搜索Host
$('#search-host').bind('keyup', function () {
  var keyword = $(this).val();

  hostAdmin.filter(keyword);
});

// 添加新Host
$('#new-host').bind('click', function () {
  var host = {ipList: []};

  editHostService.edit(host, function (host) {
    hostAdmin.addHost(host);
    eventCenter.trigger('hostChanged');
  });
});

$('#toggle-disabled').bind('click', function () {
  var $this = $(this);

  $this.text() == '隐藏禁用' ? $this.text('显示禁用') : $this.text('隐藏禁用');
  hostAdmin.toggleDisabled();
});

// 粘贴文本时更新配置
$(document).on('paste', function (event) {
  if ($(event.target).is('input')) {
    return;
  }

  event.preventDefault();

  var text = event.originalEvent.clipboardData.getData('text');
  hostAdmin.mergeConfig(text);

  eventCenter.trigger('hostChanged');
});

// F12打开开发者工具
$(document).bind("keyup", function (event) {
  if (event.keyCode == 123) {
    var currentWindow = remote.getCurrentWindow();

    currentWindow.toggleDevTools();
  }
});