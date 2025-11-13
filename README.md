# TheLounge External Notify Plugin

Send IRC notifications to external services like Pushover when you're highlighted in IRC.

## Features

- Get notifications on your phone or other devices when highlighted/mentioned in IRC
- Currently supports Pushover (more services coming soon)
- Smart filtering to avoid notification spam
  - Only notify when away (optional)
  - Deduplication to prevent spam
- Easy command-based configuration
- Service-agnostic architecture for easy expansion

## Installation

### Prerequisites

- TheLounge 4.0.0 or higher
- Node.js 14.0.0 or higher
- A Pushover account (free tier works great)

### Install the Plugin

1. Navigate to your TheLounge home directory:
   ```bash
   cd ~/.thelounge
   ```

2. Install the plugin:
   ```bash
   npm install thelounge-plugin-external-notify
   ```

3. Restart TheLounge:
   ```bash
   thelounge restart
   ```

### Pushover Setup

1. Sign up for a free account at [pushover.net](https://pushover.net/)
2. Note your **User Key** from the dashboard
3. Create an application at [pushover.net/apps/build](https://pushover.net/apps/build)
4. Note your **API Token** for the application

## Configuration

### Quick Start (Interactive Setup)

The easiest way to configure the plugin is directly from IRC:

1. In any TheLounge channel, configure your Pushover credentials:
   ```
   /notify config pushover userKey YOUR_30_CHARACTER_USER_KEY
   /notify config pushover apiToken YOUR_30_CHARACTER_API_TOKEN
   ```

2. Enable notifications:
   ```
   /notify enable
   ```

3. Test it:
   ```
   /notify test
   ```

That's it! The configuration is automatically saved to your user config file.

### Alternative: Manual Configuration

If you prefer to edit the config file directly, you can also manually add the configuration to your network object in `~/.thelounge/users/<username>/<network>.json`:

```json
{
  "externalNotify": {
    "enabled": true,
    "services": {
      "pushover": {
        "enabled": true,
        "userKey": "your-30-character-user-key-here",
        "apiToken": "your-30-character-api-token-here",
        "priority": 0,
        "sound": "pushover"
      }
    },
    "filters": {
      "onlyWhenAway": true,
      "highlights": true
    }
  }
}
```

### Interactive Configuration Commands

You can configure all settings from within IRC using the `/notify config` command:

#### Pushover Settings
```
/notify config pushover userKey YOUR_USER_KEY
/notify config pushover apiToken YOUR_API_TOKEN
/notify config pushover priority 0           # -2 to 2
/notify config pushover sound cosmic         # Any Pushover sound
```

#### Filter Settings
```
/notify config filter onlyWhenAway true      # true or false
/notify config filter highlights true        # true or false
```

All changes are automatically saved to your user configuration file.

### Configuration Options

#### Pushover Settings

- **userKey**: Your 30-character Pushover user key (required)
- **apiToken**: Your 30-character Pushover API token (required)
- **priority**: Notification priority (-2 to 2, default: 0)
  - `-2`: No notification, just badge update
  - `-1`: Quiet notification
  - `0`: Normal priority (default)
  - `1`: High priority, bypasses quiet hours
  - `2`: Emergency priority, requires acknowledgment
- **sound**: Notification sound (default: "pushover", see [Pushover sounds](https://pushover.net/api#sounds))

#### Filter Settings

- **onlyWhenAway**: Only send notifications when marked as away (default: `true`)
- **highlights**: Notify when your nickname is mentioned (default: `true`)

**Note**: TheLounge has built-in highlight configuration in Settings > Highlights. This plugin respects those settings when determining what triggers a notification.

## Usage

All commands are used with `/notify` in any channel or private message.

### Basic Commands

```
/notify status              Show current configuration and status
/notify enable              Enable notifications
/notify disable             Disable notifications
/notify config              Configure settings interactively
/notify test                Send a test notification
/notify help                Show help message
```

### Setup Commands

```
/notify setup pushover      Show Pushover setup instructions
```

## Example Configurations

### Minimal - Only Highlights When Away

```json
{
  "enabled": true,
  "services": {
    "pushover": {
      "enabled": true,
      "userKey": "your-user-key",
      "apiToken": "your-api-token",
      "priority": 0,
      "sound": "pushover"
    }
  },
  "filters": {
    "onlyWhenAway": true,
    "highlights": true
  }
}
```

### Always Notify on Highlights

```json
{
  "enabled": true,
  "services": {
    "pushover": {
      "enabled": true,
      "userKey": "your-user-key",
      "apiToken": "your-api-token",
      "priority": 1,
      "sound": "cosmic"
    }
  },
  "filters": {
    "onlyWhenAway": false,
    "highlights": true
  }
}
```

### Quiet Notifications

```json
{
  "enabled": true,
  "services": {
    "pushover": {
      "enabled": true,
      "userKey": "your-user-key",
      "apiToken": "your-api-token",
      "priority": -1,
      "sound": "none"
    }
  },
  "filters": {
    "onlyWhenAway": true,
    "highlights": true
  }
}
```

## Troubleshooting

### Notifications not working

1. Check plugin is loaded:
   ```
   /notify status
   ```

2. Verify configuration file exists and has valid JSON

3. Check TheLounge logs for errors:
   ```bash
   thelounge logs
   ```

4. Send a test notification:
   ```
   /notify test
   ```

### Configuration location

The configuration is stored in your TheLounge user config file:
```
~/.thelounge/users/<username>/<network>.json
```

Look for the `externalNotify` property. Replace `<username>` and `<network>` with your TheLounge username and network name.

### Invalid Pushover credentials

- Verify your User Key is exactly 30 characters
- Verify your API Token is exactly 30 characters
- Make sure there are no extra spaces or quotes
- Test your credentials at [pushover.net](https://pushover.net/)

### Notifications too frequent

Adjust your filters:
- Set `onlyWhenAway: true` to only notify when away
- Disable notifications when you're actively using IRC

### Highlight Detection

This plugin uses TheLounge's built-in highlight detection. To customize what triggers highlights:

1. Go to Settings (gear icon in TheLounge)
2. Navigate to "Highlights"
3. Add custom highlight words/patterns

The plugin will send notifications for any message that TheLounge marks as a highlight.

## Development

### Project Structure

```
thelounge-plugin-external-notify/
├── index.js                      # Main plugin entry point
├── package.json                  # Plugin metadata
├── lib/
│   ├── commands.js              # Command implementations
│   ├── config-manager.js        # Configuration handling
│   ├── notification-manager.js  # Notification routing logic
│   ├── format.js                # Message formatting utilities
│   ├── message.js               # Message sending utility
│   └── notifiers/
│       ├── base.js             # Abstract notifier interface
│       ├── pushover.js         # Pushover implementation
│       └── example.js          # Example notifier template
└── test/
    ├── config-manager.test.js
    ├── notification-manager.test.js
    ├── pushover.test.js
    ├── integration.test.js
    └── simple.test.js
```

### Adding New Notifiers

To add support for a new service:

1. Create `lib/notifiers/yourservice.js` extending `BaseNotifier`
2. Implement required methods:
   - `constructor()` - Set up registerVariables with required/optional fields
   - Define defaults for optional fields
   - Let BaseNotifier handle validation
3. The plugin will automatically:
   - Load your notifier when configured
   - Validate configuration using your registerVariables
   - Apply defaults for optional fields

See `lib/notifiers/pushover.js` for a complete example.

### Design Philosophy

**Service-Agnostic Architecture:**
- Core infrastructure (`config-manager.js`, `notification-manager.js`) knows nothing about specific services
- Each notifier (`lib/notifiers/*.js`) manages its own:
  - Configuration schema (via `registerVariables`)
  - Validation logic (via `validate()`)
  - Default values for optional fields
  - API integration

**Benefits:**
- Easy to add new notification services
- No service-specific code in core files
- Each service is self-contained and maintainable

## Testing

Run the test suite:
```bash
npm test
```

See `TESTING.md` for detailed testing instructions.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

- Report bugs at: [GitHub Issues](https://github.com/yourusername/thelounge-plugin-external-notify/issues)
- TheLounge documentation: [thelounge.chat](https://thelounge.chat/)
- Pushover API docs: [pushover.net/api](https://pushover.net/api)
