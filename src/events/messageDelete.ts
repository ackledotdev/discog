import {
	EmbedBuilder,
	Events,
	Message,
	channelMention,
	userMention
} from 'discord.js';
import { getGuildAuditLogChannelId } from '../lib/redis';

export const name = Events.MessageDelete;
export const once = false;

export const execute = async (message: Message) => {
	if (!message.inGuild()) return;

	if (message.author.bot) return;

	const channelId = await getGuildAuditLogChannelId(message.guild.id);
	if (!channelId) return;

	const channel = await message.guild.channels.fetch(channelId);
	if (!channel || !channel.isTextBased()) return;

	await channel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle(
					message.content ? 'Message Deleted' : 'Message Deleted (No Content)'
				)
				.setDescription(
					message.content
						? message.content
						: 'No content available'
				)
				.setFields(
					{
						name: 'Author',
						value: userMention(message.author.id) ?? message.author.id
					},
					{
						name: 'Channel',
						value: channelMention(message.channel.id) ?? message.channel.id
					},
					{
						name: 'Message ID',
						value: message.id
					}
				)
				.setColor(0x0000ff)
				.setTimestamp()
				.setFooter({
					iconURL: message.guild.members.me?.displayAvatarURL(),
					text: 'Powered by DisCog'
				})
		],
		files:
			message.attachments.size > 0
				? message.attachments.map((attachment) => attachment.url)
				: undefined
	});
};
