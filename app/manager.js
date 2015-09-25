var fs = require('fs');
var $ = require('./jquery-2.1.4.min');

var remote = require('remote');

var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');

var clipboard = require('clipboard');

var hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
var hostFileContent = String(fs.readFileSync(hostsPath));
var lines = hostFileContent.split('\n');
var data = {};
var regexp = /^\s*(\#*)\s*([a-zA-Z\d\.\:\%]+)\s+(\S+)\s*(\#+\s*(.*?)\s*)?$/;

lines.forEach(function (line) {
  var result = line.match(regexp);

  if (result != null) {
    var name = result[3];
    var note = $.trim(result[5] || '');
    var ip = result[2];
    var enabled = result[1].length === 0;
    if (!data.hasOwnProperty(result[3])) {
      data[name] = {
        name: name,
        enabled: false,
        ipList: [],
        note: note
      };
    }

    if (data[name].ipList.indexOf(ip) == -1) {
      data[name].ipList.push(ip);
    }

    if (data[name].note.length == 0 && note.length > 0) {
      data[name].note = note;
    }

    if (! data[name].enabled && enabled) {
      data[name].enabled = ip;
    }
  }
});

var eventCenter = $({});

function Host (config, $renderContainer) {
  $.extend(this, config);

  this.render($renderContainer);
  // this.bindEvent();
}

Host.prototype.render = function ($renderContainer) {
  var originEl
  var html = ''
        + '<div data-name="' + this.name + '" class="host ' + (this.enabled ? 'enabled' : '') + '">'
        + '  <div class="host-info">'
        + '    <div class="host-name">'
        + '      <span>' + this.name + '</span>'
        + '      <span class="note">' + this.note + '</span>'
        + '    </div>'
        + '    <div class="current-ip">'
        +         (this.enabled || 'Disabled')
        + '    </div>'
        + '    <ul class="operations">'
        + '      <li class="edit"><i class="fa fa-gear"></i></li>'
        + '      <li class="delete"><i class="fa fa-trash"></i></li>'
        + '    </ul>'
        + '  </div>'
        + '</div>';
  if (this.$el) {
    originEl = this.$el;
    this.$el = $(html);
    originEl.replaceWith(this.$el);
  }
  else {
    this.$el = $(html);
    $renderContainer.append(this.$el);    
  }
};

Host.prototype.toggleEnableState = function () {
  if (this.enabled) {
    this.disable();
  }
  else {
    this.enable();
  }
};

Host.prototype.disable = function () {
  this.enabled = false;
  this.$el.removeClass('enabled');
  this.$el.find('.current-ip').text('Disabled');

  eventCenter.trigger('hostChanged');
};

Host.prototype.enable = function () {
  var self = this;
  if (this.ipList.length === 0) {
    alert("还没有为该host添加IP地址");
  }
  else {
    this.selectHost();
  }
};

function closeModal () {
  $('.modal-backdrop').hide();
  $('.modal').hide();
}

Host.prototype.selectHost = function (onSelectCallback) {
  var html = [];
  var self = this;
  this.ipList.forEach(function (ip) {
    html.push('<li class="' + (ip === self.enabled ? "enabled" : "") + '">'+ip+'</li>')
  });

  $('.selectIpModal').undelegate('click').find('.chooseIp').html(html.join(''));

  $('.modal-backdrop').show();
  $('.selectIpModal').show().delegate('li', 'click', function () {
    onSelectCallback && onSelectCallback($(this).text());

      self.enabled = $(this).text();
      self.$el.addClass('enabled');
      self.$el.find('.current-ip').text($(this).text());

    closeModal();
    eventCenter.trigger('hostChanged');
  });
};

Host.prototype.use = function (ip) {
  if (this.ipList.indexOf(ip) == -1 || this.enabled === ip) {
    return;
  }

  this.$el.addClass('enabled');
  this.$el.find('.current-ip').text(ip);
  this.enabled = ip;

  eventCenter.trigger('hostChanged');
}

Host.prototype.delete = function () {
  this.$el.remove();
};

Host.prototype.show = function () {
  this.$el.show();
};

Host.prototype.hide = function () {
  this.$el.hide();
};

function ensureLength (str, length) {
  var space = ' ';
  if (str.length > length) {
    return str + ' ';
  }
  else {
    return str + space.repeat(length - str.length);
  }
}

Host.prototype.toText = function () {
  var text = [];
  var self = this;

  this.ipList.forEach(function (ip) {
    text.push(ensureLength((ip == self.enabled ? '' : '# ') + ip, 20) + ensureLength(self.name, 30) + (self.note ? '# ' + self.note : ''));
  });
  
  return text.join('\r\n');
};

function showContextMenu (host) {
  var getCopyCurrentConfigHandler = function (host) {
    return function () {
      clipboard.writeText(host.name + ' ' + host.enabled + ' #' + host.note);
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
  }
};

hostAdmin.init();

var editHostService = {
  edit: function (host, onSaveCallback) {

    this.$el.find('.name').val(host.name);
    this.$el.find('.note').val(host.note);
    this.$el.find('ul').empty();
    var self = this;
    host.ipList.forEach(function (ip) {
      self.$el.find('ul').append('<li><input type="text" value="' + ip + '" /></li>')
    });

    $('.modal-backdrop').show();
    this.$el.show();

    this.$el.find('.save').unbind().bind('click', function () {
      host.name = self.$el.find('.name').val();
      host.note = self.$el.find('.note').val();
      host.ipList = [];
      self.$el.find('li').each(function (index, el) {
        var ip = $(el).find('input').val();
        if (ip && ip.length > 0) {
          host.ipList.push(ip);
        }
      });

      if (host.enabled && host.ipList.indexOf(host.enabled) == -1) {
        host.enabled = false;
      }

      onSaveCallback && onSaveCallback(host);

      closeModal();
    });
  },
  init: function ($el) {
    var self = this;

    this.$el = $el;
    this.$el.hide();

    this.$el.delegate('.add', 'click', function () {
      self.$el.find('ul').append('<li><input type="text"/></li>');
    });

    this.$el.delegate('.cancel', 'click', function () {
      closeModal();
    });
  }
};

editHostService.init($('.editHostModal'));

$.each(data, function (key, value) {
  value.name = key;
  hostAdmin.addHost(value);
});

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
  fs.writeFileSync(hostsPath, hostAdmin.toText());
});




var menu = new Menu();

var template = [
  {
    label: '操作',
    submenu: [
      {
        label: '打开Hosts文件',
        click: function() { require('shell').openItem(hostsPath) }
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
});

$(document).bind("keyup", function (event) {
  if (event.keyCode == 123) {
    var currentWindow = remote.getCurrentWindow();

    currentWindow.toggleDevTools();
  }
});