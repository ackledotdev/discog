import {
	EmbedBuilder,
	Events,
	Message,
	channelMention,
	userMention
} from 'discord.js';
import { getGuildAuditLoggingChannel } from './a.getGuildConf';
export const name = Events.MessageUpdate;
export const once = false;

export const execute = async (old: Message, updated: Message) => {
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
				.addFields(
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
};
