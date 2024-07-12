import {
	AuditLogEvent,
	BaseGuildTextChannel,
	BaseGuildVoiceChannel,
	DMChannel,
	EmbedBuilder,
	Events,
	ForumChannel,
	ForumLayoutType,
	GuildChannel,
	OverwriteType,
	PrivateThreadChannel,
	PublicThreadChannel,
	StageChannel,
	VideoQualityMode,
	channelMention,
	codeBlock,
	roleMention,
	userMention
} from 'discord.js';
import { BaseGuildConfig } from '../struct/database';
import { openKv } from '@deno/kv';
import { DENO_KV_URL, DatabaseKeys } from '../config';

export const name = Events.ChannelUpdate;
export const once = false;

const db = await openKv(DENO_KV_URL);

export const execute = async (
	before: DMChannel | GuildChannel,
	after: DMChannel | GuildChannel
) => {
	if (before instanceof DMChannel || after instanceof DMChannel) return;
	const config =
		(await db.get<BaseGuildConfig>([DatabaseKeys.GuildConfig, after.guild.id]))
			.value ?? {};
	if (!config.auditlog?.enabled || !config.auditlog?.channel) return;
	const auditlogChannel = after.guild.channels.cache.get(
		config.auditlog.channel
	);
	if (!auditlogChannel || !auditlogChannel.isTextBased()) return;

	const entry = (
		await after.guild.fetchAuditLogs({
			limit: 1,
			type: AuditLogEvent.ChannelUpdate
		})
	).entries.first();

	const embed = new EmbedBuilder()
		.setTitle('Channel Updated')
		.setDescription(channelMention(after.id))
		.setTimestamp()
		.setColor(0xffff00)
		.setFooter({
			iconURL: after.guild.members.me?.displayAvatarURL(),
			text: 'Powered by DisCog'
		})
		.setFields(
			entry?.executor
				? [
						{
							name: 'Updated By',
							value: entry.executor.toString() ?? 'Unknown'
						}
					]
				: []
		);

	const differentProperties = getDifferentProperties(before, after);

	if (differentProperties.name)
		embed.addFields({
			name: 'Name',
			value: `\`${before.name}\` => \`${after.name}\``
		});

	if (
		after instanceof BaseGuildVoiceChannel &&
		before instanceof BaseGuildVoiceChannel
	) {
		const dp = differentProperties as Partial<BaseGuildVoiceChannel>;
		if (dp.userLimit)
			embed.addFields({
				name: 'User Limit',
				value: `\`${before.userLimit}\` => \`${after.userLimit}\``
			});
		if (dp.videoQualityMode)
			embed.addFields({
				name: 'Video Quality',
				value: `\`${
					before.videoQualityMode
						? VideoQualityMode[before.videoQualityMode]
						: 'Unset'
				}\` => \`${
					after.videoQualityMode
						? VideoQualityMode[after.videoQualityMode]
						: 'Unset'
				}\``
			});
		if (dp.rtcRegion)
			embed.addFields({
				name: 'RTC Region',
				value: `\`${before.rtcRegion ?? 'Auto'}\` => \`${
					after.rtcRegion ?? 'Auto'
				}\``
			});
		if (before instanceof StageChannel && after instanceof StageChannel) {
			const dp = differentProperties as Partial<StageChannel>;
			if (dp.rateLimitPerUser)
				embed.addFields({
					name: 'Slowmode Rate Limit',
					value: `\`${before.rateLimitPerUser}\` => \`${after.rateLimitPerUser}\``
				});
		}
	}
	if (
		before instanceof BaseGuildTextChannel &&
		after instanceof BaseGuildTextChannel
	) {
		const dp = differentProperties as Partial<BaseGuildTextChannel>;
		if (dp.rateLimitPerUser)
			embed.addFields({
				name: 'Slowmode Rate Limit',
				value: `\`${before.rateLimitPerUser}\` => \`${after.rateLimitPerUser}\``
			});
		if (after.isThread() && before.isThread()) {
			const dp = differentProperties as Partial<
				PrivateThreadChannel | PublicThreadChannel
			>;
			if (dp.archived)
				embed.addFields({
					name: 'Archived',
					value: `\`${before.archived}\` => \`${after.archived}\``
				});
			if (dp.autoArchiveDuration)
				embed.addFields({
					name: 'Auto Archive Duration',
					value: `\`${before.autoArchiveDuration}\` => \`${after.autoArchiveDuration}\``
				});
			if (dp.locked)
				embed.addFields({
					name: 'Locked',
					value: `\`${before.locked}\` => \`${after.locked}\``
				});
		}
	}
	if (before instanceof ForumChannel && after instanceof ForumChannel) {
		const dp = differentProperties as Partial<ForumChannel>;
		if (dp.availableTags)
			embed.addFields({
				name: 'Available Tags',
				value: `\`${before.availableTags.join(
					', '
				)}\` => \`${after.availableTags.join(', ')}\``
			});
		if (dp.defaultAutoArchiveDuration)
			embed.addFields({
				name: 'Default Auto Archive Duration',
				value: `\`${before.defaultAutoArchiveDuration}\` => \`${after.defaultAutoArchiveDuration}\``
			});
		if (dp.defaultForumLayout)
			embed.addFields({
				name: 'Default Forum Layout',
				value: `\`${ForumLayoutType[before.defaultForumLayout]}\` => \`${
					ForumLayoutType[after.defaultForumLayout]
				}\``
			});
		if (dp.defaultReactionEmoji)
			embed.addFields({
				name: 'Default Reaction Emoji',
				value: `\`${before.defaultReactionEmoji?.name ?? 'None'}\` => \`${
					after.defaultReactionEmoji?.name ?? 'None'
				}\``
			});
		if (dp.defaultThreadRateLimitPerUser)
			embed.addFields({
				name: 'Default Thread Rate Limit Per User',
				value: `\`${before.defaultThreadRateLimitPerUser ?? 'None'}\` => \`${
					after.defaultThreadRateLimitPerUser ?? 'None'
				}\``
			});
		if (dp.rateLimitPerUser)
			embed.addFields({
				name: 'Slowmode Rate Limit',
				value: `\`${before.rateLimitPerUser}\` => \`${after.rateLimitPerUser}\``
			});
	}

	if (entry?.changes) {
		embed.addFields({
			name: 'Permission Overwrites',
			value: `Before:\n${codeBlock(
				before.permissionOverwrites.cache
					.map(
						overwrite =>
							`Allowed: ${
								overwrite.type === OverwriteType.Role
									? roleMention(overwrite.id)
									: userMention(overwrite.id)
							}\nDenied: ${overwrite.allow
								.toArray()
								.join(', ')}\n${overwrite.deny.toArray().join(', ')}`
					)
					.join('\n')
			)}\n\nAfter:\n${codeBlock(
				after.permissionOverwrites.cache
					.map(
						overwrite =>
							`${
								overwrite.type === OverwriteType.Role
									? roleMention(overwrite.id)
									: userMention(overwrite.id)
							}\n${overwrite.allow.toArray().join(', ')} \n${overwrite.deny
								.toArray()
								.join(', ')}`
					)
					.join('\n')
			)}`
		});
	}

	await auditlogChannel.send({
		embeds: [embed]
	});
};

function getDifferentProperties(before: GuildChannel, after: GuildChannel) {
	return Object.entries(after).reduce((diff, [key, value]) => {
		if (before[key as keyof GuildChannel] != value) {
			// @ts-expect-error Properties are not read-only at creation
			diff[key as keyof GuildChannel] = value;
		}
		return diff;
	}, {} as Partial<GuildChannel>);
}
