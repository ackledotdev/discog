import 'dotenv/config';

import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ContextMenuCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	ModalSubmitInteraction,
	Role,
	StringSelectMenuInteraction,
	UserContextMenuCommandInteraction,
	channelMention,
	codeBlock,
	parseEmoji,
	roleMention,
	time
} from 'discord.js';
import chunk from 'lodash.chunk';
import { format } from 'prettier';
import {
	clearReactionRoleStash,
	createReactionRoleStash,
	getReactionRoleStash
} from './lib/redis/utils';

export const InteractionHandlers = {
	async Button(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('reactionroles:multiple:overwrite')) {
			if (interaction.user.id !== interaction.customId.split(':')[3])
				return await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Access Denied')
							.setDescription(
								'You are not the owner of this reaction role draft.'
							)
							.setColor(0xff0000)
					],
					flags: MessageFlags.Ephemeral
				});

			await interaction.deferReply();

			await createReactionRoleStash(
				interaction.guildId!,
				interaction.user.id,
				true
			);

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Empty Reaction Role Draft Created')
						.setDescription(
							'Set your channel, add roles, and send your message when ready!\nSee `/coghelp reactionroles` for more information.'
						)
				]
			});
		}

		if (interaction.customId.startsWith('reactionroles:multiple:send')) {
			if (interaction.user.id !== interaction.customId.split(':')[3])
				return await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Access Denied')
							.setDescription(
								'You are not the owner of this reaction role draft.'
							)
							.setColor(0xff0000)
					],
					flags: MessageFlags.Ephemeral
				});

			await interaction.deferReply();

			const stash = await getReactionRoleStash(
				interaction.guildId!,
				interaction.user.id
			);

			if (!stash)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error: No Reaction Role Draft Found')
							.setDescription(
								'You do not have a reaction role draft to send. Create one with the `/reactionroles multiple create` command.'
							)
							.setColor(0xff0000)
					]
				});

			const { channelId, message, roles } = stash;

			if (!channelId)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error: No Channel Set')
							.setDescription(
								'You have not set a channel for this reaction role draft. Please set a channel with the `/reactionroles multiple setchannel` command and try again.'
							)
							.setColor(0xff0000)
					]
				});

			if (!message)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error: No Message Set')
							.setDescription(
								'You have not set a message for this reaction role draft. Please set a message with the `/reactionroles multiple setmessage` command and try again.'
							)
							.setColor(0xff0000)
					]
				});

			if (!roles || roles.length === 0)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error: No Roles Set')
							.setDescription(
								'You have not added any roles to this reaction role draft. Please add some roles with the `/reactionroles multiple addrole` command and try again.'
							)
							.setColor(0xff0000)
					]
				});

			const channel = await interaction.guild!.channels.fetch(channelId);
			if (!channel)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error: Channel Not Found')
							.setDescription(
								'The channel you set for this reaction role draft could not be found. Please set a valid channel with the `/reactionroles multiple setchannel` command and try again.'
							)
							.setColor(0xff0000)
					]
				});
			if (!(channel instanceof BaseGuildTextChannel))
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Invalid Channel Type')
							.setDescription('The specified channel is not a text channel.')
							.setColor(0xff0000)
					]
				});

			const fakeRoles = [];
			const higherRoles = [];
			const roleCache: Role[] = [];
			for (const { roleId } of roles) {
				const role = await interaction.guild!.roles.fetch(roleId);
				if (!role) fakeRoles.push(roleId);
				/**
				 * Role.comparePositionTo(role: RoleResolvable): number
				 * Compares this role's position to another role's.
				 * Negative number if this role's position is lower (other role's is higher),
				 * positive number if this one is higher (other's is lower), 0 if equal
				 */ else if (
					interaction.guild!.members.me!.roles.highest.comparePositionTo(
						role
					) <= 0
				)
					higherRoles.push(roleId);
				else roleCache.push(role);
			}
			if (fakeRoles.length > 0 || higherRoles.length > 0) {
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error: Invalid Roles')
							.setDescription(
								`The following roles are invalid or higher than the bot's highest role:\n${[
									...fakeRoles.map((r) => `- ${r} (not found)`),
									...higherRoles.map(
										(r) => `- ${r} (higher than bot's highest role)`
									)
								].join('\n')}`
							)
							.setColor(0xff0000)
					]
				});
			}

			try {
				const btns = [];
				for (const { emoji, roleId } of roles) {
					const parsedEmoji = emoji ? parseEmoji(emoji) : null;
					const role = roleCache.find((r) => r.id === roleId)!;
					const btn = new ButtonBuilder()
						.setCustomId(`reactionrole:${role.id}`)
						.setLabel(role.name)
						.setStyle(ButtonStyle.Primary);
					btns.push(
						parsedEmoji
							? btn.setEmoji(parsedEmoji?.id ?? parsedEmoji?.name)
							: btn
					);
				}

				const chunks = chunk(btns, 5);

				const sentReactionRoleMessage = await channel.send({
					content: message,
					components: chunks.map((chunk) =>
						new ActionRowBuilder<ButtonBuilder>().addComponents(chunk)
					)
				});

				clearReactionRoleStash(interaction.guildId!, interaction.user.id);

				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Success')
							.setDescription(`${sentReactionRoleMessage.url}\nMessage sent.`)
							.setColor(0x00ff00)
					]
				});
			} catch (error) {
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error')
							.setDescription(
								`Failed to send message in ${channelMention(channel.id)}.`
							)
							.setColor(0xff0000)
					]
				});
			}
		}

		if (interaction.customId.startsWith('reactionroles:multiple:clear')) {
			if (interaction.user.id !== interaction.customId.split(':')[3])
				return await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Access Denied')
							.setDescription(
								'You are not the owner of this reaction role draft.'
							)
							.setColor(0xff0000)
					],
					flags: MessageFlags.Ephemeral
				});

			await interaction.deferReply();

			await clearReactionRoleStash(interaction.guildId!, interaction.user.id);

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Reaction Role Draft Cleared')
						.setDescription(
							'Your reaction role draft has been cleared. You can create a new one with the `/reactionroles multiple create` command.'
						)
				]
			});
		}

		if (interaction.customId.startsWith('reactionrole:')) {
			await interaction.deferReply({
				flags: MessageFlags.Ephemeral
			});

			if (!interaction.inGuild() || !interaction.guild || !interaction.member)
				return await interaction.editReply(
					'Error: cannot assign role; not in guild.'
				);

			const roleId = interaction.customId.split(':')[1];
			const role = interaction.guild.roles.fetch(roleId);
			if (!role)
				return await interaction.editReply(
					'Error: cannot assign role; role not found.'
				);

			const member = await interaction.guild.members.fetch(interaction.user.id);
			if (!member.manageable)
				return await interaction.editReply(
					'Error: cannot assign role; you are hierarchially superior to this bot.'
				);

			let added = false;
			try {
				if (member.roles.cache.has(roleId)) await member.roles.remove(roleId);
				else {
					await member.roles.add(roleId);
					added = true;
				}

				await interaction.editReply(
					`Successfully ${added ? 'added' : 'removed'} role ${roleMention(roleId)}.`
				);
			} catch (error) {
				return await interaction.editReply(
					'Error: cannot assign role; an error occurred.'
				);
			}
		}

		/**
			if (interaction.customId === '/admin_channel_clear') {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
				return;
			}
		*/
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

	async StringSelectMenu(interaction: StringSelectMenuInteraction) {
		switch (interaction.customId) {
		}
	}
};
