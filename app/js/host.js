function Host (config, $renderContainer) {
  $.extend(this, config);

  this.render($renderContainer);
}

Host.prototype.render = function ($renderContainer) {
  var originEl
  var html = ''
        + '<div data-name="' + this.name + '" class="host ' + (this.enabled ? 'enabled' : '') + '">'
        + '  <div class="host-info">'
        + '    <div class="host-name">'
        + '      <span class="name">' + this.name + '</span>'
        + '      <span class="note">' + this.note + '</span>'
        + '    </div>'
        + '    <div class="current-ip">'
        +         (this.enabled || 'Disabled')
        + '    </div>'
        + '    <ul class="operations">'
        + '      <li class="edit"><i class="icon icon-edit"></i></li>'
        + '      <li class="delete"><i class="icon icon-delete"></i></li>'
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

Host.prototype.highlightName = function (keyword) {
  var $span = this.$el.find('.name');
  $span.html($span.text().replace(keyword, '<span class="search-matched">' + keyword + '</span>'))
}

module.exports = Host;