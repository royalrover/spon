var path = require('path');
var fs = require('fs');
var shelljs = require('shelljs');
var request = require('request');

module.exports = {

	// 创建隐藏文件，存放fetch的模块以及webpack.config.js
	createMobiSandbox: function() {
		var home = process.env[(this.getPlatform() == 'win32') ? 'USERPROFILE' : 'HOME'];
		var showjoyBase = path.join(home,'.spon');
		var mobiBase = path.join(showjoyBase,'mobi');
		var modulesBase = path.join(mobiBase,'modules');

		if(!fs.existsSync(showjoyBase)){
			// 创建 .spon目录
			shelljs.mkdir(showjoyBase);
			shelljs.mkdir(mobiBase);
			shelljs.mkdir(path.join(modulesBase));
		}
		return;
	},

	getWebpackPath: function(){
		var home = process.env[(this.getPlatform() == 'win32') ? 'USERPROFILE' : 'HOME'];
		var showjoyBase = path.join(home,'.spon');
		var mobiBase = path.join(showjoyBase,'mobi');
		return path.join(mobiBase, 'webpack.config.js');
	},

	// 获取平台
	getPlatform: function() {

		return process.platform;

	},

	// 获取用户
	getUser: function() {

		var home = process.env[(this.getPlatform() == 'win32') ? 'USERPROFILE' : 'HOME'];
		var file = path.join(home, '.gitconfig');

		if (fs.existsSync(file)) {

			var userinfo = fs.readFileSync(file, 'utf8');

			var usernamereg = /\s*name\s*=\s*(\S+)/;

			var usermatch = userinfo.match(usernamereg);

			if (usermatch && usermatch[1]) {

				return usermatch[1];

			}

		}

		return 'robot';
		
	},

	// 获取日期
	getDate: function() {

		var time = new Date();

		var year = time.getFullYear();

		var month = time.getMonth() + 1;

		var date = time.getDate();

		return [year, month, date].join('-');

	},

	// 获取时间
	getTime: function() {

		var time = new Date();

		var hour = time.getHours();

		var minute = time.getMinutes();

		var second = time.getSeconds();

		return [hour, minute, second].join(':');

	},

	// 获取正在进行的项目代号
	getRepo: function() {

		var file = path.join(process.cwd(), "spon.json");

		if (fs.existsSync(file)) {

			try {

				var config = fs.readFileSync(file, 'utf-8');

				var data = JSON.parse(config.replace(/\n/g, ' '));

				return [data.group, data.name].join('.');

			} catch(e) {}

		}

		return 'test';

	},

	// 存储 log
	log: function(data) {

		var d = { 
			user: this.getUser(),
			env: this.getPlatform(),
			repo: this.getRepo()
		};

		for (var i in data) {
			d[i] = data[i];
		}

		request.post(

			{

				url: 'http://code.spon.showjoy.net/api/code_log.php',

				form: d,

				timeout: 3000

			},

			function(err, req, body) {

			}

		);

	}

};

