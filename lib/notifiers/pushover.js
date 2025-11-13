"use strict";

const BaseNotifier = require("./base");
const Push = require("pushover-notifications");
const { C, F } = require("../format");

/**
 * Pushover Notifier
 * Sends notifications via Pushover API
 */
class PushoverNotifier extends BaseNotifier {
	constructor(config, logger) {
		super(config, logger);

		this.name = "Pushover";
		this.url = "https://pushover.net/";
		this.registerUrl = "https://pushover.net/apps/build";
		this.color = `\x0371`; // light blue
		this.registerVariables = {
			userKey: {
				default: "",
				example: "YOUR_USER_KEY",
				description: "Your Pushover user key (30 characters)",
				required: true,
				validationError: "User key must be 30 characters",
				validate: (value) => typeof value === 'string' && value.length === 30
			},
			apiToken: {
				default: "",
				example: "YOUR_API_TOKEN",
				description: "Your Pushover API token (30 characters)",
				required: true,
				validationError: "API token must be 30 characters",
				validate: (value) => typeof value === 'string' && value.length === 30
			},
			priority: {
				default: 0,
				example: 0,
				description: "Notification priority (-2 to 2)",
				required: false,
				validationError: "Priority must be an integer between -2 and 2",
				validate: (value) => Number.isInteger(value) && value >= -2 && value <= 2
			},
			sound: {
				default: "pushover",
				example: "cosmic",
				description: "Notification sound",
				required: false,
				validationError: "Sound must be a non-empty string",
				validate: (value) => typeof value === 'string' && value.length > 0
			}
		};

		// Apply defaults for optional fields that are not set
		for (const [key, variable] of Object.entries(this.registerVariables)) {
			if (!variable.required && this.config[key] === undefined) {
				this.config[key] = variable.default;
			}
		}

		// Only validate and initialize if we have real config and service is enabled
		if (this.config.enabled && this.validateWithLogging()) {
			// Initialize Pushover client
			this.client = new Push({
				user: this.config.userKey,
				token: this.config.apiToken
			});

			this._isSetup = true;
		}
		// If validation fails or disabled, _isSetup remains false (metadata mode)
	}

	/**
	 * Send notification via Pushover
	 */
	async send(notification) {
		return new Promise((resolve, reject) => {
			const msg = {
				message: notification.message,
				title: notification.title,
				priority: this.config.priority,
				sound: this.config.sound,
				timestamp: Math.floor(notification.timestamp.getTime() / 1000)
			};

			this.client.send(msg, (err, result) => {
				if (err) {
					this.logger.error(`${this.name} error: ${err.message}`);
					return reject(err);
				}

				this.logger.debug(`${this.name} notification sent: ${result}`);
				resolve(result);
			});
		});
	}

	/**
	 * Get setup instructions for Pushover
	 * @returns {string[]} Array of setup instruction messages
	 */
	get setupInstructions() {
		return [
			F.HEADER(`${this.name} Setup Instructions`),
			F.LI(1, `Register at ${C.CYAN}https://pushover.net/${C.RESET}`),
			F.LI(2, `Get your ${C.BOLD}User Key${C.RESET} from the dashboard`),
			F.LI(3, `Create an application at ${C.CYAN}https://pushover.net/apps/build${C.RESET}`),
			F.LI(4, `Get your ${C.BOLD}API Token${C.RESET}`),
			F.LI(5, `Configure using commands:`),
			F.INDENT(3) + F.CMD('config pushover userKey YOUR_USER_KEY'),
			F.INDENT(3) + F.CMD('config pushover apiToken YOUR_API_TOKEN'),
			F.LI(6, `Enable notifications: ${F.CMD('enable')}`),
			F.LI(7, `Test it: ${F.CMD('test')}`),
			F.BREAK,
			F.INFO(`Configure highlight words in ${C.BOLD}TheLounge Settings > Highlights${C.RESET}`)
		];
	}
}

module.exports = PushoverNotifier;
