import { EmbedBuilder, Events, GuildBan, inlineCode, userMention } from 'discord.js';
import { getGuildAuditLogChannelId } from '../lib/redis';

export const name = Events.GuildBanAdd;
export const once = false;

export const execute = async (ban: GuildBan) => {
	const auditLogChannelId = await getGuildAuditLogChannelId(ban.guild.id);
	if (!auditLogChannelId) return;

	const auditLogChannel = await ban.guild.channels.fetch(auditLogChannelId);
	if (!auditLogChannel || !auditLogChannel.isTextBased()) return;

	if (ban.guild.systemChannel)
		await ban.guild.systemChannel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle('Ban Created')
					.setFields(
						{
							name: 'User',
							value: `${ban.user.username} (${userMention(ban.user.id)})`
						},
						{
							name: 'Reason',
							value: ban.reason || inlineCode('No reason provided')
						}
					)
					.setColor(0x00ff00)
					.setTimestamp()
					.setFooter({
						iconURL: ban.guild.members.me?.displayAvatarURL(),
						text: 'Powered by DisCog'
					})
			]
		});
};
