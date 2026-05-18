import {
	BaseGuildTextChannel,
	ChannelType,
	EmbedBuilder,
	Events,
	GuildChannel,
	OverwriteType,
	StageChannel,
	VideoQualityMode,
	VoiceChannel,
	channelMention,
	roleMention,
	userMention
} from 'discord.js';
import { getGuildAuditLogChannelId } from '../lib/redis';

export const name = Events.ChannelDelete;
export const once = false;

export const execute = async (channel: GuildChannel) => {
	const auditLogChannelId = await getGuildAuditLogChannelId(channel.guild.id);
	if (!auditLogChannelId) return;

	const auditLogChannel = await channel.guild.channels.fetch(auditLogChannelId);
	if (!auditLogChannel || !auditLogChannel.isTextBased()) return;

	const embed = new EmbedBuilder()
		.setTitle('Channel Deleted')
		.setDescription(channelMention(channel.id))
		.setFields(
			{
				name: 'Channel Type',
				value: ChannelType[channel.type]
			},
			{
				name: 'Permissions',
				value: channel.permissionOverwrites.cache
					.map(
						(overwrite) =>
							`${
								overwrite.type === OverwriteType.Role
									? roleMention(overwrite.id)
									: userMention(overwrite.id)
							}\n${overwrite.allow.toArray().join(', ')} \n${overwrite.deny
								.toArray()
								.join(', ')}`
					)
					.join('\n')
			}
		)
		.setTimestamp()
		.setColor(0xff0000)
		.setFooter({
			iconURL: channel.guild.members.me?.displayAvatarURL(),
			text: 'Powered by DisCog'
		});
	if (channel instanceof BaseGuildTextChannel) {
		embed.addFields(
			{
				name: 'Slowmode Rate Limit',
				value: channel.rateLimitPerUser?.toString() ?? 'None'
			},
			{
				name: 'Topic',
				value: channel.topic ?? 'None'
			},
			{
				name: 'NSFW',
				value: channel.nsfw ? 'Yes' : 'No'
			}
		);
	}
	if (channel instanceof VoiceChannel || channel instanceof StageChannel) {
		embed.addFields(
			{
				name: 'User Limit',
				value: channel.userLimit.toString()
			},
			{
				name: 'Video Quality',
				value: channel.videoQualityMode
					? VideoQualityMode[channel.videoQualityMode]
					: 'Unset'
			},
			{
				name: 'RTC Region',
				value: channel.rtcRegion ?? 'Auto'
			},
			{
				name: 'Bitrate',
				value: channel.bitrate.toString()
			}
		);
	}
	await auditLogChannel.send({
		embeds: [embed]
	});
};
