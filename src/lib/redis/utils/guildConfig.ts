import { createClient } from 'redis';
import { KEYS } from './common';
import { Snowflake } from 'discord.js';
import { GuildGreetingsConfig } from '../schema';

export const GUILD_CONFIG_KEYS = {
	AUDIT_LOG_CHANNEL: 'auditlogchannel',
	SYSTEM_CHANNEL: 'systemchannel',
	GREETINGS_CHANNEL: 'greetingschannel',
	GREETINGS_WELCOME_ENABLED: 'greetings_welcome_enabled',
	GREETINGS_GOODBYE_ENABLED: 'greetings_goodbye_enabled'
} as const;

export function guildConfigKey(guildId: Snowflake) {
	return `${KEYS.GUILD_CONFIG}:${guildId}`;
}

export async function getGuildConfig(guildId: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	const config = await client.hGetAll(guildConfigKey(guildId));
	return {
		auditlogChannel: config[GUILD_CONFIG_KEYS.AUDIT_LOG_CHANNEL] || null,
		systemchannel: config[GUILD_CONFIG_KEYS.SYSTEM_CHANNEL] || null,
		greetings: {
			channel: config[GUILD_CONFIG_KEYS.GREETINGS_CHANNEL] || null,
			welcomeEnabled:
				config[GUILD_CONFIG_KEYS.GREETINGS_WELCOME_ENABLED] === 'true',
			goodbyeEnabled:
				config[GUILD_CONFIG_KEYS.GREETINGS_GOODBYE_ENABLED] === 'true'
		}
	};
}

export async function getGuildAuditLogChannelId(guildId: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	return await client.hGet(
		guildConfigKey(guildId),
		GUILD_CONFIG_KEYS.AUDIT_LOG_CHANNEL
	);
}

export async function setGuildAuditLogChannel(
	guildId: Snowflake,
	channelId: Snowflake | null
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	if (channelId)
		await client.hSet(
			guildConfigKey(guildId),
			GUILD_CONFIG_KEYS.AUDIT_LOG_CHANNEL,
			channelId
		);
	else
		await client.hDel(
			guildConfigKey(guildId),
			GUILD_CONFIG_KEYS.AUDIT_LOG_CHANNEL
		);
}

export async function getGuildSystemChannelId(guildId: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	return await client.hGet(
		guildConfigKey(guildId),
		GUILD_CONFIG_KEYS.SYSTEM_CHANNEL
	);
}

export async function setGuildSystemChannel(
	guildId: Snowflake,
	channelId: Snowflake | null
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	if (channelId)
		await client.hSet(
			guildConfigKey(guildId),
			GUILD_CONFIG_KEYS.SYSTEM_CHANNEL,
			channelId
		);
	else
		await client.hDel(
			guildConfigKey(guildId),
			GUILD_CONFIG_KEYS.SYSTEM_CHANNEL
		);
}

export async function getGuildGreetingsConfig(guildId: Snowflake) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	const config = await client.hmGet(guildConfigKey(guildId), [
		GUILD_CONFIG_KEYS.GREETINGS_CHANNEL,
		GUILD_CONFIG_KEYS.GREETINGS_WELCOME_ENABLED,
		GUILD_CONFIG_KEYS.GREETINGS_GOODBYE_ENABLED
	]);
	return {
		channel: config[0] || null,
		welcomeEnabled: config[1] === 'true',
		goodbyeEnabled: config[2] === 'true'
	};
}

export async function setGuildGreetingsConfig(
	guildId: Snowflake,
	config: GuildGreetingsConfig
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();
	if (config.channel)
		await client.hSet(guildConfigKey(guildId), {
			[GUILD_CONFIG_KEYS.GREETINGS_CHANNEL]: config.channel,
			[GUILD_CONFIG_KEYS.GREETINGS_WELCOME_ENABLED]:
				config.welcomeEnabled.toString(),
			[GUILD_CONFIG_KEYS.GREETINGS_GOODBYE_ENABLED]:
				config.goodbyeEnabled.toString()
		});
	else
		await client.hDel(guildConfigKey(guildId), [
			GUILD_CONFIG_KEYS.GREETINGS_CHANNEL,
			GUILD_CONFIG_KEYS.GREETINGS_WELCOME_ENABLED,
			GUILD_CONFIG_KEYS.GREETINGS_GOODBYE_ENABLED
		]);
}
