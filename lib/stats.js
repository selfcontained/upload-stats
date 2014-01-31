var EventEmitter = require('events').EventEmitter,
	extend = require('deap').extendShallow,
	bytes = require('bytes'),
	timestr = require('timestr'),
	debounce = require('debounce'),
	File = require('./file');

var Stats = module.exports = function(config) {
	EventEmitter.call(this);

	// put defaults here
	this.config = extend({
		debounce: '1s'
	}, config||{});

	this.files = [];
	this.total = 0;
	this.lastSpeed = 0;
	this.lastUploadedProgress = 0;
	this.lastProgressTime = null;

	this.startTime = null;
};

Stats.prototype = extend({

	add: function(fileSize) {
		fileSize = typeof fileSize == 'string' ? bytes(fileSize) : fileSize;

		this.total += fileSize;

		var file = new File(fileSize);

		this.files.push(file);

		// listen to progress events
		var track = this.trackProgress.bind(this);
		if(this.config.debounce) {
			track = debounce(
				track,
				// 1000
				timestr(this.config.debounce).toMilliseconds()
			);
		}

		file.on('progress', track);

		return file;
	},

	trackProgress: function() {
		var timestamp = Date.now(),
			total = this.getUploaded(),
			// bytes uploaded since last progress event
			chunk =  total - this.lastUploadedProgress,
			// seconds elapsed since last progress event
			elapsed = (timestamp - this.lastProgressTime) / 1000,
			bytesPerSecond = Math.round(chunk/elapsed);

		this.lastSpeed = bytesPerSecond;
		this.lastUploadedProgress = total;
		this.lastProgressTime = timestamp;

		this.emit('speed', bytesPerSecond, bytes(bytesPerSecond), this.getSecondsRemaining());
	},

	start: function() {
		this.startTime = this.lastProgressTime = Date.now();
	},

	getTotal: function() {
		return this.total;
	},

	getUploaded: function() {
		return this.files.reduce(function(total, file) {
			return total + file.uploaded;
		}, 0);
	},

	getPercentage: function() {
		// round this
		return this.getUploaded() / this.total;
	},

	getElapsed: function() {
		return Date.now() - this.startTime;
	},

	getSpeed: function() {
		return this.lastSpeed;
	},

	getSpeedFormatted: function() {
		return bytes(this.lastSpeed);
	},

	getBytesRemaining: function() {
		return this.total - this.getUploaded();
	},

	getSecondsRemaining: function() {
		var bytes = this.getBytesRemaining();

		return Math.round(bytes / this.lastSpeed);
	},

	formatSize: bytes

}, EventEmitter.prototype);
