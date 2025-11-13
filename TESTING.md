# Testing Guide for thelounge-plugin-external-notify

This document provides comprehensive testing instructions for the external-notify plugin.

## Automated Tests

### Run All Tests
Run the complete test suite:
```bash
npm test
```

This runs all unit and integration tests covering:
- ✅ Configuration management
- ✅ Notification routing and filtering
- ✅ Pushover integration
- ✅ Message deduplication
- ✅ Highlight detection
- ✅ Service-agnostic design

### Basic Structure Tests
Run the basic structure validation tests:
```bash
npm run test:basic
# or
npx mocha test/simple.test.js
```

These tests verify:
- ✅ All required files exist
- ✅ Package.json has correct structure
- ✅ Plugin exports correct functions
- ✅ Library files are present
- ✅ README documentation is complete

### Plugin Verification
Run the verification script before installation:
```bash
node verify-plugin.js
```

## Manual Testing

Since this plugin integrates with external services, manual testing is essential.

### Prerequisites

1. **Install TheLounge**:
   ```bash
   npm install -g thelounge
   # or for development
   git clone https://github.com/thelounge/thelounge.git
   cd thelounge
   yarn install
   NODE_ENV=production yarn build
   ```

2. **Setup Pushover**:
   - Sign up at https://pushover.net/
   - Get your User Key from the dashboard
   - Create an application at https://pushover.net/apps/build
   - Get your API Token

3. **Install the external-notify plugin**:
   ```bash
   # Method 1: Install from local directory
   thelounge install /path/to/thelounge-plugin-external-notify

   # Method 2: Copy to packages directory
   mkdir -p ~/.thelounge/packages
   cp -r /path/to/thelounge-plugin-external-notify ~/.thelounge/packages/

   # Method 3: If published to npm
   thelounge install thelounge-plugin-external-notify
   ```

4. **Restart TheLounge**:
   ```bash
   thelounge restart
   ```

### Test Scenarios

#### Test 1: Plugin Loading
**Expected Result**: Plugin loads without errors

1. Start TheLounge with debug logging:
   ```bash
   DEBUG=thelounge* thelounge start
   ```

2. Check the logs for:
   - ✅ "External Notify plugin loaded" message
   - ✅ Configuration directory path displayed
   - ✅ No error messages related to external-notify

#### Test 2: Command Registration
**Expected Result**: /notify command is available

1. Connect to an IRC network through TheLounge
2. In any channel, type:
   ```
   /notify help
   ```
3. Verify:
   - ✅ Help message displays all available commands
   - ✅ No error messages appear

#### Test 3: Configuration Setup
**Expected Result**: Configuration wizard works

1. Type in any channel:
   ```
   /notify setup pushover
   ```
2. Verify:
   - ✅ Setup instructions are displayed
   - ✅ Configuration file path is shown
   - ✅ Example configuration is provided

3. Configure using interactive commands:
   ```
   /notify config pushover userKey YOUR_30_CHAR_USER_KEY
   /notify config pushover apiToken YOUR_30_CHAR_API_TOKEN
   ```

#### Test 4: Status Command
**Expected Result**: Status shows current configuration

1. Type:
   ```
   /notify status
   ```
2. Verify:
   - ✅ Shows enabled/disabled state
   - ✅ Lists configured services (Pushover)
   - ✅ Shows filter settings
   - ✅ Displays validation status

#### Test 5: Enable Notifications
**Expected Result**: Notifications can be enabled

1. Type:
   ```
   /notify enable
   ```
2. Verify:
   - ✅ Success message appears
   - ✅ No error about missing configuration
3. If errors occur:
   - ✅ Check configuration file exists
   - ✅ Verify Pushover credentials are correct (30 characters each)

#### Test 6: Test Notification
**Expected Result**: Test notification is received on your device

1. With notifications enabled, type:
   ```
   /notify test
   ```
2. Check your phone/device:
   - ✅ Notification appears within 5 seconds
   - ✅ Title shows "TheLounge External Notify"
   - ✅ Message shows test notification text

#### Test 7: Highlight Detection
**Expected Result**: Notifications sent when mentioned

1. Have another user (or use another client) mention your nickname in a channel:
   ```
   <otheruser> hey yourusername, check this out
   ```
2. Check your device:
   - ✅ Notification received
   - ✅ Title shows "network - #channel"
   - ✅ Message shows "<otheruser> hey yourusername, check this out"

#### Test 8: Away Status Filtering
**Expected Result**: onlyWhenAway setting respected

1. Set yourself as away in IRC:
   ```
   /away Testing notifications
   ```
2. Have someone mention you
3. Verify:
   - ✅ Notification received when away and onlyWhenAway is true

4. Return from away:
   ```
   /away
   ```
5. Have someone mention you
6. Verify:
   - ✅ Notification not received when present and onlyWhenAway is true
   - ✅ Notification received when present and onlyWhenAway is false

#### Test 9: Disable Notifications
**Expected Result**: Notifications stop when disabled

1. Type:
   ```
   /notify disable
   ```
2. Have someone mention your nickname
3. Verify:
   - ✅ No notification received
   - ✅ Status shows disabled

#### Test 10: Deduplication
**Expected Result**: Duplicate messages not sent twice

1. Enable notifications
2. Send the same message multiple times quickly
3. Verify:
   - ✅ Only one notification received
   - ✅ No duplicate notifications within 60 seconds

#### Test 11: Multiple Networks
**Expected Result**: Each network independently configured

1. Connect to multiple IRC networks
2. Configure notifications per network
3. Verify:
   - ✅ Each network has its own configuration
   - ✅ Enable/disable works independently
   - ✅ Notifications show correct network name

#### Test 12: Configuration Persistence
**Expected Result**: Settings survive restart

1. Configure notifications with specific settings
2. Restart TheLounge:
   ```bash
   thelounge restart
   ```
3. Check status:
   ```
   /notify status
   ```
4. Verify:
   - ✅ Configuration unchanged
   - ✅ Enabled state preserved
   - ✅ Service credentials intact

#### Test 13: Interactive Configuration
**Expected Result**: Config commands work correctly

1. Test filter configuration:
   ```
   /notify config filter onlyWhenAway false
   /notify config filter highlights true
   ```
2. Test Pushover settings:
   ```
   /notify config pushover priority 1
   /notify config pushover sound cosmic
   ```
3. Verify with `/notify status` that settings were applied

#### Test 14: TheLounge Highlight Integration
**Expected Result**: Plugin respects TheLounge highlight settings

1. Go to TheLounge Settings > Highlights
2. Add custom highlight words (e.g., "urgent", "deploy")
3. Have someone use those words in a message
4. Verify:
   - ✅ Notifications triggered for custom highlights
   - ✅ Plugin uses TheLounge's highlight detection

### Troubleshooting

#### Plugin Not Loading
1. Check TheLounge logs for errors
2. Verify plugin is in correct directory:
   ```bash
   thelounge list
   ```
3. Check file permissions
4. Verify package.json format:
   ```bash
   node verify-plugin.js
   ```

#### /notify Command Not Found
1. Verify plugin loaded successfully
2. Check TheLounge version (requires 4.0.0+)
3. Try reconnecting to IRC network
4. Restart TheLounge

#### Configuration File Issues
1. Check file path from `/notify setup pushover`
2. Verify JSON syntax is valid
3. Ensure userKey and apiToken are exactly 30 characters
4. Check file permissions (should be readable)

#### No Notifications Received
1. Send test notification: `/notify test`
2. If test fails:
   - ✅ Verify Pushover credentials at https://pushover.net/
   - ✅ Check you're logged into Pushover app on device
   - ✅ Verify device is registered with Pushover
3. If test works but real notifications don't:
   - ✅ Check filters in `/notify status`
   - ✅ Verify highlights are enabled
   - ✅ Check if onlyWhenAway is blocking notifications
   - ✅ Make sure you're being mentioned/highlighted

#### Test Notification Works But Not Real Messages
1. Check filter settings:
   ```
   /notify status
   ```
2. Verify you're actually being highlighted (check TheLounge's built-in highlight detection)
3. Try disabling onlyWhenAway filter:
   ```
   /notify config filter onlyWhenAway false
   ```
4. Check TheLounge Settings > Highlights for your custom highlight words

#### Notifications Too Frequent
1. Enable onlyWhenAway filter:
   ```
   /notify config filter onlyWhenAway true
   ```
2. Disable notifications when actively using IRC:
   ```
   /notify disable
   ```

### Performance Testing

For high-traffic scenarios:

1. Join busy channels with lots of activity
2. Monitor for:
   - ✅ No significant lag in message delivery
   - ✅ No memory leaks over time
   - ✅ Proper message ordering
   - ✅ Deduplication working correctly
   - ✅ No duplicate API calls

### Expected Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Plugin Loading | ✅ Pass | Should load without errors |
| Command Registration | ✅ Pass | /notify available |
| Configuration Setup | ✅ Pass | Wizard displays instructions |
| Status Command | ✅ Pass | Shows current config |
| Enable Notifications | ✅ Pass | Enables successfully |
| Test Notification | ✅ Pass | Received on device |
| Highlight Detection | ✅ Pass | Mentions trigger notifications |
| Away Status Filtering | ✅ Pass | onlyWhenAway respected |
| Disable Notifications | ✅ Pass | Stops sending notifications |
| Deduplication | ✅ Pass | No duplicate notifications |
| Multiple Networks | ✅ Pass | Independent per network |
| Config Persistence | ✅ Pass | Survives restart |
| Interactive Config | ✅ Pass | Commands modify settings |
| Highlight Integration | ✅ Pass | Uses TheLounge highlights |

### Reporting Issues

If any tests fail, please report with:
1. TheLounge version (`thelounge --version`)
2. Plugin version (from package.json)
3. Node.js version (`node --version`)
4. Specific test that failed
5. Error logs from TheLounge
6. Configuration file (remove sensitive keys)
7. Steps to reproduce

### Security Testing

When testing with real credentials:
1. ✅ Never commit config files with real API keys
2. ✅ Verify storage directory has proper permissions
3. ✅ Test with invalid credentials to ensure errors handled gracefully
4. ✅ Verify no credentials appear in logs

### Additional Test Cases

#### Error Handling
1. Test with invalid Pushover credentials
2. Test with network disconnected
3. Test with malformed config file
4. Verify graceful degradation

#### Edge Cases
1. Very long messages (>1000 characters)
2. Messages with special characters
3. Unicode and emoji in messages
4. Messages with URLs
5. Private messages vs channel messages

## Continuous Integration

For automated CI/CD:

```bash
# Install dependencies
npm install

# Run linter (if configured)
npm run lint

# Run all tests
npm test

# Verify plugin structure
node verify-plugin.js
```

All tests must pass before deployment.

## Test Coverage

Current test coverage includes:

- **Configuration Management**: Load, save, validate, merge with defaults
- **Notification Manager**: Message filtering, deduplication, formatting
- **Pushover Notifier**: API integration, validation, defaults
- **Integration**: End-to-end notification flow
- **Service-Agnostic Design**: Generic validation without service-specific code

See individual test files for detailed test cases:
- `test/config-manager.test.js`
- `test/notification-manager.test.js`
- `test/pushover.test.js`
- `test/integration.test.js`
- `test/simple.test.js`
