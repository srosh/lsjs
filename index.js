var fs = require('fs');
module.id = 'fsls';
//todo: add filters
//todo: extend eventemitter
//todo: make async
function fsls(path,callbacksArr,exclude,filters,donecb) {
	if (!path) throw new Error(module.id+' needs a path');
	this.path = path.replace(/\/$/,'');
	if (callbacksArr) this.cbs = callbacksArr;
	else this.cbs = [];
	if (exclude) this.exclude = exclude;
	else this.exclude = [];
	this.ls = [];
	this.result = [];
	this.done = donecb;
	return this;
}
fsls.prototype.runSync = function() {
	this.ls = fs.readdirSync(this.path);
	this.apply();
	return this;
}
fsls.prototype.migrate = function() {
	this.result = [];
	var filenames = [];
	for (var i in this.ls) {
		if (this.exclude.indexOf(this.ls[i])==-1) {
			this.result.push(this.path+'/'+this.ls[i]);
			filenames.push(this.ls[i]);
		}
	}
	this.ls = filenames;
};
fsls.prototype.apply = function(err,files) {
	if (err) throw err;
	if (files) this.ls = files;
	this.migrate();
	var cbs = this.cbs.slice(),cb;
	while (cb = cbs.shift()) {
		this.result = this.result.map(cb);
	}
	if (this.done) this.done(this);
	return this;
};
fsls.prototype.run = function() {
	fs.readdir(this.path,this.apply.bind(this));
	return this;
};

fsls.prototype.writeResultsWhenDone = function(topath,namecb) {
	var callback = function(fslsobj){
		fslsobj.writeResults(topath,namecb);
		if (fslsobj.writedone) fslsobj.writedone(fslsobj);
	}
	if (this.done) {
		this.writedone = this.done;
	}
	this.done = callback;
	return this;
}

fsls.prototype.writeResults = function(topath,namecb) {
	if (namecb) {
		for (var i in this.ls) {
			fs.writeFileSync(this.result[i],topath.replace(/\/$/,'')+'/'+namecb(this.ls[i]));
		}
	} else {
		for (var i in this.ls) {
			fs.writeFileSync(this.result[i],topath.replace(/\/$/,'')+'/'+this.ls[i]);
		}
	}
	return this;
}

fsls.makeReplacer = function(path,regex,rep,exclude,filters,donecb) {
	//rep is callback function for replace;
	if (!path) throw new Error(module.id+' needs a path');
	if (!regex) throw new Error('no regex specified');
	var callbacksArr=[fsls.read,fsls.replace(regex,rep)];
	return new fsls(path,callbacksArr,exclude,filters,donecb);
}

fsls.isdir = function(filename) {
	return fs.statSync(filename).isDirectory();
}
fsls.read = function(filename) {
	// callback for reading files
	if(fsls.isdir(filename)) return false;
	return fs.readFileSync(filename, 'utf-8');
}
fsls.findregex = function(regex) {
	// makes a callback function for finding the regex in text
	return function (text) {
		var result = [],m;
		if (!text) return text;
		result.text=text;
		if(regex.global) while (m = text.match(regex)) result.push(m);
		else {
			m = text.match(regex);
			if (m) result.push(m);
		}
		return result;
	}
}
fsls.replace = function(regex,rep) {
	var withcb = rep;
	if (typeof rep=='string') withcb = function (m) { return rep; };
	return function (text) {
		if (!text) return text;
		var result = text;
		result.replace(regex,withcb);
		return result;
	}
}
module.exports = fsls;