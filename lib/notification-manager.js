"use strict";

const PushoverNotifier = require("./notifiers/pushover");

/**
 * Notification Manager
 * Central routing and filtering logic for notifications
 */
class NotificationManager {
	constructor(config, logger) {
		this.config = config;
		this.logger = logger;
		this.notifiers = {};
		this.recentNotifications = new Set();

		// Initialize configured notifiers
		this.initializeNotifiers();

		// Cleanup recent notifications every minute
		setInterval(() => this.cleanupRecentNotifications(), 60000);
	}

	/**
	 * Initialize notification service clients
	 */
	initializeNotifiers() {
		if (this.config.services.pushover) {
			try {
				this.notifiers.pushover = new PushoverNotifier(
					this.config.services.pushover,
					this.logger
				);
				this.logger.info("Pushover notifier initialized");
			} catch (err) {
				this.logger.error(`Failed to initialize Pushover: ${err.message}`);
			}
		}
	}

	/**
	 * Process an IRC message and determine if notification should be sent
	 */
	async processMessage(messageData, client) {
		// Check filters
		if (!this.shouldNotify(messageData, client)) {
			return;
		}

		// Check deduplication
		const dedupKey = this.getDeduplicationKey(messageData);
		if (this.recentNotifications.has(dedupKey)) {
			this.logger.debug(`Skipping duplicate notification: ${dedupKey}`);
			return;
		}

		// Add to recent notifications
		this.recentNotifications.add(dedupKey);

		// Format notification
		const notification = this.formatNotification(messageData);

		// Send to all configured notifiers
		const promises = [];
		for (const [name, notifier] of Object.entries(this.notifiers)) {
			this.logger.debug(`Sending notification via ${name}`);
			promises.push(
				notifier.send(notification).catch(err => {
					this.logger.error(`Failed to send via ${name}: ${err.message}`);
				})
			);
		}

		await Promise.all(promises);
	}

	/**
	 * Determine if a message should trigger a notification
	 */
	shouldNotify(messageData, client) {
		const filters = this.config.filters;

		// Check if user is away (if onlyWhenAway is enabled)
		if (filters.onlyWhenAway) {
			// TODO: Check if client is marked as away
			// For now, we'll assume they're away if they have no active connections
			// This is a simplified check - TheLounge tracks this better internally
		}

		// Check channel filters
		if (filters.channels) {
			// Whitelist - if specified, only notify for these channels
			if (filters.channels.whitelist && filters.channels.whitelist.length > 0) {
				if (!filters.channels.whitelist.includes(messageData.channel)) {
					return false;
				}
			}

			// Blacklist - never notify for these channels
			if (filters.channels.blacklist && filters.channels.blacklist.length > 0) {
				if (filters.channels.blacklist.includes(messageData.channel)) {
					return false;
				}
			}
		}

		// Check if message contains a keyword
		let matchedKeyword = false;
		if (filters.keywords && filters.keywords.length > 0) {
			const lowerMessage = messageData.message.toLowerCase();
			for (const keyword of filters.keywords) {
				if (lowerMessage.includes(keyword.toLowerCase())) {
					matchedKeyword = true;
					break;
				}
			}
		}

		// Check if message is a highlight
		// Note: TheLounge sets msg.highlight when the user is mentioned
		// For now, we'll do a simple check if the message contains the client name
		let isHighlight = false;
		if (filters.highlights && client.name) {
			const lowerMessage = messageData.message.toLowerCase();
			const lowerClientName = client.name.toLowerCase();
			isHighlight = lowerMessage.includes(lowerClientName);
		}

		// Notify if either:
		// - Message contains a keyword, OR
		// - Message is a highlight (if highlights are enabled)
		// - If no keywords configured and highlights disabled, notify all messages
		const hasKeywords = filters.keywords && filters.keywords.length > 0;
		const hasHighlights = filters.highlights;

		if (!hasKeywords && !hasHighlights) {
			// No filters configured, notify everything (probably not desired)
			return true;
		}

		return matchedKeyword || (hasHighlights && isHighlight);
	}

	/**
	 * Format notification message
	 */
	formatNotification(messageData) {
		let title = `${messageData.network}`;
		let message = "";

		if (messageData.type === "action") {
			message = `* ${messageData.nick} ${messageData.message}`;
		} else {
			message = `<${messageData.nick}> ${messageData.message}`;
		}

		// Add channel to title if it's a channel message
		if (messageData.channel && messageData.channel.startsWith("#")) {
			title += ` - ${messageData.channel}`;
		}

		return {
			title: title,
			message: message,
			timestamp: messageData.timestamp
		};
	}

	/**
	 * Get deduplication key for a message
	 */
	getDeduplicationKey(messageData) {
		// Create a unique key based on network, channel, nick, and message
		// Hash the message to keep key size reasonable
		const msgHash = messageData.message.substring(0, 50);
		return `${messageData.network}-${messageData.channel}-${messageData.nick}-${msgHash}`;
	}

	/**
	 * Clean up old entries from recent notifications
	 * Keep entries for 60 seconds to prevent duplicates
	 */
	cleanupRecentNotifications() {
		// Simple approach: clear the entire set every minute
		// This means duplicates are blocked for up to 60 seconds
		this.recentNotifications.clear();
		this.logger.debug("Cleared recent notifications cache");
	}

	/**
	 * Send a test notification
	 */
	async sendTestNotification() {
		const notification = {
			title: "TheLounge External Notify",
			message: "Test notification - your notifications are working!",
			timestamp: new Date()
		};

		const promises = [];
		for (const [name, notifier] of Object.entries(this.notifiers)) {
			this.logger.info(`Sending test notification via ${name}`);
			promises.push(notifier.send(notification));
		}

		await Promise.all(promises);
	}
}

module.exports = NotificationManager;
