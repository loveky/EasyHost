var fs = require('fs');

var hostFileContent = String(fs.readFileSync('./hosts'));
var lines = hostFileContent.split('\n');
var data = {};
var regexp = /^\s*(\#*)\s*([a-zA-Z\d\.\:\%]+)\s+(\S+)\s*(\#+\s*(.*))?$/;

lines.forEach(function (line) {
  var result = regexp.exec(line);

  if (result != null) {
    var name = result[3];
    var note = result[5] || '';
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

    if (! data[name].enabled && enabled) {
      data[name].enabled = ip;
    }
  }
});

// var data = {
//   'dev.jd.com': {
//     note: "本地开发",
//     enabled: false,
//     ipList: ['127.0.0.1', '1.1.1.1', '3.3.3.3']
//   },
//   'list.jd.com': {
//     note: "列表页",
//     enabled: '172.11.11.112',
//     ipList: ['172.11.11.112', '233.22.23.22', '55.55.333.22']
//   },
//   'misc.360buyimg.com': {
//     note: "MISC",
//     enabled: '999.33.33.33',
//     ipList: ['11,22,33,33']
//   }
// };

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
        + '      <li class="select"><i class="fa fa-ellipsis-v"></i></li>'
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
  });
};

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
  
  return text.join('\n');
};

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
    }
  },
  init: function () {
    var self = this;
    this.$container.delegate('.host', 'click', function () {
      self.hosts[$(this).data('name')].toggleEnableState();

      console.log(self.toText());
    });

    this.$container.delegate('li.select', 'click', function (event) {
      event.stopPropagation();
      self.hosts[$(this).closest('.host').data('name')].selectHost();
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
      });
    });

    this.$container.delegate('li.delete', 'click', function (event) {
      event.stopPropagation();
      self.removeHost($(this).closest('.host').data('name'));
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

    return text.join('\n\n');
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
  });
});
