import {
	Client,
	EmbedBuilder,
	Events,
	Message,
	channelMention,
	codeBlock,
	userMention
} from 'discord.js';
import { getGuildAuditLoggingChannel } from './a.getGuildConf';
export const name = Events.MessageUpdate;
export const once = false;

import { DatabaseKeys, DENO_KV_URL } from '../config';
import { openKv } from '@deno/kv';
import { Snowflake, TimestampStyles } from 'discord.js';

export const execute = async (old: Message, updated: Message) => {
	try {
		if (
			old.author.bot ||
			!old.inGuild() ||
			updated.author.bot ||
			!updated.inGuild() ||
			old.content === updated.content // Discord seems to send an update event for every embed update, so we need to filter out those
		)
			return;
		await (
			await getGuildAuditLoggingChannel(updated.guild)
		)?.send({
			embeds: [
				new EmbedBuilder()
					.setTitle('Message Updated')
					.setDescription(updated.url)
					.setFields(
						{
							name: 'Author',
							value: userMention(updated.author.id)
						},
						{
							name: 'Channel',
							value: channelMention(updated.channel.id)
						},
						{
							name: 'Message ID',
							value: updated.id
						},
						{
							name: 'Initial Content',
							value: old.content
						},
						{
							name: 'Updated Content',
							value: updated.content
						}
					)
					.setColor(0x0000ff)
					.setTimestamp()
					.setFooter({
						iconURL: updated.guild.members.me?.displayAvatarURL(),
						text: 'Powered by DisCog'
					})
			]
		});
	} catch (e) {
		await sendError(updated.client, e);
	}
};

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
						.addFields({ name: 'Stack Trace', value: codeBlock(e.stack ?? '') })
						.addFields({
							name: 'Old Message',
							value: codeBlock(JSON.stringify(old, undefined, 2))
						})
						.addFields({
							name: 'New Message',
							value: codeBlock(JSON.stringify(updated, undefined, 2))
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
