"use strict";

const BaseNotifier = require("./base");
const Push = require("pushover-notifications");

/**
 * Pushover Notifier
 * Sends notifications via Pushover API
 */
class PushoverNotifier extends BaseNotifier {
	constructor(config, logger) {
		super(config, logger);

		// Validate configuration
		if (!this.validate()) {
			throw new Error("Invalid Pushover configuration");
		}

		// Initialize Pushover client
		this.client = new Push({
			user: config.userKey,
			token: config.apiToken
		});

		this.priority = config.priority || 0;
		this.sound = config.sound || "pushover";
	}

	/**
	 * Send notification via Pushover
	 */
	async send(notification) {
		return new Promise((resolve, reject) => {
			const msg = {
				message: notification.message,
				title: notification.title,
				priority: this.priority,
				sound: this.sound,
				timestamp: Math.floor(notification.timestamp.getTime() / 1000)
			};

			this.client.send(msg, (err, result) => {
				if (err) {
					this.logger.error(`Pushover error: ${err.message}`);
					return reject(err);
				}

				this.logger.debug(`Pushover notification sent: ${result}`);
				resolve(result);
			});
		});
	}

	/**
	 * Validate Pushover configuration
	 */
	validate() {
		if (!this.config.userKey || !this.config.apiToken) {
			this.logger.error("Pushover configuration missing userKey or apiToken");
			return false;
		}

		if (this.config.userKey.length !== 30) {
			this.logger.warn("Pushover userKey should be 30 characters");
		}

		if (this.config.apiToken.length !== 30) {
			this.logger.warn("Pushover apiToken should be 30 characters");
		}

		return true;
	}

	/**
	 * Get service name
	 */
	getName() {
		return "pushover";
	}
}

module.exports = PushoverNotifier;
