import {
	AuditLogEvent,
	EmbedBuilder,
	Events,
	GuildChannel,
	channelMention
} from 'discord.js';
import { getGuildAuditLogChannelId } from '../lib/redis';

export const name = Events.ChannelCreate;
export const once = false;

export const execute = async (channel: GuildChannel) => {
	const auditLogChannelId = await getGuildAuditLogChannelId(channel.guild.id);
	if (!auditLogChannelId) return;

	const auditLogChannel = await channel.guild.channels.fetch(auditLogChannelId);
	if (!auditLogChannel || !auditLogChannel.isTextBased()) return;

	const entry = (
		await channel.guild.fetchAuditLogs({
			limit: 1,
			type: AuditLogEvent.ChannelCreate
		})
	).entries.first();

	await auditLogChannel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle('Channel Created')
				.setDescription(channelMention(channel.id))
				.setFields(
					entry?.executor
						? [{ name: 'Created By', value: entry.executor.toString() }]
						: []
				)
				.setTimestamp()
				.setColor(0x00ff00)
				.setFooter({
					iconURL: channel.guild.members.me?.displayAvatarURL(),
					text: 'Powered by DisCog'
				})
		]
	});
};
