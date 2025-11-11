"use strict";

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ConfigManager = require("../lib/config-manager");

describe("ConfigManager", function() {
	let tempDir;
	let configManager;

	beforeEach(function() {
		// Create a temporary directory for test configs
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thelounge-test-"));
		configManager = new ConfigManager(tempDir, "testuser");
	});

	afterEach(function() {
		// Clean up temporary directory
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe("load()", function() {
		it("should return default config when file does not exist", function() {
			const config = configManager.load();

			expect(config).to.be.an("object");
			expect(config.enabled).to.equal(false);
			expect(config.services).to.be.an("object").that.is.empty;
			expect(config.filters).to.be.an("object");
			expect(config.filters.onlyWhenAway).to.equal(true);
			expect(config.filters.highlights).to.equal(true);
			expect(config.filters.keywords).to.be.an("array").that.is.empty;
		});

		it("should load existing config from disk", function() {
			const testConfig = {
				enabled: true,
				services: {
					pushover: {
						userKey: "test-user-key",
						apiToken: "test-api-token",
						priority: 0,
						sound: "pushover"
					}
				},
				filters: {
					onlyWhenAway: false,
					highlights: true,
					keywords: ["test"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			fs.writeFileSync(
				path.join(tempDir, "testuser-config.json"),
				JSON.stringify(testConfig)
			);

			const config = configManager.load();

			expect(config.enabled).to.equal(true);
			expect(config.services.pushover.userKey).to.equal("test-user-key");
			expect(config.filters.keywords).to.deep.equal(["test"]);
		});

		it("should merge incomplete config with defaults", function() {
			const incompleteConfig = {
				enabled: true,
				services: {}
			};

			fs.writeFileSync(
				path.join(tempDir, "testuser-config.json"),
				JSON.stringify(incompleteConfig)
			);

			const config = configManager.load();

			expect(config.enabled).to.equal(true);
			expect(config.filters).to.be.an("object");
			expect(config.filters.onlyWhenAway).to.equal(true);
			expect(config.filters.highlights).to.equal(true);
		});

		it("should handle malformed JSON gracefully", function() {
			fs.writeFileSync(
				path.join(tempDir, "testuser-config.json"),
				"{ invalid json"
			);

			const config = configManager.load();

			// Should return default config on parse error
			expect(config).to.be.an("object");
			expect(config.enabled).to.equal(false);
		});
	});

	describe("save()", function() {
		it("should save config to disk", function() {
			const testConfig = {
				enabled: true,
				services: {
					pushover: {
						userKey: "test-key",
						apiToken: "test-token",
						priority: 0,
						sound: "pushover"
					}
				},
				filters: {
					onlyWhenAway: true,
					highlights: true,
					keywords: ["urgent"],
					channels: {
						whitelist: [],
						blacklist: []
					}
				}
			};

			const result = configManager.save(testConfig);

			expect(result).to.equal(true);

			const configPath = path.join(tempDir, "testuser-config.json");
			expect(fs.existsSync(configPath)).to.equal(true);

			const savedData = JSON.parse(fs.readFileSync(configPath, "utf8"));
			expect(savedData.enabled).to.equal(true);
			expect(savedData.services.pushover.userKey).to.equal("test-key");
			expect(savedData.filters.keywords).to.deep.equal(["urgent"]);
		});

		it("should validate config before saving", function() {
			const invalidConfig = {
				enabled: "not-a-boolean",
				services: {
					pushover: {
						userKey: "test-key"
						// missing apiToken
					}
				}
			};

			configManager.save(invalidConfig);

			const configPath = path.join(tempDir, "testuser-config.json");
			const savedData = JSON.parse(fs.readFileSync(configPath, "utf8"));

			// Should convert invalid enabled to false
			expect(savedData.enabled).to.equal(false);
			// Should fill in missing apiToken
			expect(savedData.services.pushover.apiToken).to.equal("");
		});
	});

	describe("validateConfig()", function() {
		it("should validate boolean fields", function() {
			const config = {
				enabled: "yes",
				services: {},
				filters: {
					onlyWhenAway: "true",
					highlights: 1
				}
			};

			const validated = configManager.validateConfig(config);

			expect(validated.enabled).to.equal(false);
			expect(validated.filters.onlyWhenAway).to.equal(true);
			expect(validated.filters.highlights).to.equal(true);
		});

		it("should validate array fields", function() {
			const config = {
				enabled: false,
				services: {},
				filters: {
					keywords: "not-an-array",
					channels: {
						whitelist: "also-not-array",
						blacklist: []
					}
				}
			};

			const validated = configManager.validateConfig(config);

			expect(validated.filters.keywords).to.be.an("array").that.is.empty;
			expect(validated.filters.channels.whitelist).to.be.an("array").that.is.empty;
		});

		it("should validate Pushover configuration", function() {
			const config = {
				enabled: true,
				services: {
					pushover: {
						userKey: "test-key",
						priority: "0"
						// missing apiToken and sound
					}
				},
				filters: {}
			};

			const validated = configManager.validateConfig(config);

			expect(validated.services.pushover.userKey).to.equal("test-key");
			expect(validated.services.pushover.apiToken).to.equal("");
			expect(validated.services.pushover.priority).to.equal(0);
			expect(validated.services.pushover.sound).to.equal("pushover");
		});
	});

	describe("isValid()", function() {
		it("should return false for empty services", function() {
			const result = configManager.isValid();
			expect(result).to.equal(false);
		});

		it("should return false for incomplete Pushover config", function() {
			const config = {
				enabled: true,
				services: {
					pushover: {
						userKey: "test-key"
						// missing apiToken
					}
				},
				filters: {}
			};

			configManager.save(config);

			const result = configManager.isValid();
			expect(result).to.equal(false);
		});

		it("should return true for complete Pushover config", function() {
			const config = {
				enabled: true,
				services: {
					pushover: {
						userKey: "test-user-key",
						apiToken: "test-api-token",
						priority: 0,
						sound: "pushover"
					}
				},
				filters: {}
			};

			configManager.save(config);

			const result = configManager.isValid();
			expect(result).to.equal(true);
		});
	});

	describe("getConfigPath()", function() {
		it("should return correct config file path", function() {
			const configPath = configManager.getConfigPath();

			expect(configPath).to.equal(
				path.join(tempDir, "testuser-config.json")
			);
		});
	});

	describe("getDefaultConfig()", function() {
		it("should return valid default configuration", function() {
			const config = configManager.getDefaultConfig();

			expect(config).to.be.an("object");
			expect(config.enabled).to.equal(false);
			expect(config.services).to.be.an("object").that.is.empty;
			expect(config.filters).to.be.an("object");
			expect(config.filters.onlyWhenAway).to.equal(true);
			expect(config.filters.highlights).to.equal(true);
			expect(config.filters.keywords).to.be.an("array").that.is.empty;
			expect(config.filters.channels).to.be.an("object");
			expect(config.filters.channels.whitelist).to.be.an("array").that.is.empty;
			expect(config.filters.channels.blacklist).to.be.an("array").that.is.empty;
		});
	});
});
