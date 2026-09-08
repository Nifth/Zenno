export type FeatureStatus = 'ready' | 'in progress' | 'planned';

export type Feature = {
	id: string;
	name: string;
	desc: string;
	category: string;
	icon: string;
	status: FeatureStatus;
};

export const features: Feature[] = [
	{
		id: "json",
		name: "JSON Formatter",
		desc: "Beautify, minify and validate JSON with syntax highlighting.",
		category: "Formatters",
		icon: "⚙",
		status: "ready",
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
		status: "ready",
	},
	{
		id: "jwt",
		name: "JWT Decoder",
		desc: "Decode header & payload, check expiration dates locally.",
		category: "Security",
		icon: "🔑",
		status: "ready",
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

export const activeFeatures = (): Feature[] => {
	return features.filter((f) => f.status === 'ready' || f.status === 'in progress');
};
