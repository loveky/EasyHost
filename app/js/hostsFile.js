var fs = require('fs');
var regexp = require('./hostsRegexp');

var hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

function readFromDisk () {
	return String(fs.readFileSync(hostsPath));
}

function writeToDisk (content) {
	 return fs.writeFileSync(hostsPath, content);
}

function open () {
	require('shell').openItem(hostsPath);
}

exports.readFromDisk = readFromDisk;
exports.writeToDisk = writeToDisk;
exports.open = open;