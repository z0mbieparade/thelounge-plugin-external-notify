"use strict";

const { expect } = require("chai");
const PushoverNotifier = require("../lib/notifiers/pushover");

// Mock logger
const mockLogger = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {}
};

describe("PushoverNotifier", function() {
	describe("constructor", function() {
		it("should create notifier with valid config", function() {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30),
				priority: 0,
				sound: "pushover"
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			expect(notifier).to.be.an.instanceof(PushoverNotifier);
			expect(notifier.priority).to.equal(0);
			expect(notifier.sound).to.equal("pushover");
		});

		it("should throw error with invalid config", function() {
			const config = {
				userKey: "short",
				apiToken: ""
			};

			expect(() => {
				new PushoverNotifier(config, mockLogger);
			}).to.throw("Invalid Pushover configuration");
		});

		it("should use default priority and sound", function() {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30)
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			expect(notifier.priority).to.equal(0);
			expect(notifier.sound).to.equal("pushover");
		});
	});

	describe("validate()", function() {
		it("should return true for valid config", function() {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30),
				priority: 0,
				sound: "pushover"
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			expect(notifier.validate()).to.equal(true);
		});

		it("should return false for missing userKey", function() {
			const config = {
				userKey: "",
				apiToken: "b".repeat(30),
				priority: 0,
				sound: "pushover"
			};

			// Constructor will throw, so we test validate directly
			const notifier = Object.create(PushoverNotifier.prototype);
			notifier.config = config;
			notifier.logger = mockLogger;

			expect(notifier.validate()).to.equal(false);
		});

		it("should return false for missing apiToken", function() {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "",
				priority: 0,
				sound: "pushover"
			};

			const notifier = Object.create(PushoverNotifier.prototype);
			notifier.config = config;
			notifier.logger = mockLogger;

			expect(notifier.validate()).to.equal(false);
		});

		it("should warn for incorrect key lengths", function() {
			const warnings = [];
			const warnLogger = {
				info: () => {},
				warn: (msg) => warnings.push(msg),
				error: () => {},
				debug: () => {}
			};

			const config = {
				userKey: "short-key",
				apiToken: "short-token",
				priority: 0,
				sound: "pushover"
			};

			const notifier = Object.create(PushoverNotifier.prototype);
			notifier.config = config;
			notifier.logger = warnLogger;

			notifier.validate();

			expect(warnings).to.have.lengthOf(2);
			expect(warnings[0]).to.include("userKey should be 30 characters");
			expect(warnings[1]).to.include("apiToken should be 30 characters");
		});
	});

	describe("getName()", function() {
		it("should return pushover", function() {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30),
				priority: 0,
				sound: "pushover"
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			expect(notifier.getName()).to.equal("pushover");
		});
	});

	describe("send()", function() {
		it("should format notification correctly", function(done) {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30),
				priority: 1,
				sound: "cosmic"
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			// Mock the Pushover client
			notifier.client.send = function(msg, callback) {
				expect(msg.message).to.equal("Test message");
				expect(msg.title).to.equal("Test title");
				expect(msg.priority).to.equal(1);
				expect(msg.sound).to.equal("cosmic");
				expect(msg.timestamp).to.be.a("number");

				callback(null, "success");
			};

			const notification = {
				title: "Test title",
				message: "Test message",
				timestamp: new Date()
			};

			notifier.send(notification).then(() => {
				done();
			}).catch(done);
		});

		it("should convert timestamp to unix timestamp", function(done) {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30),
				priority: 0,
				sound: "pushover"
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			const testDate = new Date("2025-01-01T00:00:00Z");
			const expectedTimestamp = Math.floor(testDate.getTime() / 1000);

			notifier.client.send = function(msg, callback) {
				expect(msg.timestamp).to.equal(expectedTimestamp);
				callback(null, "success");
			};

			const notification = {
				title: "Test",
				message: "Test",
				timestamp: testDate
			};

			notifier.send(notification).then(() => {
				done();
			}).catch(done);
		});

		it("should reject on error", function(done) {
			const config = {
				userKey: "a".repeat(30),
				apiToken: "b".repeat(30),
				priority: 0,
				sound: "pushover"
			};

			const notifier = new PushoverNotifier(config, mockLogger);

			notifier.client.send = function(msg, callback) {
				callback(new Error("API error"), null);
			};

			const notification = {
				title: "Test",
				message: "Test",
				timestamp: new Date()
			};

			notifier.send(notification).then(() => {
				done(new Error("Should have rejected"));
			}).catch((err) => {
				expect(err.message).to.equal("API error");
				done();
			});
		});
	});
});
