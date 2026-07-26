import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonStyle,
	channelMention,
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	formatEmoji,
	InteractionContextType,
	MessageFlags,
	parseEmoji,
	PermissionFlagsBits,
	resolvePartialEmoji,
	roleMention,
	SlashCommandBuilder,
	Snowflake
} from 'discord.js';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';
import {
	addReactionRoleStashRole,
	createReactionRoleStash,
	getReactionRoleStash,
	getReactionRoleStashRoleCount,
	removeReactionRoleStashRole,
	setReactionRoleStashChannel,
	setReactionRoleStashMessage
} from '../lib/redis';

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
					.setName('message')
					.setDescription('Message text')
					.setRequired(true);
			})
			.addStringOption((opt) => {
				return opt
					.setName('emoji')
					.setDescription('Associated emoji')
					.setRequired(false);
			});
	})

	.addSubcommandGroup((group) => {
		return group
			.setName('multiple')
			.setDescription('Manage multiple reaction roles in one message')
			.addSubcommand((sub) => {
				return sub
					.setName('create')
					.setDescription('Create a new multiple reaction role message');
			})
			.addSubcommand((sub) => {
				return sub
					.setName('channel')
					.setDescription(
						'Set the channel for the multiple reaction role message'
					)
					.addChannelOption((opt) => {
						return opt
							.setName('channel')
							.setDescription('Channel to send the message in')
							.addChannelTypes(
								ChannelType.GuildText,
								ChannelType.GuildAnnouncement
							)
							.setRequired(true);
					});
			})
			.addSubcommand((sub) => {
				return sub
					.setName('message')
					.setDescription('Set the message text')
					.addStringOption((opt) => {
						return opt
							.setName('message')
							.setDescription('Message text')
							.setRequired(true);
					});
			})
			.addSubcommand((sub) => {
				return sub
					.setName('addrole')
					.setDescription(
						'Add a reaction role to the multiple reaction role message'
					)
					.addRoleOption((opt) => {
						return opt
							.setName('role')
							.setDescription('Role to assign')
							.setRequired(true);
					})
					.addStringOption((opt) => {
						return opt
							.setName('emoji')
							.setDescription('Associated emoji')
							.setRequired(false);
					});
			})
			.addSubcommand((sub) => {
				return sub
					.setName('removerole')
					.setDescription(
						'Remove a reaction role from the multiple reaction role message'
					)
					.addRoleOption((opt) => {
						return opt
							.setName('role')
							.setDescription('Role to remove')
							.setRequired(true);
					});
			})
			.addSubcommand((sub) => {
				return sub
					.setName('show')
					.setDescription(
						'List all reaction roles in the multiple reaction role message'
					);
			})
			.addSubcommand((sub) => {
				return sub
					.setName('send')
					.setDescription('Send the multiple reaction role message');
			})
			.addSubcommand((sub) => {
				return sub
					.setName('clear')
					.setDescription('Clear the stored multiple reaction role data');
			});
	});

export const help = new CommandHelpEntry(
	'reactionroles',
	'Manage reaction roles',
	'single <channel> <role> <emoji> <message>',
	'multiple create',
	'multiple channel <channel>',
	'multiple message <message>',
	'multiple addrole <role> <emoji>',
	'multiple removerole <role>',
	'multiple show',
	'multiple send',
	'multiple clear'
);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const subcommandGroup = interaction.options.getSubcommandGroup(false);
	const subcommand = interaction.options.getSubcommand(true);

	await interaction.deferReply({
		flags: subcommandGroup === 'multiple' ? undefined : MessageFlags.Ephemeral
	});

	if (subcommandGroup === 'multiple') {
		if (subcommand === 'create') {
			const stash = await getReactionRoleStash(
				interaction.guildId!,
				interaction.user.id
			);
			if (stash)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Confirm Overwrite')
							.setDescription(
								'You already have a reaction role draft stashed. Creating a new one will overwrite it. Do you want to continue?'
							)
							.setColor(0xffa500)
							.setFields(
								{
									name: 'Message',
									value: stash.message || 'Unset',
									inline: false
								},
								{
									name: 'Channel',
									value: stash.channelId
										? channelMention(stash.channelId)
										: 'Unset',
									inline: false
								},
								...stash.roles.map(({ emoji, roleId }) => ({
									name: emoji || 'No Emoji',
									value: roleMention(roleId),
									inline: true
								}))
							)
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId(
									`reactionroles:multiple:overwrite:${interaction.user.id}`
								)
								.setLabel('Overwrite')
								.setStyle(ButtonStyle.Danger)
						)
					]
				});
			else {
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
		}

		if (subcommand === 'channel') {
			const channel = interaction.options.getChannel('channel', true);

			if (!(channel instanceof BaseGuildTextChannel))
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error')
							.setDescription('The specified channel is of an invalid type.')
							.setColor(0xff0000)
					]
				});

			if (
				!channel
					.permissionsFor(interaction.guild!.members.me!)
					.has(PermissionFlagsBits.SendMessages)
			)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error')
							.setDescription(
								`The bot cannot send messages in ${channelMention(channel.id)}.`
							)
							.setColor(0xff0000)
					]
				});

			await setReactionRoleStashChannel(
				interaction.guildId!,
				interaction.user.id,
				channel.id
			);

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Channel Set')
						.setDescription(
							`The reaction role message will be sent in ${channelMention(
								channel.id
							)}.`
						)
				]
			});
		}

		if (subcommand === 'message') {
			const message = interaction.options.getString('message', true);

			await setReactionRoleStashMessage(
				interaction.guildId!,
				interaction.user.id,
				message
			);

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder().setTitle('Message Set').setDescription(message)
				]
			});
		}

		if (subcommand === 'addrole') {
			const role = interaction.options.getRole('role', true);
			const emojiOpt = interaction.options.getString('emoji', false);
			const emoji = emojiOpt ? parseEmoji(emojiOpt) : undefined;

			if (
				emoji === null ||
				(emoji &&
					!emoji.id &&
					!/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+$/u.test(
						emoji.name
					))
			)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Error')
							.setDescription(
								`The specified emoji \`${emojiOpt}\` is not valid.`
							)
							.setColor(0xff0000)
					]
				});

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
							.setTitle('Role Cannot Be Assigned')
							.setDescription(
								`${roleMention(role.id)} cannot be assigned because it is higher than this bot's highest role.`
							)
							.setColor(0xff0000)
					]
				});

			const currentRoleCount = await getReactionRoleStashRoleCount(
				interaction.guildId!,
				interaction.user.id
			);

			if (currentRoleCount >= 20)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Maximum Role Limit Reached')
							.setDescription(
								'You cannot add more than 20 roles to a single reaction role message.'
							)
							.setColor(0xff0000)
					]
				});

			const formattedEmoji = emoji
				? emoji.id
					? formatEmoji(emoji.id)
					: `${emoji.name}`
				: null;

			const wasItAddedOrWasItAlreadyThereTrueOrFalseRespectively =
				await addReactionRoleStashRole(
					interaction.guildId!,
					interaction.user.id,
					formattedEmoji,
					role.id
				);

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Role Added')
						.setDescription(
							wasItAddedOrWasItAlreadyThereTrueOrFalseRespectively
								? `Added ${roleMention(role.id)} ${formattedEmoji ? `with emoji ${formattedEmoji}` : ''} to the reaction role draft.`
								: `The role ${roleMention(role.id)} is already in the reaction role draft.`
						)
				]
			});
		}

		if (subcommand === 'removerole') {
			const role = interaction.options.getRole('role', true);

			const wasItRemovedOrWasItJustNotThereTrueOrFalseRespectively =
				await removeReactionRoleStashRole(
					interaction.guildId!,
					interaction.user.id,
					role.id
				);

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Role Removed')
						.setDescription(
							wasItRemovedOrWasItJustNotThereTrueOrFalseRespectively
								? `Removed ${roleMention(role.id)} from the reaction role draft.`
								: `The role ${roleMention(role.id)} was not found in the reaction role draft.`
						)
				]
			});
		}

		if (subcommand === 'show') {
			const stash = await getReactionRoleStash(
				interaction.guildId!,
				interaction.user.id
			);

			if (!stash)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('No Draft Found')
							.setDescription(
								'You do not have a reaction role draft. Use `/reactionroles multiple create` to start one.'
							)
							.setColor(0xff0000)
					]
				});

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Current Reaction Role Draft')
						.setDescription(stash.message || 'No message set')
						.setFields(
							{
								name: 'Channel',
								value: stash.channelId
									? channelMention(stash.channelId)
									: 'Unset',
								inline: false
							},
							...stash.roles.map(({ emoji, roleId }) => ({
								name: emoji || 'No Emoji',
								value: roleMention(roleId),
								inline: true
							}))
						)
				]
			});
		}

		if (subcommand === 'send') {
			const stash = await getReactionRoleStash(
				interaction.guildId!,
				interaction.user.id
			);

			if (!stash)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('No Draft Found')
							.setDescription(
								'You do not have a reaction role draft. Use `/reactionroles multiple create` to start one.'
							)
							.setColor(0xff0000)
					]
				});

			if (!stash.channelId)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Channel Not Set')
							.setDescription(
								'You must set a channel for the reaction role message before sending it. Use `/reactionroles multiple channel <channel>` to set it.'
							)
							.setColor(0xff0000)
					]
				});

			const channel = await interaction.guild!.channels.fetch(stash.channelId);

			if (!channel)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Channel Not Found')
							.setDescription(
								`The channel ${channelMention(stash.channelId)} could not be found. It may have been deleted. Please set a new channel using \`/reactionroles multiple channel <channel>\`.`
							)
							.setColor(0xff0000)
					]
				});

			if (!(channel instanceof BaseGuildTextChannel))
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Invalid Channel Type')
							.setDescription(
								`The specified channel ${channelMention(channel.id)} is not a text channel.`
							)
							.setColor(0xff0000)
					]
				});

			const { roles } = stash;
			const unassignableRoles: Snowflake[] = [];
			for (const { roleId } of roles) {
				const role = await interaction.guild!.roles.fetch(roleId);
				if (!role)
					return await interaction.editReply({
						embeds: [
							new EmbedBuilder()
								.setTitle('Role Not Found')
								.setDescription(
									`The role ${roleMention(roleId)} could not be found. It may have been deleted. Please remove it from the reaction role draft using \`/reactionroles multiple removerole <role>\`.`
								)
								.setColor(0xff0000)
						]
					});

				if (
					interaction.guild!.roles.comparePositions(
						interaction.guild!.members.me!.roles.highest,
						role.id
					) <= 0
				)
					unassignableRoles.push(roleId);
			}
			if (unassignableRoles.length > 0)
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Unassignable Roles Found')
							.setDescription(
								`The following roles cannot be assigned because they are higher than this bot's highest role:\n${unassignableRoles
									.map((roleId) => roleMention(roleId))
									.join(', ')}`
							)
							.setColor(0xff0000)
					]
				});

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Confirm Reaction Role Message Send')
						.setDescription(stash.message || 'No message set')
						.setFields(
							{
								name: 'Channel',
								value: channelMention(channel.id),
								inline: false
							},
							...stash.roles.map(({ emoji, roleId }) => ({
								name: emoji || 'No Emoji',
								value: roleMention(roleId),
								inline: true
							}))
						)
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`reactionroles:multiple:send:${interaction.user.id}`)
							.setLabel('Send')
							.setStyle(ButtonStyle.Success)
					)
				]
			});
		}

		if (subcommand === 'clear')
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Confirm Clear')
						.setDescription(
							'Are you sure you want to clear your reaction role draft? This action cannot be undone.'
						)
						.setColor(0xff0000)
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(
								`reactionroles:multiple:clear:${interaction.user.id}`
							)
							.setLabel('Clear Draft')
							.setStyle(ButtonStyle.Danger)
					)
				]
			});
	}

	if (subcommand === 'single') {
		const role = interaction.options.getRole('role', true);
		const emojiOpt = interaction.options.getString('emoji', false);
		const message = interaction.options.getString('message', true);
		const channel = interaction.options.getChannel('channel', true);

		/**
		 * Role.comparePositionTo(role: RoleResolvable): number
		 * Compares this role's position to another role's.
		 * Negative number if this role's position is lower (other role's is higher),
		 * positive number if this one is higher (other's is lower), 0 if equal
		 */
		if (
			interaction.guild!.roles.comparePositions(
				interaction.guild!.members.me!.roles.highest,
				role.id
			) <= 0
		)
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Role Cannot Be Assigned')
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
						.setTitle('Invalid Channel Type')
						.setDescription('The specified channel is not a text channel.')
						.setColor(0xff0000)
				]
			});

		const emoji = emojiOpt ? parseEmoji(emojiOpt) : undefined;
		if (
			emoji === null ||
			(emoji &&
				!emoji.id &&
				!/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+$/u.test(
					emoji.name
				))
		)
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Invalid Emoji')
						.setDescription(`The specified emoji \`${emojiOpt}\` is not valid.`)
						.setColor(0xff0000)
				]
			});

		try {
			const btn = new ButtonBuilder()
				.setCustomId(`reactionrole:${role.id}`)
				.setLabel(role.name)
				.setStyle(ButtonStyle.Primary);
			await channel.send({
				content: message,
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						emoji ? btn.setEmoji(emoji) : btn
					)
				]
			});

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Success')
						.setDescription(
							`Reaction role message sent in ${channelMention(channel.id)}.`
						)
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
};
