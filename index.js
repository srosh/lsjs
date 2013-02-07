var fs = require('fs');
module.id = 'lsjs';
//todo: extend eventemitter
//todo: make async
function lsjs(path,callbacksArr,exclude,filter,donecb) {
	if (!path) throw new Error(module.id+' needs a path');
	this.path = path.replace(/\/$/,'');
	if (callbacksArr) this.cbs = callbacksArr;
	else this.cbs = [];
	if (exclude) this.exclude = exclude;
	else this.exclude = [];
	this.ls = [];
	this.result = [];
	this.done = donecb;
	this.filter = filter;
	return this;
}
lsjs.prototype.runSync = function() {
	this.ls = fs.readdirSync(this.path);
	this.applySync();
	return this;
}
lsjs.prototype.migrate = function() {
	this.result = [];
	var filenames = [];
	if (this.filter) {
		for (var i in this.ls) {
			var included = (this.exclude.indexOf(this.ls[i])==-1) && this.filter.test(this.ls[i]);
			if (included) {
				this.result.push(this.path+'/'+this.ls[i]);
				filenames.push(this.ls[i]);
			}
		}
	} else {
		for (var i in this.ls) {
			var included = (this.exclude.indexOf(this.ls[i])==-1);
			if (included) {
				this.result.push(this.path+'/'+this.ls[i]);
				filenames.push(this.ls[i]);
			}
		}
	}
	this.ls = filenames;
};
lsjs.prototype.apply = function(err,files) {
	//make que emmit events
	return this.applySync(err,files);
}
lsjs.prototype.applySync = function(err,files) {
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
lsjs.prototype.run = function() {
	fs.readdir(this.path,this.applySync.bind(this));
	return this;
};

lsjs.prototype.writeResultsWhenDone = function(topath,namecb) {
	var callback = function(lsjsobj){
		lsjsobj.writeResults(topath,namecb);
		if (lsjsobj.writedone) lsjsobj.writedone(lsjsobj);
	}
	if (this.done) {
		this.writedone = this.done;
	}
	this.done = callback;
	return this;
}

lsjs.prototype.writeResults = function(topath,namecb) {
	if (namecb) {
		for (var i in this.ls) {
			if(this.result[i]) fs.writeFileSync(topath.replace(/\/$/,'')+'/'+namecb(this.ls[i]),this.result[i]);
		}
	} else {
		for (var i in this.ls) {
			if(this.result[i]) fs.writeFileSync(topath.replace(/\/$/,'')+'/'+this.ls[i],this.result[i]);
		}
	}
	return this;
}

lsjs.makeReplacer = function(path,regex,rep,exclude,filter,donecb) {
	//rep is callback function for replace;
	if (!path) throw new Error(module.id+' needs a path');
	if (!regex) throw new Error('no regex specified');
	var callbacksArr=[lsjs.read,lsjs.replace(regex,rep)];
	return new lsjs(path,callbacksArr,exclude,filter,donecb);
}

lsjs.isdir = function(filename) {
	return fs.statSync(filename).isDirectory();
}
lsjs.read = function(filename) {
	// callback for reading files
	if(lsjs.isdir(filename)) return false;
	return fs.readFileSync(filename, 'utf-8');
}
lsjs.findregex = function(regex) {
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
lsjs.replace = function(regex,rep) {
	var withcb = rep;
	if (typeof rep=='string') withcb = function (m) { return rep; };
	return function (text) {
		if (!text) return text;
		var result = text;
		result = result.replace(regex,withcb);
		return result;
	}
}
module.exports = lsjs;