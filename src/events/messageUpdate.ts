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
import { getGuildAuditLoggingChannel } from './a.getGuildConf';
export const name = Events.MessageUpdate;
export const once = false;

import { DatabaseKeys, DENO_KV_URL } from '../config';
import { openKv } from '@deno/kv';
import { Snowflake, TimestampStyles } from 'discord.js';

export const execute = async (oldMessage: Message, newMessage: Message) => {
	try {
		if (
			oldMessage.author.bot ||
			!oldMessage.inGuild() ||
			newMessage.author.bot ||
			!newMessage.inGuild() ||
			oldMessage.content === newMessage.content // Discord seems to send an update event for every embed update, so we need to filter out those
		)
			return;
		await (
			await getGuildAuditLoggingChannel(newMessage.guild)
		)?.send({
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
		await sendError(newMessage.client, e as Error);
	}

	async function sendError(client: Client, e: Error) {
		for (const devId of (
			await (await openKv(DENO_KV_URL)).get<Snowflake[]>([DatabaseKeys.Devs])
		)?.value ?? []) {
			client.users.fetch(devId).then(user => {
				const date = new Date();
				user.send({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error Log: Message Update Event')
							.setDescription(e.message)
							.addFields({
								name: 'Stack Trace',
								value: codeBlock(e.stack ?? '')
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
};
