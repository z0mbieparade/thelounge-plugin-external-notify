"use strict";

// Lazy load plugin to avoid circular dependency
let plugin = null;
function getPlugin() {
	if (!plugin) {
		plugin = require("../index");
	}
	return plugin;
}

/**
 * Helper function to send a message to the virtual channel
 * @param {Object} client - The client object
 * @param {Object} network - The network object
 * @param {string|string[]} text - The message text to send (or array of messages)
 */
function sendMessage(client, network, text) {
	// Handle arrays of messages
	if (Array.isArray(text)) {
		for (const message of text) {
			sendMessage(client, network, message);
		}
		return;
	}

	// Get or create the virtual channel for plugin output
	const virtualChannel = getPlugin().getOrCreateVirtualChannel(client, network);

	const msg = {
		id: Math.random().toString(36).substring(2, 11),
		type: "message",
		text: text,
		from: { nick: "external-notify" },
		time: new Date(),
		self: false,
		isLoggable: function() { return true; }
	};

	virtualChannel.pushMessage(client, msg);
}

module.exports = sendMessage;
