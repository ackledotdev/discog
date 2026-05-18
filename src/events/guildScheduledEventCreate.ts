import { Events, GuildScheduledEvent } from 'discord.js';

export const name = Events.GuildScheduledEventCreate;
export const once = false;

export const execute = async (event: GuildScheduledEvent) => {
	const channelId = event.channelId;
	if (!channelId) return;

	const channel = await event.guild?.channels.fetch(channelId);
	if (!channel || !channel.isTextBased()) return;

	await channel.send(`New Event Created: ${event.url}`);
};
