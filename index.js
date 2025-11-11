"use strict";

const fs = require("fs");
const ConfigManager = require("./lib/config-manager");
const NotificationManager = require("./lib/notification-manager");
const commands = require("./lib/commands");

// Plugin state management - tracks active notification sessions
// Key: `${clientId}-${networkId}`
const pluginState = new Map();

let apiInstance = null;
let storageDir = null;

/**
 * Main plugin entry point
 * Called when TheLounge server starts
 */
module.exports = {
	onServerStart(api) {
		apiInstance = api;

		// Get persistent storage directory for plugin configuration
		storageDir = api.Config.getPersistentStorageDir("thelounge-plugin-external-notify");

		// Ensure storage directory exists
		if (!fs.existsSync(storageDir)) {
			fs.mkdirSync(storageDir, { recursive: true });
		}

		api.Logger.info("External Notify plugin loaded");
		api.Logger.info(`Configuration directory: ${storageDir}`);

		// Register the /notify command
		api.Commands.add("notify", commands.notifyCommand);

		api.Logger.info("Use /notify to configure external notifications");
	}
};

/**
 * Get or create plugin state for a client-network pair
 */
function getPluginState(client, network) {
	const key = `${client.id}-${network.uuid}`;

	if (!pluginState.has(key)) {
		pluginState.set(key, {
			enabled: false,
			client: client,
			network: network,
			configManager: new ConfigManager(storageDir, client.name),
			notificationManager: null, // Created when enabled
			listenersSetup: false
		});
	}

	return pluginState.get(key);
}

/**
 * Setup IRC event listeners for monitoring messages
 */
function setupMessageMonitoring(state) {
	if (state.listenersSetup) {
		return;
	}

	const { network, client, notificationManager } = state;

	// Hook into IRC message events
	network.irc.on("privmsg", function(event) {
		handleIrcMessage(state, "privmsg", event);
	});

	network.irc.on("action", function(event) {
		handleIrcMessage(state, "action", event);
	});

	network.irc.on("notice", function(event) {
		handleIrcMessage(state, "notice", event);
	});

	state.listenersSetup = true;

	if (apiInstance) {
		apiInstance.Logger.debug(`Message monitoring setup for ${client.name} on ${network.name}`);
	}
}

/**
 * Handle incoming IRC messages and determine if notification should be sent
 */
function handleIrcMessage(state, type, event) {
	if (!state.enabled || !state.notificationManager) {
		return;
	}

	const { client, network } = state;

	// Build message data
	const messageData = {
		type: type,
		network: network.name,
		channel: event.target,
		nick: event.nick,
		message: event.message,
		timestamp: new Date()
	};

	// Let notification manager decide if this should trigger a notification
	state.notificationManager.processMessage(messageData, client)
		.catch(err => {
			if (apiInstance) {
				apiInstance.Logger.error(`Error processing notification: ${err.message}`);
			}
		});
}

/**
 * Enable notifications for a client-network pair
 */
function enableNotifications(client, network) {
	const state = getPluginState(client, network);

	// Load configuration
	const config = state.configManager.load();

	if (!config || !config.services || Object.keys(config.services).length === 0) {
		return {
			success: false,
			message: "No notification services configured. Use /notify setup <service> first."
		};
	}

	// Create notification manager
	state.notificationManager = new NotificationManager(
		config,
		apiInstance ? apiInstance.Logger : console
	);

	// Setup message monitoring
	setupMessageMonitoring(state);

	state.enabled = true;

	return {
		success: true,
		message: "External notifications enabled"
	};
}

/**
 * Disable notifications for a client-network pair
 */
function disableNotifications(client, network) {
	const state = getPluginState(client, network);
	state.enabled = false;

	return {
		success: true,
		message: "External notifications disabled"
	};
}

/**
 * Get notification status for a client-network pair
 */
function getStatus(client, network) {
	const state = getPluginState(client, network);
	const config = state.configManager.load();

	return {
		enabled: state.enabled,
		config: config
	};
}

// Export utility functions for use by commands module
module.exports.getPluginState = getPluginState;
module.exports.enableNotifications = enableNotifications;
module.exports.disableNotifications = disableNotifications;
module.exports.getStatus = getStatus;
module.exports.getStorageDir = () => storageDir;
module.exports.getApi = () => apiInstance;
