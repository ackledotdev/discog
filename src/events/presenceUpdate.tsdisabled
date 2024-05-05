import {
	Activity,
	ActivityType,
	EmbedBuilder,
	Events,
	Guild,
	GuildMember,
	Presence,
	userMention
} from 'discord.js';
import { getGuildAuditLoggingChannel } from './a.getGuildConf';
import { Writable } from '../struct/discord/types';

export const name = Events.PresenceUpdate;
export const once = false;
export const execute = async (before: Presence, after: Presence) => {
	let guild: Guild;
	if (before.guild) guild = before.guild;
	else if (after.guild) guild = after.guild;
	else return;

	const channel = getGuildAuditLoggingChannel(guild);
	if (!channel || before.equals(after)) return;

	let member: GuildMember;
	if (before.member) member = before.member;
	else if (after.member) member = after.member;
	else return;

	const embed = new EmbedBuilder()
		.setTitle('Presence Updated')
		.setDescription(`${userMention(member.id)}`)
		.setColor(0xffff00)
		.setTimestamp()
		.setThumbnail(member.displayAvatarURL())
		.setFooter({
			iconURL: guild.members.me?.displayAvatarURL(),
			text: 'Powered by DisCog'
		});
	const diff = getDifferentElements(before.activities, after.activities);
	embed.addFields({
		name: 'Activities',
		value: `**Removed:** ${diff.removed
			.map(
				activity =>
					`${getActivityTypeText(activity)} ${activity.name}${
						activity.details ? ` (${activity.details})` : ''
					}`
			)
			.join('\n')}\n\n**Added:** ${diff.added
			.map(
				activity =>
					`${getActivityTypeText(activity)} ${activity.name}${
						activity.details ? ` (${activity.details})` : ''
					}`
			)
			.join('\n')}`
	});
};

function getActivityTypeText(activity: Activity) {
	switch (activity.type) {
		case ActivityType.Playing:
			return 'Playing';
		case ActivityType.Streaming:
			return 'Streaming';
		case ActivityType.Listening:
			return 'Listening to';
		case ActivityType.Watching:
			return 'Watching';
		case ActivityType.Custom:
			return activity.emoji;
		case ActivityType.Competing:
			return 'Competing in';
		default:
	}
}

function getDifferentElements<T>(before: T[], after: T[]) {
	const beforeCopy = before as Writable<T[]>;
	const afterCopy = after as Writable<T[]>;
	for (const element of before) {
		if (afterCopy.includes(element)) {
			beforeCopy.splice(beforeCopy.indexOf(element), 1);
			afterCopy.splice(afterCopy.indexOf(element), 1);
		}
	}
	return {
		removed: beforeCopy,
		added: afterCopy
	};
}
