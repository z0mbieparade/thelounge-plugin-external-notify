"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Configuration Manager
 * Handles loading and saving user notification configurations
 */
class ConfigManager {
	constructor(storageDir, clientName) {
		this.storageDir = storageDir;
		this.clientName = clientName;
		this.configPath = path.join(storageDir, `${clientName}-config.json`);
	}

	/**
	 * Load configuration from disk
	 * Returns default config if file doesn't exist
	 */
	load() {
		try {
			if (fs.existsSync(this.configPath)) {
				const data = fs.readFileSync(this.configPath, "utf8");
				const config = JSON.parse(data);

				// Validate and merge with defaults
				return this.validateConfig(config);
			}
		} catch (err) {
			console.error(`Failed to load config from ${this.configPath}:`, err);
		}

		// Return default configuration
		return this.getDefaultConfig();
	}

	/**
	 * Save configuration to disk
	 */
	save(config) {
		try {
			const validated = this.validateConfig(config);
			const data = JSON.stringify(validated, null, 2);
			fs.writeFileSync(this.configPath, data, "utf8");
			return true;
		} catch (err) {
			console.error(`Failed to save config to ${this.configPath}:`, err);
			return false;
		}
	}

	/**
	 * Get default configuration
	 */
	getDefaultConfig() {
		return {
			enabled: false,
			services: {},
			filters: {
				onlyWhenAway: true,
				highlights: true,
				keywords: [],
				channels: {
					whitelist: [],
					blacklist: []
				}
			}
		};
	}

	/**
	 * Validate configuration and merge with defaults
	 */
	validateConfig(config) {
		const defaults = this.getDefaultConfig();

		// Ensure all required top-level keys exist
		const validated = {
			enabled: typeof config.enabled === "boolean" ? config.enabled : defaults.enabled,
			services: config.services || defaults.services,
			filters: config.filters || defaults.filters
		};

		// Validate filters object
		if (validated.filters) {
			const filters = config.filters || {};
			const channels = filters.channels || {};

			validated.filters = {
				onlyWhenAway: typeof filters.onlyWhenAway === "boolean"
					? filters.onlyWhenAway
					: defaults.filters.onlyWhenAway,
				highlights: typeof filters.highlights === "boolean"
					? filters.highlights
					: defaults.filters.highlights,
				keywords: Array.isArray(filters.keywords)
					? filters.keywords
					: defaults.filters.keywords,
				channels: {
					whitelist: Array.isArray(channels.whitelist)
						? channels.whitelist
						: defaults.filters.channels.whitelist,
					blacklist: Array.isArray(channels.blacklist)
						? channels.blacklist
						: defaults.filters.channels.blacklist
				}
			};
		}

		// Validate services
		if (validated.services) {
			// Validate Pushover configuration if present
			if (validated.services.pushover) {
				const pushover = validated.services.pushover;
				validated.services.pushover = {
					userKey: pushover.userKey || "",
					apiToken: pushover.apiToken || "",
					priority: typeof pushover.priority === "number" ? pushover.priority : 0,
					sound: pushover.sound || "pushover"
				};
			}
		}

		return validated;
	}

	/**
	 * Check if configuration is valid and complete
	 */
	isValid() {
		const config = this.load();

		// Must have at least one service configured
		if (!config.services || Object.keys(config.services).length === 0) {
			return false;
		}

		// Check if any service has required credentials
		if (config.services.pushover) {
			const pushover = config.services.pushover;
			if (!pushover.userKey || !pushover.apiToken) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get configuration file path
	 */
	getConfigPath() {
		return this.configPath;
	}
}

module.exports = ConfigManager;
