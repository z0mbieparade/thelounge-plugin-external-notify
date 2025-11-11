#!/usr/bin/env node
"use strict";

/**
 * Plugin Verification Script
 *
 * This script verifies that the external-notify plugin is properly structured
 * and ready for installation in TheLounge.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying thelounge-plugin-external-notify...\n');

const checks = [
	{
		name: 'Package.json exists and is valid',
		check: () => {
			const packagePath = path.join(__dirname, 'package.json');
			if (!fs.existsSync(packagePath)) return false;

			const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
			return pkg.name === 'thelounge-plugin-external-notify' &&
				   pkg.main === 'index.js' &&
				   pkg.thelounge &&
				   pkg.keywords.includes('thelounge-plugin');
		}
	},
	{
		name: 'Main entry point (index.js) exists',
		check: () => fs.existsSync(path.join(__dirname, 'index.js'))
	},
	{
		name: 'Plugin exports onServerStart function',
		check: () => {
			const content = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
			return content.includes('onServerStart') && content.includes('module.exports');
		}
	},
	{
		name: 'Plugin registers notify command',
		check: () => {
			const content = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
			return content.includes('api.Commands.add') && content.includes('notify');
		}
	},
	{
		name: 'Required library files exist',
		check: () => {
			const files = [
				'lib/commands.js',
				'lib/config-manager.js',
				'lib/notification-manager.js',
				'lib/notifiers/base.js',
				'lib/notifiers/pushover.js'
			];
			return files.every(file => fs.existsSync(path.join(__dirname, file)));
		}
	},
	{
		name: 'README.md exists with documentation',
		check: () => {
			if (!fs.existsSync(path.join(__dirname, 'README.md'))) return false;
			const content = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
			return content.includes('thelounge-plugin-external-notify') &&
				   content.includes('Installation') &&
				   content.includes('Usage') &&
				   content.includes('Pushover');
		}
	},
	{
		name: 'LICENSE file exists',
		check: () => fs.existsSync(path.join(__dirname, 'LICENSE'))
	},
	{
		name: 'Example configuration file exists',
		check: () => fs.existsSync(path.join(__dirname, 'config.example.json'))
	},
	{
		name: 'Testing infrastructure is present',
		check: () => {
			return fs.existsSync(path.join(__dirname, 'test')) &&
				   fs.existsSync(path.join(__dirname, 'TESTING.md'));
		}
	},
	{
		name: 'Plugin uses persistent storage',
		check: () => {
			const content = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
			return content.includes('getPersistentStorageDir');
		}
	},
	{
		name: 'Plugin has proper dependencies',
		check: () => {
			const packagePath = path.join(__dirname, 'package.json');
			const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
			return pkg.dependencies && pkg.dependencies['pushover-notifications'];
		}
	},
	{
		name: 'Configuration manager exists',
		check: () => {
			const content = fs.readFileSync(path.join(__dirname, 'lib/config-manager.js'), 'utf8');
			return content.includes('class ConfigManager') &&
				   content.includes('load') &&
				   content.includes('save');
		}
	},
	{
		name: 'Notification manager exists',
		check: () => {
			const content = fs.readFileSync(path.join(__dirname, 'lib/notification-manager.js'), 'utf8');
			return content.includes('class NotificationManager') &&
				   content.includes('processMessage') &&
				   content.includes('shouldNotify');
		}
	}
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
	try {
		if (check.check()) {
			console.log(`✅ ${check.name}`);
			passed++;
		} else {
			console.log(`❌ ${check.name}`);
			failed++;
		}
	} catch (error) {
		console.log(`❌ ${check.name} (Error: ${error.message})`);
		failed++;
	}
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
	console.log('🎉 Plugin verification successful!');
	console.log('📦 Ready for installation with: thelounge install thelounge-plugin-external-notify');
	console.log('📚 See TESTING.md for manual testing instructions');
	console.log('⚙️  Configure your Pushover credentials in the config file before use');
	process.exit(0);
} else {
	console.log('⚠️  Plugin verification failed. Please fix the issues above.');
	process.exit(1);
}
