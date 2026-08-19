export const features = [
	{
		id: "json-formatter",
		name: "JSON Prettify & Minify",
		desc: "Format, validate and compress JSON strings instantly.",
		category: "Formatters",
		icon: "⚙",
		status: "planned",
	},
	{
		id: "base64",
		name: "Base64 Encoder",
		desc: "Encode or decode strings to Base64",
		category: "Converters",
		icon: "🔄",
		status: "ready",
	},
	{
		id: "url",
		name: "URL Encoder",
		desc: "Encode or decode strings to URL-safe format",
		category: "Converters",
		icon: "🔄",
		status: "in progress",
	},
	{
		id: "jwt-decoder",
		name: "JWT Decoder",
		desc: "Decode header & payload, check expiration dates locally.",
		category: "Security",
		icon: "🔑",
		status: "planned",
	},
	{
		id: "diff-viewer",
		name: "Diff Viewer",
		desc: "Side-by-side text and JSON structural comparison.",
		category: "Utilities",
		icon: "🔍",
		status: "planned",
	},
	{
		id: "regex-tester",
		name: "Regex Tester",
		desc: "Test JavaScript regular expressions with live highlights.",
		category: "DevTools",
		icon: "🧪",
		status: "planned",
	},
	{
		id: "sql-formatter",
		name: "SQL Formatter",
		desc: "Clean up ugly SQL queries and convert dialect formats.",
		category: "Formatters",
		icon: "🗄",
		status: "planned",
	},
];

export const activeFeatures = () => {
    return features.filter((f) => ["ready","in progress"].includes(f.status));
};