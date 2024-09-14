import 'dotenv/config';
import { openKv } from '@deno/kv';
import { BaseGuildConfig } from '../struct/database';
import { Guild } from 'discord.js';
import { DENO_KV_URL, DatabaseKeys } from '../config';

const db = await openKv(DENO_KV_URL, {
	accessToken: process.env.DENO_KV_ACCESS_TOKEN!
});

export async function getGuildAuditLoggingChannel(guild: Guild) {
	const config = await getGuildConfig(guild);
	if (!config.auditlog?.enabled || !config?.auditlog?.channel) return;
	const auditlogChannel = guild.channels.cache.get(config.auditlog.channel);
	if (!auditlogChannel || !auditlogChannel.isTextBased()) return;
	return auditlogChannel;
}

export async function getGuildGreetingData(guild: Guild) {
	return (await getGuildConfig(guild)).greetings;
}

async function getGuildConfig(guild: Guild) {
	return (
		(await db.get<BaseGuildConfig>([DatabaseKeys.GuildConfig, guild.id]))
			.value ?? {}
	);
}
