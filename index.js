var fs = require('fs');
function fsls(path,callbacksArr,exclude) {
	if (!path) throw new Error('fsls needs a path');
	this.path = path.replace(/\/$/,'');
	if (callbacksArr) this.cbs = callbacksArr;
	else this.cbs = [];
	if (exclude) this.exclude = exclude;
	else this.exclude = [];
	this.ls = [];
	this.result = [];
	return this;
}
fsls.prototype.runSync = function() {
	this.ls = fs.readdirSync(this.path);
	this.apply();
	return this;
}
fsls.prototype.migrate = function() {
	this.result = [];
	for (var i in this.ls) {
		if (this.exclude.indexOf(this.ls[i])==-1) this.result.push(this.path+'/'+this.ls[i]);
	}
};
fsls.prototype.apply = function(err,files) {
	if (err) throw err;
	if (files) this.ls = files;
	this.migrate();
	var cbs = this.cbs.slice(),cb;
	while (cb = cbs.shift()) {
		this.result = this.result.map(cb);
	}
	return this;
};
fsls.prototype.run = function() {
	fs.readdir(this.path,this.apply.bind(this));
	return this;
};
fsls.isdir = function(filename) {
	return fs.statSync(filename).isDirectory();
}
fsls.read = function(filename) {
	// callback for reading files
	if(fsls.isdir(filename)) return '';
	return fs.readFileSync(filename, 'utf-8');
}
fsls.findregex = function(regex) {
	// makes a callback function for finding the regex in file
	return function (text) {
		var result = [],m;
		result.text=text;
		while (m = text.match(regex)) result.push(m);
		return result;
	}
}
fsls.replace = function(regex,rep) {
	var withcb = rep;
	if (typeof rep=='string') withcb = function (m) { return rep; };
	return function (text) {
		var result = text;
		result.replace(regex,withcb);
		return result;
	}
}
module.exports = fsls;