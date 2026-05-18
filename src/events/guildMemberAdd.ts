import { EmbedBuilder, Events, GuildMember, userMention } from 'discord.js';
import { getGuildGreetingsConfig } from '../lib/redis';

export const name = Events.GuildMemberAdd;
export const once = false;

export const execute = async (member: GuildMember) => {
	const greetingsConfig = await getGuildGreetingsConfig(member.guild.id);
	if (!greetingsConfig.welcomeEnabled || !greetingsConfig.channel) return;

	const channel = await member.guild.channels.fetch(greetingsConfig.channel);
	if (!channel || !channel.isTextBased()) return;

	await channel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle('Member Joined')
				.setDescription(
					`${userMention(member.id)}\nNow at ${(await member.guild.fetch()).memberCount} members`
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
