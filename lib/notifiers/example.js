"use strict";

const BaseNotifier = require("./base");
const { C, F } = require("../format");

/**
 * Example Notifier - Template for creating new notification services
 *
 * HOW TO CREATE A NEW NOTIFIER:
 * =============================
 *
 * 1. COPY THIS FILE
 *    - Copy this file to lib/notifiers/yourservice.js
 *    - The filename determines the service name (e.g., "discord.js" → "discord")
 *
 * 2. SET UP CONSTRUCTOR
 *    - Call super(config, logger) first
 *    - Set this.name, this.url, this.registerUrl
 *    - Define this.registerVariables with your service's configuration schema
 *    - Initialize your API client if validation passes (this.validate())
 *    - Set this._isSetup = true after successful initialization
 *
 * 3. IMPLEMENT REQUIRED METHOD
 *    - async send(notification) - Send a notification to your service
 *
 * 4. OPTIONALLY OVERRIDE AUTO-GENERATED PROPERTIES
 *    - setupInstructions (getter) - Base class generates a default, you can override
 *    - quickStart (getter) - Auto-generated from registerVariables, rarely needs override
 *    - configExamples (getter) - Auto-generated from registerVariables, rarely needs override
 *    - handleConfig() - Inherited from base class, handles all config via registerVariables
 *
 * 5. THAT'S IT!
 *    The plugin will automatically:
 *    - Discover your notifier by scanning lib/notifiers/
 *    - Generate quickStart, configExamples, and handleConfig from registerVariables
 *    - Show it in /notify setup, /notify config, and /notify help
 *    - Initialize it in NotificationManager when configured
 *
 * REGISTER VARIABLES:
 * ==================
 * Define your service's configuration schema using registerVariables:
 *
 * this.registerVariables = {
 *   settingName: {
 *     default: "",              // Default value (optional, inferred from example if not set)
 *     example: "EXAMPLE_VALUE", // Example value shown in help/config
 *     description: "...",       // Human-readable description
 *     required: true/false,     // Whether this setting is required
 *     validationError: "...",   // Custom error message for validation failures
 *     validate: (value) => {}   // Custom validation function
 *   }
 * }
 *
 * METADATA MODE:
 * =============
 * Notifiers can be instantiated in two modes:
 * 1. Metadata mode (_isSetup = false): For accessing help/setup/config info
 *    - Created with empty config: new YourNotifier()
 *    - Can access: name, setupInstructions, quickStart, configExamples, handleConfig
 *    - Cannot send notifications (send() will throw error)
 * 2. Ready mode (_isSetup = true): Fully configured and ready to send
 *    - Created with real config: new YourNotifier(config, logger)
 *    - Can send notifications via send()
 *
 * INTEGRATION FLOW:
 * =================
 * 1. User runs: /notify help
 *    → Creates: new YourNotifier() (metadata mode)
 *    → Accesses: notifier.quickStart (auto-generated from registerVariables)
 *
 * 2. User runs: /notify setup yourservice
 *    → Creates: new YourNotifier() (metadata mode)
 *    → Accesses: notifier.setupInstructions
 *
 * 3. User runs: /notify config yourservice apiKey abc123
 *    → Creates: new YourNotifier() (metadata mode)
 *    → Calls: notifier.handleConfig(config, "apikey", "abc123")
 *    → Saves: config.services.yourservice.apiKey = "abc123"
 *
 * 4. User runs: /notify enable
 *    → NotificationManager creates: new YourNotifier(config.services.yourservice, logger)
 *    → Constructor validates config and sets _isSetup = true
 *    → Notifier ready to send notifications
 *
 * 5. IRC message matches filters
 *    → Calls: notifier.send(notification)
 *
 * 6. User runs: /notify test yourservice
 *    → Calls: notifier.test() (inherited from BaseNotifier)
 *    → Which calls: notifier.send({ title, message, timestamp })
 */
class ExampleNotifier extends BaseNotifier {
	/**
	 * Constructor - Initialize your notification service
	 *
	 * @param {Object} config - Service-specific configuration from config.services.example
	 * @param {Object} logger - TheLounge logger instance (has .info, .error, .debug, .warn)
	 *
	 * NOTE: Constructor is called in two modes:
	 * - Metadata mode: new ExampleNotifier() - for accessing help/setup/config info
	 * - Ready mode: new ExampleNotifier(config, logger) - for sending notifications
	 */
	constructor(config, logger) {
		super(config, logger);

		// Set service metadata
		this.name = "Example";
		this.url = "https://api.example.com";
		this.registerUrl = "https://example.com/account/keys";

		// Define configuration schema
		// The base class will auto-generate quickStart, configExamples, and handleConfig from this
		this.registerVariables = {
			apiKey: {
				default: "",
				example: "YOUR_API_KEY",
				description: "Your Example API key (get from account settings)",
				required: true,
				validationError: "API key must be at least 10 characters",
				validate: (value) => typeof value === 'string' && value.length >= 10
			},
			apiToken: {
				default: "",
				example: "YOUR_API_TOKEN",
				description: "Your Example API token",
				required: true,
				validationError: "API token must be at least 20 characters",
				validate: (value) => typeof value === 'string' && value.length >= 20
			},
			endpoint: {
				default: "https://api.example.com",
				example: "https://api.example.com",
				description: "API endpoint URL (optional, uses default if not set)",
				required: false,
				validationError: "Endpoint must be a valid URL",
				validate: (value) => {
					try {
						new URL(value);
						return true;
					} catch {
						return false;
					}
				}
			},
			username: {
				default: "TheLounge",
				example: "MyUsername",
				description: "Display name for notifications",
				required: false,
				validationError: "Username must be a non-empty string",
				validate: (value) => typeof value === 'string' && value.length > 0
			}
		};

		// Only initialize if we have valid configuration (not metadata mode)
		if (this.validate()) {
			// Initialize your notification service client here
			// Example:
			// this.client = new YourServiceClient({
			//     apiKey: this.config.apiKey,
			//     apiToken: this.config.apiToken,
			//     endpoint: this.config.endpoint
			// });

			// Mark as ready to send notifications
			this._isSetup = true;
		}
		// If validation fails, _isSetup remains false (metadata mode)
		// This allows commands.js to access metadata without valid config
	}

	/**
	 * Send a notification
	 *
	 * @param {Object} notification - Notification data
	 * @param {string} notification.title - Title (e.g., "Highlight in #channel")
	 * @param {string} notification.message - Message body (e.g., "username: your message")
	 * @param {Date} notification.timestamp - When the message was sent
	 * @returns {Promise<void>}
	 *
	 * REQUIRED: Implement your notification sending logic
	 * NOTE: Base class checks _isSetup before calling this, so you can assume it's ready
	 */
	async send(notification) {
		// Example implementation:
		try {
			// Format your API request
			const payload = {
				title: notification.title,
				body: notification.message,
				timestamp: notification.timestamp.toISOString(),
				from: this.config.username
			};

			// Send to your service
			// const response = await this.client.send(payload);
			// this.logger.debug(`${this.name} notification sent: ${response.id}`);

			this.logger.debug(`${this.name} notification would be sent: ${notification.title}`);

			// Simulate async operation
			return Promise.resolve();
		} catch (err) {
			this.logger.error(`${this.name} error: ${err.message}`);
			return Promise.reject(err);
		}
	}

	/**
	 * Get setup instructions for this service
	 *
	 * @returns {string[]} - Array of formatted instruction lines
	 *
	 * OPTIONAL: Override this to provide detailed setup instructions
	 * NOTE: If not overridden, base class provides a basic default
	 *
	 * Users see this when they run: /notify setup example
	 */
	get setupInstructions() {
		return [
			F.HEADER(`${this.name} Setup Instructions`),
			F.BREAK,
			F.LI(1, `Visit ${C.CYAN}${this.registerUrl}${C.RESET}`),
			F.LI(2, `Generate an ${C.BOLD}API Key${C.RESET} and ${C.BOLD}API Token${C.RESET}`),
			F.LI(3, `Configure the plugin:`),
			F.INDENT(2) + F.CMD(`config ${this.name.toLowerCase()} apiKey YOUR_API_KEY`),
			F.INDENT(2) + F.CMD(`config ${this.name.toLowerCase()} apiToken YOUR_API_TOKEN`),
			F.LI(4, `Enable notifications: ${F.CMD('enable')}`),
			F.LI(5, `Test it: ${F.CMD(`test ${this.name.toLowerCase()}`)}`),
			F.BREAK,
			F.INFO(`Configure highlight words in ${C.BOLD}TheLounge Settings > Highlights${C.RESET}`)
		];
	}

	// OPTIONAL: Override quickStart if auto-generation from registerVariables isn't sufficient
	// get quickStart() { return [F.LI(1, ...)]; }

	// OPTIONAL: Override configExamples if auto-generation from registerVariables isn't sufficient
	// get configExamples() { return [F.CMD(...)]; }

	// NOTE: handleConfig is inherited from base class and auto-handles all registerVariables
	// You rarely need to override it. The base implementation:
	// - Parses values based on type (number, boolean, string)
	// - Validates using the validate() function
	// - Saves to config.services[serviceName][settingName]
	// - Returns { success: boolean, messages: string[] }
}

module.exports = ExampleNotifier;
