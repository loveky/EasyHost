var fs = require('fs');
var path = require('path');
var SETTINGS_FILENAME = path.resolve(__dirname,  '../settings.json');

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

exports.get = get;
exports.save = save;