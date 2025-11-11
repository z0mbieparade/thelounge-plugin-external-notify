"use strict";

/**
 * Base Notifier Class
 * Abstract interface for notification services
 */
class BaseNotifier {
	constructor(config, logger) {
		this.config = config;
		this.logger = logger;
	}

	/**
	 * Send a notification
	 * @param {Object} notification - Notification data
	 * @param {string} notification.title - Notification title
	 * @param {string} notification.message - Notification message body
	 * @param {Date} notification.timestamp - Message timestamp
	 * @returns {Promise<void>}
	 */
	async send(notification) {
		throw new Error("send() must be implemented by subclass");
	}

	/**
	 * Send a test notification
	 * @returns {Promise<void>}
	 */
	async test() {
		return this.send({
			title: "Test Notification",
			message: "This is a test notification from TheLounge External Notify",
			timestamp: new Date()
		});
	}

	/**
	 * Validate configuration
	 * @returns {boolean}
	 */
	validate() {
		throw new Error("validate() must be implemented by subclass");
	}

	/**
	 * Get service name
	 * @returns {string}
	 */
	getName() {
		throw new Error("getName() must be implemented by subclass");
	}
}

module.exports = BaseNotifier;
