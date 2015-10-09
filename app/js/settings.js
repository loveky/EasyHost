var fs = require('fs');
var path = require('path');
var SETTINGS_FILENAME = path.resolve(__dirname,  '../settings.json');
var eventCenter = require('./eventCenter');
var $ = require('../lib/jquery-2.1.4.min');
var $el = $('.editSettingsModal');

if (! fs.existsSync(SETTINGS_FILENAME)) {
  fs.writeFileSync(SETTINGS_FILENAME, '{"bypassRegexps":[]}');
}

function get (key, defaultValue) {
  var config = JSON.parse(String(fs.readFileSync(SETTINGS_FILENAME)));

  if (key === undefined) {
    return config;
  }
  else {
    if (config[key] === undefined) {
      config[key] = defaultValue;
    }

    return config[key];
  }
}

function save (key, value) {
  var config = JSON.parse(String(fs.readFileSync(SETTINGS_FILENAME)));

  config[key] = value;

  fs.writeFileSync(SETTINGS_FILENAME, JSON.stringify(config));
}

function closeModal () {
  $('.modal-backdrop').hide();
  $('.modal').hide();
}

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

$el.delegate('.save', 'click', function () {
  var bypassRegexps = [];

  $el.find('.host-list ul li').each(function () {
    var text = $.trim($(this).find('input').val());

    if (text !== '') {
      bypassRegexps.push(text);
    }
  });

  save('bypassRegexps', bypassRegexps);

  closeModal();

  eventCenter.trigger('settingsChanged');
});

function edit () {
  var bypassRegexps = get('bypassRegexps');

  $el.find('.host-list ul').empty();

  bypassRegexps.forEach(function (regexpString) {
    $el.find('.host-list ul').append($('<li><input type="text" value="' + regexpString + '"/><i class="icon icon-delete"></i></li>'))
  });

  $el.show();
}

exports.get = get;
exports.save = save;
exports.edit = edit;