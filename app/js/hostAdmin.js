var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');

var $ = require('../lib/jquery-2.1.4.min');

var hostsFile = require('./hostsFile');
var editHostService = require('./editHostService');
var Host = require('./host');

function showContextMenu (host) {
  var getCopyCurrentConfigHandler = function (host) {
    return function () {
      clipboard.writeText(host.enabled + ' ' + host.name + ' #' + host.note);
    }
  }

  var getCopyAllConfigHandler = function (host) {
    return function () {
      clipboard.writeText(host.toText());
    }
  }

  var template = [];
  var menu = new Menu();
  template.push({label: '复制当前配置', click: getCopyCurrentConfigHandler(host), enabled: !!host.enabled});
  template.push({label: '复制所有配置', click: getCopyAllConfigHandler(host)});

  template.push({type: 'separator'});

  host.ipList.forEach(function (ip) {
    template.push({label: '启用 ' + ip, click: function () {host.use(ip)}, enabled: ip !== host.enabled});
  });

  template.forEach(function (item) {
    menu.append(new MenuItem(item));
  });

  menu.popup(remote.getCurrentWindow());
}

var hostAdmin = {
  $container: $('#host-group'),
  hosts: {},
  addHost: function (host) {
    this.hosts[host.name] = new Host(host, this.$container);
  },
  removeHost: function (hostname) {
    if (!confirm("确定要删除关于" + hostname  + "的host信息吗?")) {
      return;
    }

    if (this.hosts.hasOwnProperty(hostname)) {
      this.hosts[hostname].delete();
      delete this.hosts[hostname];
      eventCenter.trigger('hostChanged');
    }
  },
  init: function () {
    var self = this;
    this.$container.delegate('.host', 'click', function () {
      self.hosts[$(this).data('name')].toggleEnableState();
    });

    this.$container.delegate('li.edit', 'click', function (event) {
      var host = self.hosts[$(this).closest('.host').data('name')];
      var originName = host.name;
      event.stopPropagation();
      editHostService.edit(host, function (host) {
        if (host.name !== originName) {
          self.hosts[host.name] = self.hosts[originName];
          delete self.hosts[originName];
        }
        host.render(self.$container);
        eventCenter.trigger('hostChanged');
      });

    });

    this.$container.delegate('li.delete', 'click', function (event) {
      event.stopPropagation();
      self.removeHost($(this).closest('.host').data('name'));
    });

    this.$container.delegate('.host', 'contextmenu', function (event) {
      event.preventDefault();
      event.stopPropagation();
 
      showContextMenu(self.hosts[$(this).closest('.host').data('name')]);
    });
  },
  filter: function (keyword) {
    var self = this;
    Object.keys(this.hosts).forEach(function (name) {
      if (name.indexOf(keyword) !== -1) {
        self.hosts[name].show();
      }
      else {
        self.hosts[name].hide();
      }
    });
  },
  toText: function () {
    var text = [];
    $.each(this.hosts, function (name, host) {
      text.push(host.toText());
    });

    return text.join('\r\n\r\n');
  },
  readConfigFromDisk: function () {
    var self = this;
    var hostFileContent = hostsFile.readFromDisk();
    var lines = hostFileContent.split('\n');
    var config = {};

    lines.forEach(function (line) {
      var result = line.match(regexp);

      if (result != null) {
        var name = result[3];
        var note = $.trim(result[5] || '');
        var ip = result[2];
        var enabled = result[1].length === 0;
        if (!config.hasOwnProperty(result[3])) {
          config[name] = {
            name: name,
            enabled: false,
            ipList: [],
            note: note
          };
        }

        if (config[name].ipList.indexOf(ip) == -1) {
          config[name].ipList.push(ip);
        }

        if (config[name].note.length == 0 && note.length > 0) {
          config[name].note = note;
        }

        if (! config[name].enabled && enabled) {
          config[name].enabled = ip;
        }
      }
    });

    $.each(config, function (key, value) {
      value.name = key;
      self.addHost(value);
    });
  },
  saveToDisk: function () {
    hostsFile.writeToDisk(this.toText());
  },
  mergeConfig: function (text) {
    var self = this;
    var result;
    var lines = text.split('\n');
    lines.forEach(function (line) {
      result = line.match(regexp);

      if (result) {
        var name = result[3];
        var note = $.trim(result[5] || '');
        var ip = result[2];
        var enabled = result[1].length === 0;

        if (self.hosts.hasOwnProperty(name)) {
          if (self.hosts[name].ipList.indexOf(ip) == -1) {
            self.hosts[name].ipList.push(ip);
          }

          if (enabled) {
            self.hosts[name].use(ip);
          }
        }
        else {
          self.addHost({
            name: name,
            note: note,
            ipList: [ip],
            enabled: enabled ? ip : false
          });
        }
      }
    });
  }
};

module.exports = hostAdmin;