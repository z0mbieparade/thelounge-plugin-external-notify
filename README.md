# TheLounge External Notify Plugin

Send IRC notifications to external services like Pushover when you're away or mentioned.

## Features

- Get notifications on your phone or other devices when mentioned in IRC
- Support for highlights, keywords, and channel filtering
- Currently supports Pushover (more services coming soon)
- Smart filtering to avoid notification spam
- Easy command-based configuration

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

### Quick Start

1. In TheLounge, type in any channel:
   ```
   /notify setup pushover
   ```

2. This will show you the configuration file path. Create or edit the file:
   ```bash
   nano ~/.thelounge/packages/node_modules/thelounge-plugin-external-notify/storage/your-username-config.json
   ```

3. Add your Pushover credentials:
   ```json
   {
     "enabled": true,
     "services": {
       "pushover": {
         "userKey": "your-30-character-user-key-here",
         "apiToken": "your-30-character-api-token-here",
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
   ```

4. Enable notifications:
   ```
   /notify enable
   ```

5. Test it:
   ```
   /notify test
   ```

### Configuration Options

#### Pushover Settings

- **userKey**: Your 30-character Pushover user key
- **apiToken**: Your 30-character Pushover API token
- **priority**: Notification priority (-2 to 2)
  - `-2`: No notification, just badge update
  - `-1`: Quiet notification
  - `0`: Normal priority (default)
  - `1`: High priority, bypasses quiet hours
  - `2`: Emergency priority, requires acknowledgment
- **sound**: Notification sound (see [Pushover sounds](https://pushover.net/api#sounds))

#### Filter Settings

- **onlyWhenAway**: Only send notifications when marked as away (default: `true`)
- **highlights**: Notify when your nickname is mentioned (default: `true`)
- **keywords**: Array of keywords to trigger notifications (default: `[]`)
- **channels.whitelist**: Only notify for these channels (default: all channels)
- **channels.blacklist**: Never notify for these channels (default: none)

## Usage

All commands are used with `/notify` in any channel or private message.

### Basic Commands

```
/notify status              Show current configuration and status
/notify enable              Enable notifications
/notify disable             Disable notifications
/notify test                Send a test notification
/notify help                Show help message
```

### Managing Keywords

```
/notify add-keyword urgent          Add "urgent" as a notification keyword
/notify add-keyword deploy failed   Add "deploy failed" as a keyword phrase
/notify remove-keyword urgent       Remove a keyword
```

### Setup Commands

```
/notify setup pushover      Show Pushover setup instructions
```

## Example Configurations

### Minimal - Only Highlights

```json
{
  "enabled": true,
  "services": {
    "pushover": {
      "userKey": "your-user-key",
      "apiToken": "your-api-token",
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
```

### Keywords Only - Monitor Specific Terms

```json
{
  "enabled": true,
  "services": {
    "pushover": {
      "userKey": "your-user-key",
      "apiToken": "your-api-token",
      "priority": 1,
      "sound": "cosmic"
    }
  },
  "filters": {
    "onlyWhenAway": false,
    "highlights": false,
    "keywords": ["production down", "urgent", "emergency", "deploy"],
    "channels": {
      "whitelist": ["#ops", "#alerts"],
      "blacklist": []
    }
  }
}
```

### Everything - All Messages Always

```json
{
  "enabled": true,
  "services": {
    "pushover": {
      "userKey": "your-user-key",
      "apiToken": "your-api-token",
      "priority": -1,
      "sound": "none"
    }
  },
  "filters": {
    "onlyWhenAway": false,
    "highlights": true,
    "keywords": [],
    "channels": {
      "whitelist": [],
      "blacklist": ["#spam", "#bots"]
    }
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

### Configuration file location

The configuration file is stored at:
```
~/.thelounge/packages/node_modules/thelounge-plugin-external-notify/storage/<username>-config.json
```

Replace `<username>` with your TheLounge username.

### Invalid Pushover credentials

- Verify your User Key is exactly 30 characters
- Verify your API Token is exactly 30 characters
- Make sure there are no extra spaces or quotes
- Test your credentials at [pushover.net](https://pushover.net/)

### Notifications too frequent

Adjust your filters:
- Set `onlyWhenAway: true` to only notify when away
- Use channel whitelist to limit which channels trigger notifications
- Remove broad keywords that match too often

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
│   └── notifiers/
│       ├── base.js             # Abstract notifier interface
│       └── pushover.js         # Pushover implementation
└── test/
    └── (tests coming soon)
```

### Adding New Notifiers

To add support for a new service:

1. Create `lib/notifiers/yourservice.js` extending `BaseNotifier`
2. Implement `send()`, `validate()`, and `getName()` methods
3. Add initialization in `lib/notification-manager.js`
4. Update configuration schema in README

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

- Report bugs at: [GitHub Issues](https://github.com/yourusername/thelounge-plugin-external-notify/issues)
- TheLounge documentation: [thelounge.chat](https://thelounge.chat/)
- Pushover API docs: [pushover.net/api](https://pushover.net/api)
