var $ = require('../lib/jquery-2.1.4.min');

var $el = $('.editHostModal');

$el.hide();

$el.delegate('.add', 'click', function () {
  $el.find('ul').append('<li><input type="text"/><i class="icon icon-delete"></i></li>');
});

$el.delegate('.icon-delete', 'click', function () {
  $(this).parent().remove();
});

$el.delegate('.cancel', 'click', function () {
  closeModal();
});

function closeModal () {
  $('.modal-backdrop').hide();
  $('.modal').hide();
}

function edit (host, onSaveCallback) {
  $el.find('.name').val(host.name);
  $el.find('.note').val(host.note);
  $el.find('ul').empty();

  host.ipList.forEach(function (ip) {
    $el.find('ul').append('<li><input type="text" value="' + ip + '" /><i class="icon icon-delete"></i></li>')
  });

  $('.modal-backdrop').show();
  $el.show();

  $el.find('.save').unbind().bind('click', function () {
    host.name = $el.find('.name').val();
    host.note = $el.find('.note').val();
    host.ipList = [];
    $el.find('li').each(function (index, el) {
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
}

exports.edit = edit;