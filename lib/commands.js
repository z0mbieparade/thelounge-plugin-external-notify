"use strict";

const plugin = require("../index");

/**
 * Main /notify command handler
 * Provides subcommands for configuration and management
 */
const notifyCommand = {
	input: function(client, target, command, args) {
		const network = target.network;

		if (!network) {
			return client.pushMessage(target, {
				type: "error",
				text: "This command can only be used in a network context"
			}, true);
		}

		const subcommand = args[0] ? args[0].toLowerCase() : "status";

		switch (subcommand) {
			case "enable":
				return handleEnable(client, target, network);

			case "disable":
				return handleDisable(client, target, network);

			case "status":
				return handleStatus(client, target, network);

			case "setup":
				return handleSetup(client, target, network, args.slice(1));

			case "test":
				return handleTest(client, target, network);

			case "add-keyword":
				return handleAddKeyword(client, target, network, args.slice(1));

			case "remove-keyword":
				return handleRemoveKeyword(client, target, network, args.slice(1));

			case "channel":
				return handleChannel(client, target, network, args.slice(1));

			case "help":
				return handleHelp(client, target);

			default:
				return client.pushMessage(target, {
					type: "error",
					text: `Unknown subcommand: ${subcommand}. Use /notify help for usage.`
				}, true);
		}
	},
	allowDisconnected: false
};

/**
 * Enable notifications
 */
function handleEnable(client, target, network) {
	const result = plugin.enableNotifications(client, network);

	client.pushMessage(target, {
		type: result.success ? "info" : "error",
		text: result.message
	}, true);
}

/**
 * Disable notifications
 */
function handleDisable(client, target, network) {
	const result = plugin.disableNotifications(client, network);

	client.pushMessage(target, {
		type: "info",
		text: result.message
	}, true);
}

/**
 * Show notification status and configuration
 */
function handleStatus(client, target, network) {
	const status = plugin.getStatus(client, network);

	let message = `External notifications: ${status.enabled ? "ENABLED" : "DISABLED"}\n`;

	if (status.config && status.config.services) {
		message += "\nConfigured services:\n";
		for (const [serviceName, serviceConfig] of Object.entries(status.config.services)) {
			message += `  - ${serviceName}: `;
			if (serviceName === "pushover") {
				message += serviceConfig.userKey ? "configured ✓" : "not configured";
			}
			message += "\n";
		}
	} else {
		message += "\nNo services configured. Use /notify setup <service> to get started.";
	}

	if (status.config && status.config.filters) {
		const filters = status.config.filters;
		message += "\nFilters:\n";
		message += `  - Only when away: ${filters.onlyWhenAway ? "yes" : "no"}\n`;
		message += `  - Highlights: ${filters.highlights ? "yes" : "no"}\n`;

		if (filters.keywords && filters.keywords.length > 0) {
			message += `  - Keywords: ${filters.keywords.join(", ")}\n`;
		}

		if (filters.channels) {
			if (filters.channels.whitelist && filters.channels.whitelist.length > 0) {
				message += `  - Whitelist: ${filters.channels.whitelist.join(", ")}\n`;
			}
			if (filters.channels.blacklist && filters.channels.blacklist.length > 0) {
				message += `  - Blacklist: ${filters.channels.blacklist.join(", ")}\n`;
			}
		}
	}

	client.pushMessage(target, {
		type: "info",
		text: message
	}, true);
}

/**
 * Setup a notification service
 */
function handleSetup(client, target, network, args) {
	const serviceName = args[0] ? args[0].toLowerCase() : null;

	if (!serviceName) {
		return client.pushMessage(target, {
			type: "error",
			text: "Usage: /notify setup <service>. Available services: pushover"
		}, true);
	}

	if (serviceName !== "pushover") {
		return client.pushMessage(target, {
			type: "error",
			text: `Unknown service: ${serviceName}. Available services: pushover`
		}, true);
	}

	// For now, just provide instructions
	const message = `
To setup Pushover notifications:

1. Register at https://pushover.net/
2. Get your User Key from the dashboard
3. Create an application at https://pushover.net/apps/build
4. Get your API Token

Then manually edit your config file at:
${plugin.getStorageDir()}/${client.name}-config.json

Example configuration:
{
  "enabled": true,
  "services": {
    "pushover": {
      "userKey": "your-user-key-here",
      "apiToken": "your-api-token-here",
      "priority": 0,
      "sound": "pushover"
    }
  },
  "filters": {
    "onlyWhenAway": true,
    "highlights": true,
    "keywords": [],
    "channels": {
      "whitelist": [],
      "blacklist": []
    }
  }
}

After editing, use /notify enable to activate notifications.
	`.trim();

	client.pushMessage(target, {
		type: "info",
		text: message
	}, true);
}

/**
 * Send a test notification
 */
function handleTest(client, target, network) {
	const state = plugin.getPluginState(client, network);

	if (!state.enabled) {
		return client.pushMessage(target, {
			type: "error",
			text: "Notifications are not enabled. Use /notify enable first."
		}, true);
	}

	if (!state.notificationManager) {
		return client.pushMessage(target, {
			type: "error",
			text: "Notification manager not initialized."
		}, true);
	}

	// Send test notification
	state.notificationManager.sendTestNotification()
		.then(() => {
			client.pushMessage(target, {
				type: "info",
				text: "Test notification sent!"
			}, true);
		})
		.catch(err => {
			client.pushMessage(target, {
				type: "error",
				text: `Failed to send test notification: ${err.message}`
			}, true);
		});
}

/**
 * Add a notification keyword
 */
function handleAddKeyword(client, target, network, args) {
	const keyword = args.join(" ");

	if (!keyword) {
		return client.pushMessage(target, {
			type: "error",
			text: "Usage: /notify add-keyword <word>"
		}, true);
	}

	const state = plugin.getPluginState(client, network);
	const config = state.configManager.load();

	if (!config.filters) {
		config.filters = { keywords: [] };
	}
	if (!config.filters.keywords) {
		config.filters.keywords = [];
	}

	if (config.filters.keywords.includes(keyword)) {
		return client.pushMessage(target, {
			type: "error",
			text: `Keyword "${keyword}" already exists`
		}, true);
	}

	config.filters.keywords.push(keyword);
	state.configManager.save(config);

	client.pushMessage(target, {
		type: "info",
		text: `Added keyword: ${keyword}`
	}, true);
}

/**
 * Remove a notification keyword
 */
function handleRemoveKeyword(client, target, network, args) {
	const keyword = args.join(" ");

	if (!keyword) {
		return client.pushMessage(target, {
			type: "error",
			text: "Usage: /notify remove-keyword <word>"
		}, true);
	}

	const state = plugin.getPluginState(client, network);
	const config = state.configManager.load();

	if (!config.filters || !config.filters.keywords) {
		return client.pushMessage(target, {
			type: "error",
			text: "No keywords configured"
		}, true);
	}

	const index = config.filters.keywords.indexOf(keyword);
	if (index === -1) {
		return client.pushMessage(target, {
			type: "error",
			text: `Keyword "${keyword}" not found`
		}, true);
	}

	config.filters.keywords.splice(index, 1);
	state.configManager.save(config);

	client.pushMessage(target, {
		type: "info",
		text: `Removed keyword: ${keyword}`
	}, true);
}

/**
 * Manage channel whitelist/blacklist
 */
function handleChannel(client, target, network, args) {
	const action = args[0] ? args[0].toLowerCase() : null;
	const channel = args[1];

	if (!action || !channel) {
		return client.pushMessage(target, {
			type: "error",
			text: "Usage: /notify channel <add|remove> <#channel>"
		}, true);
	}

	// TODO: Implement channel whitelist/blacklist management
	client.pushMessage(target, {
		type: "info",
		text: "Channel filtering not yet implemented"
	}, true);
}

/**
 * Show help message
 */
function handleHelp(client, target) {
	const helpMessage = `
External Notify Plugin Commands:

/notify status              - Show current configuration
/notify enable              - Enable notifications
/notify disable             - Disable notifications
/notify setup <service>     - Setup notification service (pushover)
/notify test                - Send test notification
/notify add-keyword <word>  - Add notification keyword
/notify remove-keyword <word> - Remove notification keyword
/notify channel add <#chan> - Add channel to whitelist
/notify channel remove <#chan> - Remove channel from whitelist
/notify help                - Show this help message
	`.trim();

	client.pushMessage(target, {
		type: "info",
		text: helpMessage
	}, true);
}

module.exports = {
	notifyCommand
};
