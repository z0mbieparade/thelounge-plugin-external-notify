"use strict";

/**
 * IRC color and formatting codes
 * Standard IRC color codes for text formatting
 */
const C = {
	// Formatting codes
	RESET: "\x0F",
	BOLD: "\x02",
	UNDERLINE: "\x1F",
	ITALIC: "\x1D",

	// Color codes: \x03[foreground][,background]
	// Standard 16 IRC colors
	WHITE: "\x0300",
	BLACK: "\x0301",
	RED: "\x0304",
	BROWN: "\x0305",
	ORANGE: "\x0307",
	YELLOW: "\x0308",
	GREEN: "\x0303",
	LIME: "\x0309",
	TEAL: "\x0310",
	CYAN: "\x0311",
	NAVY: "\x0302",
	BLUE: "\x0312",
	PURPLE: "\x0306",
	PINK: "\x0313",
	GREY: "\x0314",
	LIGHT_GREY: "\x0315"
};

C.INFO = C.CYAN;
C.ERROR = C.RED;
C.SUCCESS = C.LIME;
C.WARNING = C.ORANGE;
C.DISABLED = C.LIGHT_GREY;

const width = 60;
const halfWidth = Math.floor(width / 2) % 2 === 0 ? width / 2 : (width / 2) - 1;

const Break = '╶'.repeat(width);
const BreakLight = "╶ ".repeat(halfWidth);
const BreakFormat = `${C.LIGHT_GREY}${Break}${C.RESET}`;
const BreakLightFormat = `${C.GREY}${BreakLight}${C.RESET}`;

const Check = "✓";
const Cross = "✗";
const Warn = "!";
const Info = "💡";
const Tab = "  ";
const Indent = (indent = 1, text = '') => {
	indent = Math.max(0, indent);
	if(Array.isArray(text)) {
		return text.map(line => Indent(indent, line));
	}
	return `${Tab.repeat(indent)}${text}`;
};
const Header = (title) => {
	const breakWidth = width - title.length - 2;
	const sideWidth = Math.floor(breakWidth / 2);
	return `${C.BOLD}${C.TEAL}${'═'.repeat(sideWidth)} ${title} ${'═'.repeat(breakWidth - sideWidth)}${C.RESET}`;
}

const F = {
	BREAK: BreakFormat,
	BREAK_LIGHT: BreakLightFormat,
	CHECK: `${C.SUCCESS}${Check}${C.RESET}`,
	CROSS: `${C.ERROR}${Cross}${C.RESET}`,
	WARN: `${C.WARNING}${Warn}${C.RESET}`,
	I: `${C.INFO}${Info}${C.RESET}`,
	TAB: Tab,
	INDENT: Indent,
	HEADER: Header,
	SUBHEADER: (title = '', note = '') => `${C.BOLD}${C.LIGHT_GREY}${title}${C.RESET}${note ? ` ${C.ITALIC}${C.GREY}(${note})${C.RESET}` : ''}`,
	LABEL: (label = '', text = '') => `${C.BOLD}${label}:${C.RESET} ${text}`,
	LI: (i, text = '') => `${Tab}${C.GREY}${i}.${C.RESET} ${text}`,
	LI_SUCCESS: (text = '') => `${Tab}${C.SUCCESS}${Check}${C.RESET} ${text}`,
	LI_ERROR: (text = '') => `${Tab}${C.ERROR}${Cross}${C.RESET} ${text}`,
	LI_WARN: (text = '') => `${Tab}${C.WARNING}${Warn}${C.RESET} ${text}`,
	INFO: (msg = '', incTitle = false) => `${C.INFO}${Info}${incTitle ? " Info:" : ""}${C.RESET} ${msg}`,
	ERROR: (msg = '', incTitle = true) => `${C.ERROR}${Cross}${incTitle ? " Error:" : ""}${C.RESET} ${msg}`,
	SUCCESS: (msg = '', incTitle = false) => `${C.SUCCESS}${Check}${incTitle ? " Success:" : ""}${C.RESET} ${msg}`,
	WARNING: (msg = '', incTitle = false) => `${C.WARNING}${Warn}${incTitle ? " Warning:" : ""}${C.RESET} ${msg}`,
	CMD: (subCmd = '', note = '') => `${C.ORANGE}/notify${subCmd ? C.PINK + ' ' + subCmd : ''}${note ? C.LIGHT_GREY + ' - ' + note : ''}${C.RESET}`
};

F.HELP = [
	F.HEADER("External Notify Plugin"),
	BreakFormat,
	F.SUBHEADER("Quick start:"),
	F.LI(1, F.CMD('config pushover userKey YOUR_USER_KEY')),
	F.LI(2, F.CMD('config pushover apiToken YOUR_API_TOKEN')),
	F.LI(3, F.CMD('enable')),
	BreakFormat,
	F.SUBHEADER("Highlight configuration:"),
	`  Configure highlight words in ${C.BOLD}TheLounge Settings > Highlights${C.RESET}`,
	`  The plugin will use your TheLounge highlight settings`,
	BreakFormat,
	F.SUBHEADER("Available commands:"),
	Indent(1, F.CMD('status', 'Show current configuration')),
	Indent(1, F.CMD('enable', 'Enable notifications')),
	Indent(1, F.CMD('disable', 'Disable notifications')),
	Indent(1, F.CMD('config', 'Configure settings interactively')),
	Indent(1, F.CMD('test [service]', 'Send test notification')),
	Indent(1, F.CMD('help', 'Show this help message'))
];

module.exports = 
{
	C: C,
	F: F,
	NF: {
		BREAK: Break,
		BREAK_LIGHT: BreakLight,
		CHECK: Check,
		CROSS: Cross,
		WARN: Warn
	}
};
