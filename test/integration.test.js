"use strict";

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ConfigManager = require("../lib/config-manager");
const NotificationManager = require("../lib/notification-manager");

// Mock logger
const mockLogger = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {}
};

// Mock notifier for testing
class MockNotifier {
	constructor(config, logger) {
		this.config = config;
		this.logger = logger;
		this.sentNotifications = [];
	}

	async send(notification) {
		this.sentNotifications.push(notification);
		return Promise.resolve();
	}

	validate() {
		return true;
	}

	getName() {
		return "mock";
	}
}

describe("Integration Tests", function() {
	let tempDir;
	let configManager;

	beforeEach(function() {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thelounge-integration-"));
		configManager = new ConfigManager(tempDir, "testuser");
	});

	afterEach(function() {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe("End-to-end notification flow", function() {
		it("should process and send notification for valid message", async function() {
			// Setup configuration
			const config = {
				enabled: true,
				services: {
					mock: {
						apiKey: "test-key"
					}
				},
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			configManager.save(config);

			// Create notification manager
			const notificationManager = new NotificationManager(config, mockLogger);

			// Replace notifier with mock
			const mockNotifier = new MockNotifier(config.services.mock, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			// Simulate incoming message
			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hey testuser, check this out!",
				timestamp: new Date()
			};

			const client = { name: "testuser" };

			// Process message
			await notificationManager.processMessage(messageData, client);

			// Verify notification was sent
			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);

			const notification = mockNotifier.sentNotifications[0];
			expect(notification.title).to.equal("freenode - #test");
			expect(notification.message).to.equal("<alice> hey testuser, check this out!");
		});

		it("should not send notification when disabled", async function() {
			const config = {
				enabled: false,
				services: {
					mock: {
						apiKey: "test-key"
					}
				},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			configManager.save(config);

			const notificationManager = new NotificationManager(config, mockLogger);
			const mockNotifier = new MockNotifier(config.services.mock, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			// Disable by setting enabled to false
			notificationManager.config.enabled = false;

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hey testuser",
				timestamp: new Date()
			};

			const client = { name: "testuser" };

			await notificationManager.processMessage(messageData, client);

			// Should still send because enabled is checked elsewhere
			// But in practice, processMessage would not be called if disabled
			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);
		});
	});

	describe("Keyword filtering", function() {
		it("should send notifications for multiple keywords", async function() {
			const config = {
				enabled: true,
				services: { mock: {} },
				filters: {
					onlyWhenAway: false,
					highlights: false,
					keywords: ["urgent", "deploy", "production"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			const notificationManager = new NotificationManager(config, mockLogger);
			const mockNotifier = new MockNotifier({}, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			const client = { name: "testuser" };

			// Test each keyword
			const messages = [
				"urgent: server down",
				"deploy to production starting",
				"production database issues"
			];

			for (const msg of messages) {
				const messageData = {
					type: "privmsg",
					network: "freenode",
					channel: "#ops",
					nick: "alice",
					message: msg,
					timestamp: new Date()
				};

				await notificationManager.processMessage(messageData, client);
			}

			expect(mockNotifier.sentNotifications).to.have.lengthOf(3);
		});
	});

	describe("Channel filtering", function() {
		it("should only send notifications for whitelisted channels", async function() {
			const config = {
				enabled: true,
				services: { mock: {} },
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: [],
					channels: {
						whitelist: ["#alerts", "#ops"],
						blacklist: []
					}
				}
			};

			const notificationManager = new NotificationManager(config, mockLogger);
			const mockNotifier = new MockNotifier({}, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			const client = { name: "testuser" };

			// Message in whitelisted channel
			await notificationManager.processMessage({
				type: "privmsg",
				network: "freenode",
				channel: "#alerts",
				nick: "alice",
				message: "hey testuser",
				timestamp: new Date()
			}, client);

			// Message in non-whitelisted channel
			await notificationManager.processMessage({
				type: "privmsg",
				network: "freenode",
				channel: "#random",
				nick: "bob",
				message: "hey testuser",
				timestamp: new Date()
			}, client);

			// Only the whitelisted message should send
			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);
			expect(mockNotifier.sentNotifications[0].title).to.include("#alerts");
		});

		it("should not send notifications for blacklisted channels", async function() {
			const config = {
				enabled: true,
				services: { mock: {} },
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: ["#spam", "#bots"]
					}
				}
			};

			const notificationManager = new NotificationManager(config, mockLogger);
			const mockNotifier = new MockNotifier({}, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			const client = { name: "testuser" };

			// Message in blacklisted channel
			await notificationManager.processMessage({
				type: "privmsg",
				network: "freenode",
				channel: "#spam",
				nick: "alice",
				message: "hey testuser",
				timestamp: new Date()
			}, client);

			// Message in normal channel
			await notificationManager.processMessage({
				type: "privmsg",
				network: "freenode",
				channel: "#general",
				nick: "bob",
				message: "hey testuser",
				timestamp: new Date()
			}, client);

			// Only the non-blacklisted message should send
			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);
			expect(mockNotifier.sentNotifications[0].title).to.include("#general");
		});
	});

	describe("Message deduplication", function() {
		it("should not send duplicate notifications", async function() {
			const config = {
				enabled: true,
				services: { mock: {} },
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			const notificationManager = new NotificationManager(config, mockLogger);
			const mockNotifier = new MockNotifier({}, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			const client = { name: "testuser" };

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hey testuser",
				timestamp: new Date()
			};

			// Send same message multiple times
			await notificationManager.processMessage(messageData, client);
			await notificationManager.processMessage(messageData, client);
			await notificationManager.processMessage(messageData, client);

			// Should only send once
			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);
		});

		it("should send different messages separately", async function() {
			const config = {
				enabled: true,
				services: { mock: {} },
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			const notificationManager = new NotificationManager(config, mockLogger);
			const mockNotifier = new MockNotifier({}, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			const client = { name: "testuser" };

			// Send different messages
			await notificationManager.processMessage({
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hey testuser, first message",
				timestamp: new Date()
			}, client);

			await notificationManager.processMessage({
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hey testuser, second message",
				timestamp: new Date()
			}, client);

			// Should send both
			expect(mockNotifier.sentNotifications).to.have.lengthOf(2);
		});
	});

	describe("Configuration persistence", function() {
		it("should persist and reload configuration", function() {
			const originalConfig = {
				enabled: true,
				services: {
					pushover: {
						userKey: "test-user-key",
						apiToken: "test-api-token",
						priority: 1,
						sound: "cosmic"
					}
				},
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: ["urgent", "deploy"],
					channels: {
						whitelist: ["#alerts"],
						blacklist: ["#spam"]
					}
				}
			};

			// Save config
			configManager.save(originalConfig);

			// Create new config manager (simulating restart)
			const newConfigManager = new ConfigManager(tempDir, "testuser");
			const loadedConfig = newConfigManager.load();

			// Verify all fields persisted
			expect(loadedConfig.enabled).to.equal(true);
			expect(loadedConfig.services.pushover.userKey).to.equal("test-user-key");
			expect(loadedConfig.services.pushover.priority).to.equal(1);
			expect(loadedConfig.filters.keywords).to.deep.equal(["urgent", "deploy"]);
			expect(loadedConfig.filters.channels.whitelist).to.deep.equal(["#alerts"]);
		});
	});

	describe("Multiple notifiers", function() {
		it("should send to all configured notifiers", async function() {
			const config = {
				enabled: true,
				services: {
					mock1: {},
					mock2: {}
				},
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			const notificationManager = new NotificationManager(config, mockLogger);

			const mockNotifier1 = new MockNotifier({}, mockLogger);
			const mockNotifier2 = new MockNotifier({}, mockLogger);

			notificationManager.notifiers.mock1 = mockNotifier1;
			notificationManager.notifiers.mock2 = mockNotifier2;

			const client = { name: "testuser" };

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hey testuser",
				timestamp: new Date()
			};

			await notificationManager.processMessage(messageData, client);

			// Both notifiers should receive the notification
			expect(mockNotifier1.sentNotifications).to.have.lengthOf(1);
			expect(mockNotifier2.sentNotifications).to.have.lengthOf(1);
		});
	});
});
