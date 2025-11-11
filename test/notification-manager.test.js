"use strict";

const { expect } = require("chai");
const NotificationManager = require("../lib/notification-manager");

// Mock logger
const mockLogger = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {}
};

// Mock notifier
class MockNotifier {
	constructor() {
		this.sentNotifications = [];
	}

	async send(notification) {
		this.sentNotifications.push(notification);
		return Promise.resolve();
	}

	getName() {
		return "mock";
	}
}

describe("NotificationManager", function() {
	let notificationManager;
	let mockNotifier;

	beforeEach(function() {
		mockNotifier = new MockNotifier();
	});

	describe("shouldNotify()", function() {
		it("should notify on highlight when highlights enabled", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "bob",
				message: "hey testuser, how are you?"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(true);
		});

		it("should not notify on non-highlight when only highlights enabled", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "bob",
				message: "hello world"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(false);
		});

		it("should notify on keyword match", function() {
			const config = {
				services: {},
				filters: {
					highlights: false,
					keywords: ["urgent", "deploy"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#ops",
				nick: "alice",
				message: "urgent: production is down"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(true);
		});

		it("should not notify on keyword mismatch", function() {
			const config = {
				services: {},
				filters: {
					highlights: false,
					keywords: ["urgent", "deploy"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#general",
				nick: "bob",
				message: "just chatting"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(false);
		});

		it("should respect channel whitelist", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: ["#alerts", "#ops"],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#general",
				nick: "bob",
				message: "hey testuser"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(false);
		});

		it("should allow whitelisted channels", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: ["#alerts", "#ops"],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#alerts",
				nick: "bob",
				message: "hey testuser"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(true);
		});

		it("should respect channel blacklist", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: ["#spam", "#bots"]
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#spam",
				nick: "bob",
				message: "hey testuser"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(false);
		});

		it("should allow non-blacklisted channels", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: [],
						blacklist: ["#spam", "#bots"]
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#general",
				nick: "bob",
				message: "hey testuser"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(true);
		});

		it("should match keywords case-insensitively", function() {
			const config = {
				services: {},
				filters: {
					highlights: false,
					keywords: ["urgent"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#ops",
				nick: "alice",
				message: "URGENT: check this out"
			};

			const client = { name: "testuser" };

			const result = notificationManager.shouldNotify(messageData, client);
			expect(result).to.equal(true);
		});

		it("should notify on either highlight OR keyword match", function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: ["deploy"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);

			// Test highlight
			let messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#general",
				nick: "alice",
				message: "testuser: hello"
			};

			let client = { name: "testuser" };
			expect(notificationManager.shouldNotify(messageData, client)).to.equal(true);

			// Test keyword
			messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#ops",
				nick: "bob",
				message: "deploy finished successfully"
			};

			expect(notificationManager.shouldNotify(messageData, client)).to.equal(true);
		});
	});

	describe("formatNotification()", function() {
		beforeEach(function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: { whitelist: [], blacklist: [] }
				}
			};
			notificationManager = new NotificationManager(config, mockLogger);
		});

		it("should format regular messages", function() {
			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hello world",
				timestamp: new Date()
			};

			const notification = notificationManager.formatNotification(messageData);

			expect(notification.title).to.equal("freenode - #test");
			expect(notification.message).to.equal("<alice> hello world");
		});

		it("should format action messages", function() {
			const messageData = {
				type: "action",
				network: "freenode",
				channel: "#test",
				nick: "bob",
				message: "waves hello",
				timestamp: new Date()
			};

			const notification = notificationManager.formatNotification(messageData);

			expect(notification.title).to.equal("freenode - #test");
			expect(notification.message).to.equal("* bob waves hello");
		});

		it("should format private messages without channel", function() {
			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "alice",
				nick: "alice",
				message: "private message",
				timestamp: new Date()
			};

			const notification = notificationManager.formatNotification(messageData);

			expect(notification.title).to.equal("freenode");
			expect(notification.message).to.equal("<alice> private message");
		});
	});

	describe("getDeduplicationKey()", function() {
		beforeEach(function() {
			const config = {
				services: {},
				filters: {
					highlights: true,
					keywords: [],
					channels: { whitelist: [], blacklist: [] }
				}
			};
			notificationManager = new NotificationManager(config, mockLogger);
		});

		it("should generate consistent keys for same message", function() {
			const messageData = {
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hello world"
			};

			const key1 = notificationManager.getDeduplicationKey(messageData);
			const key2 = notificationManager.getDeduplicationKey(messageData);

			expect(key1).to.equal(key2);
		});

		it("should generate different keys for different messages", function() {
			const messageData1 = {
				network: "freenode",
				channel: "#test",
				nick: "alice",
				message: "hello world"
			};

			const messageData2 = {
				network: "freenode",
				channel: "#test",
				nick: "bob",
				message: "hello world"
			};

			const key1 = notificationManager.getDeduplicationKey(messageData1);
			const key2 = notificationManager.getDeduplicationKey(messageData2);

			expect(key1).to.not.equal(key2);
		});
	});

	describe("processMessage()", function() {
		it("should send notification for valid message", async function() {
			const config = {
				services: { mock: {} },
				filters: {
					highlights: true,
					keywords: [],
					channels: { whitelist: [], blacklist: [] }
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

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

			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);
			expect(mockNotifier.sentNotifications[0].title).to.equal("freenode - #test");
		});

		it("should not send notification for filtered message", async function() {
			const config = {
				services: { mock: {} },
				filters: {
					highlights: true,
					keywords: [],
					channels: {
						whitelist: ["#alerts"],
						blacklist: []
					}
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

			const messageData = {
				type: "privmsg",
				network: "freenode",
				channel: "#general",
				nick: "alice",
				message: "hey testuser",
				timestamp: new Date()
			};

			const client = { name: "testuser" };

			await notificationManager.processMessage(messageData, client);

			expect(mockNotifier.sentNotifications).to.have.lengthOf(0);
		});

		it("should deduplicate identical messages", async function() {
			const config = {
				services: { mock: {} },
				filters: {
					highlights: true,
					keywords: [],
					channels: { whitelist: [], blacklist: [] }
				}
			};

			notificationManager = new NotificationManager(config, mockLogger);
			notificationManager.notifiers.mock = mockNotifier;

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
			await notificationManager.processMessage(messageData, client);

			// Should only send once due to deduplication
			expect(mockNotifier.sentNotifications).to.have.lengthOf(1);
		});
	});
});
