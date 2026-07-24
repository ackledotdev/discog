import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	InteractionContextType,
	parseEmoji,
	PermissionFlagsBits,
	roleMention,
	SlashCommandBuilder
} from 'discord.js';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('reactionroles')
	.setDescription('Manage reaction roles')
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

	.addSubcommand((sub) => {
		return sub
			.setName('single')
			.setDescription('Create a single reaction role')
			.addChannelOption((opt) => {
				return opt
					.setName('channel')
					.setDescription('Channel to send the message in')
					.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
					.setRequired(true);
			})
			.addRoleOption((opt) => {
				return opt
					.setName('role')
					.setDescription('Role to assign')
					.setRequired(true);
			})
			.addStringOption((opt) => {
				return opt
					.setName('emoji')
					.setDescription('Emoji to react with')
					.setRequired(true);
			})
			.addStringOption((opt) => {
				return opt
					.setName('message')
					.setDescription('Message text')
					.setRequired(true);
			});
	});

export const help = new CommandHelpEntry(
	'reactionroles',
	'Manage reaction roles',
	'single <channel> <role> <emoji> <message>'
);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		ephemeral: true
	});

	const subcommand = interaction.options.getSubcommand(true);
	if (subcommand === 'single') {
		const role = interaction.options.getRole('role', true);
		const emojiOpt = interaction.options.getString('emoji', true);
		const message = interaction.options.getString('message', true);
		const channel = interaction.options.getChannel('channel', true);

		/**
		 * RoleManager.comparePositions(role1: RoleResolvablerole2: RoleResolvable): number
		 * Compares the positions of two roles.
		 * Returns: Negative number if the first role's position is lower (second role's is higher),
		 * positive number if the first's is higher (second's is lower), 0 if equal
		 */

		// Test if bot is below target role
		if (
			interaction.guild!.roles.comparePositions(
				interaction.guild!.members.me!.roles.highest,
				role.id
			) <= 0
		)
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error')
						.setDescription(
							`${roleMention(role.id)} cannot be assigned because it is higher than this bot's highest role.`
						)
						.setColor(0xff0000)
				]
			});

		if (!(channel instanceof BaseGuildTextChannel))
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error')
						.setDescription('The specified channel is not a text channel.')
						.setColor(0xff0000)
				]
			});

		const emoji = parseEmoji(emojiOpt);
		if (!emoji)
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error')
						.setDescription('The specified emoji is not valid.')
						.setColor(0xff0000)
				]
			});

		await channel.send({
			content: message,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`reactionrole:${role.id}`)
						.setLabel(role.name)
						.setStyle(ButtonStyle.Primary)
						.setEmoji(emoji)
				)
			]
		});
	}
};
