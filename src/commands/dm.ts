import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	userMention
} from 'discord.js';
import { CommandHelpEntry } from '../struct/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('dm')
	.setDescription('Send an official server message to a user via DMs')
	.addUserOption(option => {
		return option
			.setName('user')
			.setDescription('The target user')
			.setRequired(true);
	})
	.addStringOption(option => {
		return option
			.setName('message')
			.setDescription('The message to send')
			.setRequired(true);
	})
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const help = new CommandHelpEntry(
	'dm',
	'Sends an official server message to a user via DMs',
	'<user: user> <message: string>'
);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.reply({ content: 'Working...', ephemeral: true });
	const admin = interaction.member as GuildMember,
		dm = await interaction.options.getUser('user', true).createDM();
	await dm.send({
		embeds: [
			new EmbedBuilder()
				.setTitle('Server DM')
				.setDescription(
					'You have recieved an official server message from a server moderator/administrator.'
				)
				.addFields(
					{ name: 'Server Name:', value: admin.guild.name },
					{
						name: 'Sent by:',
						value: `${admin.user.username} (${userMention(admin.user.id)})`
					},
					{
						name: 'Message',
						value: interaction.options.getString('message') as string
					}
				)
				.setFooter({
					iconURL: interaction.client.user.displayAvatarURL(),
					text: 'Powered by DisCog'
				})
		]
	});
	await interaction.editReply('Done.');
};
