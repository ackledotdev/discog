import { Events, GuildScheduledEvent } from 'discord.js';
import { getGuildAuditLogChannelId } from '../lib/redis';

export const name = Events.GuildScheduledEventDelete;
export const once = false;

export const execute = async (event: GuildScheduledEvent) => {
	const channelId = await getGuildAuditLogChannelId(event.guildId);
	if (!channelId) return;

	const channel = await event.guild?.channels.fetch(channelId);
	if (!channel || !channel.isTextBased()) return;

	await channel.send(`Event Deleted: ${event.url} (${event.name})`);
};
