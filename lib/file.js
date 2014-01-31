var EventEmitter = require('events').EventEmitter,
	extend = require('deap').extendShallow;

var File = module.exports = function(total) {
	EventEmitter.call(this);

	this.uploaded = 0;
	this.total = total;
};

File.prototype = extend({

	progress: function(uploaded) {
		uploaded = typeof uploaded == 'string' ? bytes(uploaded) : uploaded;

		this.uploaded = uploaded;
		this.emit('progress', uploaded);
	}

}, EventEmitter.prototype);
