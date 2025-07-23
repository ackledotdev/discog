import {
	EmbedBuilder,
	Events,
	Message,
	channelMention,
	userMention
} from 'discord.js';
import { getGuildAuditLoggingChannel } from './a.getGuildConf';
export const name = Events.MessageDelete;
export const once = false;

export const execute = async (message: Message) => {
	if (message.author.bot || !message.inGuild()) return;
	await (
		await getGuildAuditLoggingChannel(message.guild)
	)?.send({
		embeds: [
			new EmbedBuilder()
				.setTitle('Message Deleted')
				.setDescription(message.content)
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
		]
	});
};
