import { Events, GuildScheduledEvent } from 'discord.js';
import { getGuildAuditLogChannelId } from '../lib/redis';

export const name = Events.GuildScheduledEventUpdate;
export const once = false;

export const execute = async (_oldevent: GuildScheduledEvent, newevent: GuildScheduledEvent) => {
	const channelId = await getGuildAuditLogChannelId(newevent.guildId);
	if (!channelId) return;

	const channel = await newevent.guild?.channels.fetch(channelId);
	if (!channel || !channel.isTextBased()) return;

	await channel.send(`Event Updated: ${newevent.url} (${newevent.name})`);
};
