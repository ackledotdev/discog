import {
	BaseGuildTextChannel,
	EmbedBuilder,
	Events,
	GuildMember,
	userMention
} from 'discord.js';
import { getGuildGreetingData } from './a.getGuildConf';
export const name = Events.GuildMemberAdd;
export const once = false;

export const execute = async (member: GuildMember) => {
	const config = await getGuildGreetingData(member.guild);
	if (!config?.welcomeEnabled) return;
	await (
		(await member.guild.channels.fetch(
			config.channel
		)) as BaseGuildTextChannel | null
	)?.send({
		embeds: [
			new EmbedBuilder()
				.setTitle('Member Joined')
				.setDescription(
					`${userMention(member.id)}\nNow at ${
						(await member.guild.fetch()).memberCount
					} members`
				)
				.setColor(0x00ff00)
				.setTimestamp()
				.setFooter({
					iconURL: member.guild.members.me?.displayAvatarURL(),
					text: 'Powered by DisCog'
				})
		]
	});
};
