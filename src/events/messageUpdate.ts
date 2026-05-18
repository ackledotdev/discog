import {
	Client,
	EmbedBuilder,
	Events,
	Message,
	channelMention,
	codeBlock,
	time,
	userMention
} from 'discord.js';

export const name = Events.MessageUpdate;
export const once = false;

import { TimestampStyles } from 'discord.js';
import { getDeveloperIds, getGuildAuditLogChannelId } from '../lib/redis';

export const execute = async (oldMessage: Message, newMessage: Message) => {
	try {
		if (!oldMessage || !newMessage) return;
		if (
			oldMessage.author.bot ||
			!oldMessage.inGuild() ||
			newMessage.author.bot ||
			!newMessage.inGuild() ||
			oldMessage.content === newMessage.content // Discord seems to send an update event for every embed update, so we need to filter out those
		)
			return;

		const channelId = await getGuildAuditLogChannelId(newMessage.guild.id);
		if (!channelId) return;

		const channel = await newMessage.guild.channels.fetch(channelId);
		if (!channel || !channel.isTextBased()) return;

		await channel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle('Message Updated')
					.setDescription(newMessage.url)
					.setFields(
						{
							name: 'Author',
							value: userMention(newMessage.author.id)
						},
						{
							name: 'Channel',
							value: channelMention(newMessage.channel.id)
						},
						{
							name: 'Message ID',
							value: newMessage.id
						},
						{
							name: 'Initial Content',
							value: oldMessage.content
						},
						{
							name: 'Updated Content',
							value: newMessage.content
						}
					)
					.setColor(0x0000ff)
					.setTimestamp()
					.setFooter({
						iconURL: newMessage.guild.members.me?.displayAvatarURL(),
						text: 'Powered by DisCog'
					})
			]
		});
	} catch (e) {
		await sendError(newMessage.client, e, oldMessage, newMessage);
	}
};

async function sendError(client: Client<true>, e: unknown, oldMessage: Message, newMessage: Message) {
	for (const devId of await getDeveloperIds()) {
		client.users.fetch(devId).then((user) => {
			const date = new Date();
			user.send({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error Log: Message Update Event')
						.setDescription(e instanceof Error ? e.message : String(e))
						.addFields({
							name: 'Stack Trace',
							value: codeBlock(
								e instanceof Error
									? e.stack || 'No stack trace available'
									: 'Not an error object'
							)
						})
						.addFields({
							name: 'Old Message',
							value: codeBlock(
								oldMessage
									? JSON.stringify(oldMessage, undefined, 2)
									: 'undefined'
							)
						})
						.addFields({
							name: 'New Message',
							value: codeBlock(JSON.stringify(newMessage, undefined, 2))
						})
						.addFields({
							name: 'ISO 8601 Timestamp',
							value: date.toISOString()
						})
						.addFields({
							name: 'Localized DateTime',
							value: time(date, TimestampStyles.LongDateTime)
						})
						.setColor(0xff00ff)
						.setTimestamp()
				]
			});
		});
	}
	console.error(e);
}
