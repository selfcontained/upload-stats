var assert = require('chai').assert,
	Stats = require('../index');

describe('upload-stats', function() {

	it('should be defined properly', function() {
		assert.isFunction(Stats);

		var stats = new Stats();
		assert.isObject(stats);
		assert.isFunction(stats.start);
		assert.isFunction(stats.add);
		assert.isFunction(stats.getTotal);
		assert.isFunction(stats.getUploaded);
		assert.isFunction(stats.getPercentage);
		assert.isFunction(stats.getElapsed);
		assert.isFunction(stats.getSpeed);
		assert.isFunction(stats.getBytesRemaining);
		assert.isFunction(stats.getSecondsRemaining);
	});

	describe('adding files', function() {

		it('should keep track of total upload size', function() {
			var stats = new Stats();

			var file = stats.add(1024);
			assert.isObject(file);
			assert.isFunction(file.progress);
			assert.equal(stats.getTotal(), 1024);
			assert.equal(stats.getUploaded(), 0);
		});

		it('should let you add more files to the total', function() {
			var stats = new Stats();

			stats.add(1024);
			assert.equal(stats.getTotal(), 1024);
			assert.equal(stats.getUploaded(), 0);

			stats.add(1024);
			assert.equal(stats.getTotal(), 2048);
			assert.equal(stats.getUploaded(), 0);
		});

	});

	describe('track progress', function() {

		it('should allow you to track upload progress', function() {
			var stats = new Stats({debounce:false});

			var file = stats.add(1024);
			assert.equal(stats.getUploaded(), 0);

			file.progress(100);
			assert.equal(stats.getUploaded(), 100);

			file.progress(200);
			assert.equal(stats.getUploaded(), 200);

			file.progress(250);
			assert.equal(stats.getUploaded(), 250);

		});

	});

	describe('track elapsed', function() {

		it('should track elapsed time', function(done) {
			var stats = new Stats({debounce:false}),
				file = stats.add(1024);

			stats.start();

			// setTimeout(file.progress.bind(file, 100), 500);

			setTimeout(function() {
				assert.closeTo(stats.getElapsed(), 1000, 15);

				done();
			}, 1000);
		});

	});

	describe('track current speed', function() {

		it('should emit speed events upon progress calls', function(done) {
			var count = 0,
				stats = new Stats({debounce:false}),
				file = stats.add(1024);

			stats.start();

			stats.on('speed', function(speed, formatted, remaining) {
				assert.isNumber(speed);
				assert.isString(formatted);
				assert.isNumber(remaining);
				assert.closeTo(speed, 200, 25);

				if(++count == 3) done();
			});

			setTimeout(file.progress.bind(file, 100), 500);
			setTimeout(file.progress.bind(file, 190), 1000);
			setTimeout(file.progress.bind(file, 295), 1500);
		});

	});

	describe('get remaining time', function() {

		it('it should calculate remaining time for uploads', function(done) {
			var stats = new Stats({debounce:false}),
				file = stats.add(1000);

			stats.start();

			stats.on('speed', function(speed, formatted, remaining) {
				assert.isNumber(speed);
				assert.isString(formatted);
				assert.isNumber(remaining);
				assert.closeTo(speed, 100, 5);
				assert.closeTo(remaining, 10, 1);

				done();
			});

			setTimeout(file.progress.bind(file, 10), 100);

		});

	});

	describe('debounce', function() {

		it('should default a debounce time interval at 1 second', function(done) {
			var stats = new Stats(),
				file = stats.add(1000);

			stats.start();

			// this should only fire once, and on the second progress event
			stats.on('speed', function() {
				assert.equal(stats.getUploaded(), 200);

				done();
			});

			setTimeout(file.progress.bind(file, 100), 500);
			setTimeout(file.progress.bind(file, 200), 700);
		});

		it('should allow you to specify a debounce time interval', function(done) {
			var stats = new Stats({
					debounce: 100
				}),
				file = stats.add(1000);

			stats.start();

			// this should only fire once, and on the second progress event
			stats.on('speed', function() {
				assert.equal(stats.getUploaded(), 300);

				done();
			});

			setTimeout(file.progress.bind(file, 100), 500);
			setTimeout(file.progress.bind(file, 200), 550);
			setTimeout(file.progress.bind(file, 300), 600);
			// last event is > debounce interval
			setTimeout(file.progress.bind(file, 400), 750);
		});

	});

});
