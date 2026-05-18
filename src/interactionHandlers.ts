import 'dotenv/config';

import {
	ButtonInteraction,
	ContextMenuCommandInteraction,
	EmbedBuilder,
	ModalSubmitInteraction,
	PermissionFlagsBits,
	StringSelectMenuInteraction,
	UserContextMenuCommandInteraction,
	codeBlock,
	inlineCode,
	time,
	userMention
} from 'discord.js';
import { format } from 'prettier';
import { logger } from './logger';
import { getDeveloperIds } from './lib/redis';

export const InteractionHandlers = {
	async Button(interaction: ButtonInteraction) {
		switch (interaction.customId) {
			case '/admin_channel_clear': {
				await interaction.deferReply({ ephemeral: true });
				if (
					!interaction.inGuild() ||
					!interaction.guild ||
					!interaction.channel
				) {
					await interaction.editReply(
						'Error: cannot clear this channel.\nCause: not in guild.'
					);
					return;
				}
				const channel = interaction.channel;
				if (
					!channel ||
					channel.isDMBased() ||
					channel.isVoiceBased() ||
					!channel.isTextBased() ||
					channel.isThread()
				)
					await interaction.editReply(
						'Error: cannot clear this channel.\nCause may be insufficient permissions or invalid channel type.'
					);
				else {
					for (const [, message] of await channel.messages.fetch()) {
						await message.delete();
					}
				}
				await interaction.editReply('Deleted all messages in this channel.');
				break;
			}
		}
	},

	ContextMenu: {
		async Message(interaction: ContextMenuCommandInteraction) {
			switch (interaction.commandName) {
			}
		},

		async User(interaction: UserContextMenuCommandInteraction) {
			switch (interaction.commandName) {
				case 'User Info': {
					const infouser = await interaction.targetUser.fetch(true);
					const mutfields = [];
					if (interaction.guild && interaction.targetMember) {
						mutfields.push({
							name: 'Server join date',
							value: time(
								(await interaction.guild.members.fetch(interaction.targetId))
									.joinedAt || undefined
							)
						});
					}
					await interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setColor(infouser.hexAccentColor || null)
								.setTitle(`Who is ${infouser.tag}?`)
								.setThumbnail(infouser.displayAvatarURL())
								.addFields(
									{ name: 'ID:', value: infouser.id },
									{
										name: 'Discord join date:',
										value: time(infouser.createdAt)
									},
									{ name: 'Is bot?', value: infouser.bot.toString() }
								)
								.setTimestamp()
								.setFooter({
									iconURL: interaction.client.user.displayAvatarURL(),
									text: 'Powered by DisCog'
								})
								.addFields(mutfields)
						]
					});
					break;
				}
				case 'User JSON':
					await interaction.reply(
						codeBlock(
							await format(JSON.stringify(interaction.targetUser.toJSON()), {
								parser: 'json5',
								tabWidth: 2,
								useTabs: false
							})
						)
					);
			}
		}
	},

	async ModalSubmit(interaction: ModalSubmitInteraction) {
		switch (interaction.customId) {
		}
	},

	async StringSelectMenu(interaction: StringSelectMenuInteraction) {}
};
