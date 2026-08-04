import { createClient } from 'redis';

const KEYS = {
	AUTODELETE_CONFIG: 'discog_autodelete_config_hash',
	AUTODELETE_SORTSET: 'discog_autodelete_sortset'
} as const;

export { KEYS as AUTODELETE_KEYS };

export function autoDeleteEntryKey(
	guildId: string,
	channelId: string,
	messageId: string
): `${string}:${string}:${string}` {
	return `${guildId}:${channelId}:${messageId}`;
}

export async function scheduleAutoDelete(
	guildId: string,
	channelId: string,
	messageId: string,
	deleteTimestamp: number
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	client.zAdd(KEYS.AUTODELETE_SORTSET, {
		score: deleteTimestamp,
		value: autoDeleteEntryKey(guildId, channelId, messageId)
	});

	client.close();

	return;
}

export async function fetchAutoDeleteMessages() {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const messages = (await client.zRange(
		KEYS.AUTODELETE_SORTSET,
		'-inf',
		Date.now(),
		{
			BY: 'SCORE'
		}
	)) as `${string}:${string}:${string}`[];

	client.close();

	return messages.map((message) => {
		const [guildId, channelId, messageId] = message.split(':');
		return { guildId, channelId, messageId };
	});
}

export async function removeAutoDeleteEntriesOfChannel(
	guildId: string,
	channelId: string
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const matches = await client.zScan(KEYS.AUTODELETE_SORTSET, '0', {
		MATCH: `${guildId}:${channelId}:*`
	});

	if (matches.members.length > 0) {
		await client.zRem(
			KEYS.AUTODELETE_SORTSET,
			matches.members.map((m) => m.value)
		);
	}

	client.close();
}

function autoDeleteConfigKey(
	guildId: string,
	channelId: string
): `${string}:${string}` {
	return `${guildId}:${channelId}`;
}

export async function clearAutoDelete(
	guildId: string,
	channelId: string
): Promise<void> {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	await client.hDel(
		KEYS.AUTODELETE_CONFIG,
		autoDeleteConfigKey(guildId, channelId)
	);

	client.close();
}

export async function setAutoDelete(
	guildId: string,
	channelId: string,
	delay: number,
	matchMode: 'contains' | 'startswith' | 'endswith',
	matchPattern: string
): Promise<void> {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	await client.hSet(
		KEYS.AUTODELETE_CONFIG,
		autoDeleteConfigKey(guildId, channelId),
		`${delay}:${matchMode}:${matchPattern}`
	);

	client.close();
}

export async function getAutoDelete(guildId: string, channelId: string) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const val = await client.hGet(
		KEYS.AUTODELETE_CONFIG,
		autoDeleteConfigKey(guildId, channelId)
	);

	client.close();

	if (!val) return null;

	const [delay, matchMode, matchPattern] = val.split(':');

	return {
		delay: parseInt(delay),
		matchMode: matchMode as 'contains' | 'startswith' | 'endswith',
		matchPattern
	};
}
