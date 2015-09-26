var remote = require('remote');
var aboutWindow = remote.getCurrentWindow();
aboutWindow.setMenu(null);

aboutWindow.focus();

aboutWindow.on('blur', function () {
	aboutWindow.focus();
	return false;
});