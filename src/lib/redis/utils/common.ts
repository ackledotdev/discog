import { Snowflake } from 'discord.js';
import { createClient } from 'redis';

export const KEYS = {
	DEVELOPER_IDS_SET: 'discog_developer_ids_set',
	BLACKLIST_IDS_SET: 'discog_blacklist_ids_set',
	GUILD_CONFIG: 'discog_guild_config'
} as const;

export async function getDeveloperIds() {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	return await client.sMembers(KEYS.DEVELOPER_IDS_SET);
}

export async function isDeveloper(id: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	return await client.sIsMember(KEYS.DEVELOPER_IDS_SET, id) === 1;
}

export async function makeDeveloper(id: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	await client.sAdd(KEYS.DEVELOPER_IDS_SET, id);
}

export async function unMakeDeveloper(id: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	await client.sRem(KEYS.DEVELOPER_IDS_SET, id);
}

export async function getBlacklistIds() {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	return await client.sMembers(KEYS.BLACKLIST_IDS_SET);
}

export async function isBlacklisted(id: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	return await client.sIsMember(KEYS.BLACKLIST_IDS_SET, id) === 1;
}

export async function blacklistUser(id: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	await client.sAdd(KEYS.BLACKLIST_IDS_SET, id);
}

export async function unBlacklistUser(id: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	await client.sRem(KEYS.BLACKLIST_IDS_SET, id);
}
