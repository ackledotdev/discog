import {
	BaseGuildTextChannel,
	ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	channelMention,
	roleMention,
	userMention
} from 'discord.js';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';
import {
	clearAutoDelete,
	removeAutoDeleteEntriesOfChannel,
	setAutoDelete
} from '../lib/redis';

export const help = new CommandHelpEntry('admin', 'Admin commands');

export const data = new SlashCommandBuilder()
	.setName('admin')
	.setDescription('Automatically run admin tasks')
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(
		PermissionFlagsBits.ManageGuild |
			PermissionFlagsBits.ManageRoles |
			PermissionFlagsBits.ModerateMembers
	)

	.addSubcommandGroup((subcommandGroup) => {
		return subcommandGroup
			.setName('addrole')
			.setDescription('Add a role to users')
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('all')
					.setDescription('Add a role to all users')
					.addRoleOption((option) => {
						return option
							.setName('role')
							.setDescription('Role to add')
							.setRequired(true);
					});
			})

			.addSubcommand((subcommand) => {
				return subcommand
					.setName('humans')
					.setDescription('Add a role to all humans')
					.addRoleOption((option) => {
						return option
							.setName('role')
							.setDescription('Role to add')
							.setRequired(true);
					});
			})

			.addSubcommand((subcommand) => {
				return subcommand
					.setName('bots')
					.setDescription('Add a role to all bots')
					.addRoleOption((option) => {
						return option
							.setName('role')
							.setDescription('Role to add')
							.setRequired(true);
					});
			});
	})

	.addSubcommandGroup((subcommandGroup) => {
		return subcommandGroup
			.setName('channel')
			.setDescription('Manage channels')
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('autodelete')
					.setDescription('Configure auto-delete for a channel')
					.addChannelOption((option) => {
						return option
							.setName('channel')
							.setDescription('Channel to set auto-delete for')
							.setRequired(true);
					})
					.addIntegerOption((option) => {
						return option
							.setName('delay')
							.setDescription('Auto-delete delay in minutes (empty to disable)')
							.setRequired(false);
					})
					.addStringOption((option) => {
						return option
							.setName('matchmode')
							.setDescription('Match mode for auto-delete (empty to disable)')
							.setRequired(false)
							.addChoices(
								{ name: 'Contains', value: 'contains' },
								{ name: 'Starts with', value: 'startswith' },
								{ name: 'Ends with', value: 'endswith' }
							);
					})
					.addStringOption((option) => {
						return option
							.setName('matchpattern')
							.setDescription(
								'Pattern to match for auto-delete (empty to disable)'
							)
							.setRequired(false);
					});
			});
	});

// .addSubcommandGroup((subcommandGroup) => {
// 	return subcommandGroup
// 		.setName('channel')
// 		.setDescription('Manage channels')
// 		.addSubcommand((subcommand) => {
// 			return subcommand
// 				.setName('clear')
// 				.setDescription('Clear a channel')
// 				.addChannelOption((option) => {
// 					return option
// 						.setName('channel')
// 						.setDescription('Channel to clear')
// 						.setRequired(false);
// 				});
// 		})

// 		.addSubcommand((subcommand) => {
// 			return subcommand
// 				.setName('lock')
// 				.setDescription('Lock a channel')
// 				.addChannelOption((option) => {
// 					return option
// 						.setName('channel')
// 						.setDescription('Channel to lock')
// 						.setRequired(false);
// 				});
// 		});
// });

const handlers = {
	addrole: {
		all: async (interaction: ChatInputCommandInteraction) => {
			const bad = [],
				good = [],
				guild = interaction.guild!,
				role = interaction.options.getRole('role', true);
			for (const [, member] of (await guild.members.fetch())[
				Symbol.iterator
			]()) {
				if (member.manageable) {
					await member.roles.add(role.id);
					good.push(member);
				} else bad.push(member);
			}
			await interaction.editReply({
				allowedMentions: { parse: [] },
				content: `Added role ${roleMention(role.id)} to following users:\n${good
					.map((u) => userMention(u.id))
					.join(', ')}\nFailed to add role to following users:\n${bad
					.map((u) => userMention(u.id))
					.join(', ')}`
			});
		},

		bots: async (interaction: ChatInputCommandInteraction) => {
			if (!interaction.inGuild()) {
				await interaction.editReply(
					'Error: cannot add role to bots.\nCause: not in a guild.'
				);
				return;
			}
			const bad = [],
				good = [],
				guild = interaction.guild!,
				role = interaction.options.getRole('role', true);
			for (const [, member] of (await guild.members.fetch())[
				Symbol.iterator
			]()) {
				if (member.user.bot && member.manageable) {
					await member.roles.add(role.id);
					good.push(member);
				} else if (member.user.bot) bad.push(member);
				await interaction.editReply({
					allowedMentions: { parse: [] },
					content: `Added role ${roleMention(role.id)} to following bot users:\n${good
						.map((u) => userMention(u.id))
						.join(', ')}\nFailed to add role to following bot users:\n${bad
						.map((u) => userMention(u.id))
						.join(', ')}`
				});
			}
		},

		humans: async (interaction: ChatInputCommandInteraction) => {
			const bad = [],
				good = [],
				guild = interaction.guild!,
				role = interaction.options.getRole('role', true);
			for (const [, member] of (await guild.members.fetch())[
				Symbol.iterator
			]()) {
				if (!member.user.bot && member.manageable) {
					await member.roles.add(role.id);
					good.push(member);
				} else if (!member.user.bot) bad.push(member);
				await interaction.editReply({
					allowedMentions: { parse: [] },
					content: `Added role ${roleMention(role.id)} to following human users:\n${good
						.map((u) => userMention(u.id))
						.join(', ')}\nFailed to add role to following human users:\n${bad
						.map((u) => userMention(u.id))
						.join(', ')}`
				});
			}
		}
	},

	channel: {
		autodelete: async (interaction: ChatInputCommandInteraction) => {
			const channel = interaction.options.getChannel('channel', true);
			const delay = interaction.options.getInteger('delay', false);
			const matchMode = interaction.options.getString('matchmode', false) as
				null | 'contains' | 'startswith' | 'endswith';
			const matchPattern = interaction.options.getString('matchpattern', false);

			if (!interaction.inGuild())
				return await interaction.editReply(
					'Error: cannot set auto-delete for this channel.\nCause: not in a guild.'
				);

			if (!delay || !matchMode || !matchPattern) {
				await clearAutoDelete(interaction.guildId!, channel.id);
				await interaction.editReply(
					`Auto-delete for channel ${channelMention(channel.id)} has been disabled. Cancelling any pending auto-delete tasks for this channel.`
				);
				return await removeAutoDeleteEntriesOfChannel(
					interaction.guildId!,
					channel.id
				);
			}

			if (!(channel instanceof BaseGuildTextChannel))
				return await interaction.editReply(
					'Error: cannot set auto-delete for this channel; invalid channel type.'
				);

			if (
				!channel
					.permissionsFor(interaction.guild!.members.me!)
					.has('ManageMessages')
			)
				return await interaction.editReply(
					'Error: cannot set auto-delete for this channel; the bot does not have permission to manage messages in this channel.'
				);

			await setAutoDelete(
				interaction.guildId!,
				channel.id,
				delay,
				matchMode,
				matchPattern
			);
			await interaction.editReply(
				`Auto-delete for channel ${channelMention(channel.id)} has been enabled. Deleting messages that ${(() => {
					switch (matchMode) {
						case 'contains':
							return 'contain';
						case 'startswith':
							return 'start with';
						case 'endswith':
							return 'end with';
						default:
							return '';
					}
				})()} "${matchPattern}" after ${delay} minutes.\nNote that messages will be deleted within a minute of the delay expiring, not necessarily at the exact moment.`
			);
			return await channel.send(
				`Auto-delete for this channel has been enabled. Messages that ${(() => {
					switch (matchMode) {
						case 'contains':
							return 'contain';
						case 'startswith':
							return 'start with';
						case 'endswith':
							return 'end with';
						default:
							return '';
					}
				})()} "${matchPattern}" will be deleted after ${delay} minutes.\nNote that messages will be deleted within a minute of the delay expiring, not necessarily at the exact moment.`
			);
		}

		// #region old command code
		/**
			clear: async (interaction: ChatInputCommandInteraction) => {
				if (!interaction.inGuild()) {
					await interaction.editReply(
						'Error: cannot clear this channel.\nCause: not in a guild.'
					);
					return;
				}
				// No need for permission check because command is already restricted to admins and reply is ephemeral
				const reply = await interaction.editReply({
					components: [
						new ActionRowBuilder<ButtonBuilder>().setComponents(
							new ButtonBuilder()
								.setCustomId('/admin_channel_clear')
								.setLabel('Clear Channel')
								.setStyle(ButtonStyle.Danger)
								.setEmoji('⚠')
								.setDisabled(true)
						)
					],
					content: `${underline(bold('Are you sure you want to clear this channel? This action is irreversible! Please make sure that you are absolutely sure you want to clear this channel.'))}\nClick the button below to confirm.\nPlease wait 10 seconds to consider your decision.`
				});
				setTimeout(async () => {
					await reply.edit({
						components: [
							new ActionRowBuilder<ButtonBuilder>().setComponents(
								new ButtonBuilder()
									.setCustomId('/admin_channel_clear')
									.setLabel('Clear Channel')
									.setStyle(ButtonStyle.Danger)
									.setEmoji('⚠')
									.setDisabled(false)
							)
						],
						content: `${underline(bold('Are you sure you want to clear this channel? This action is irreversible! Please make sure that you are absolutely sure you want to clear this channel.'))}\nClick the button below to confirm.`
					});
				}, 10_000);
			},
		*/
		/**
			lock: async (interaction: ChatInputCommandInteraction) => {
				if (!interaction.guild) {
					await interaction.editReply(
						'Error: cannot lock/unlock this channel.\nCause: not in a guild.'
					);
					return;
				}
				const channel = interaction.options.getChannel('channel')
					? await interaction.guild.channels.fetch(
							interaction.options.getChannel('channel')!.id
						)
					: interaction.channel;
				if (
					!channel ||
					channel.isDMBased() ||
					channel.isVoiceBased() ||
					!channel.isTextBased()
				) {
					await interaction.editReply(
						'Error: cannot lock this channel.\nCause may be insufficient permissions or invalid channel type.'
					);
					return;
				}
				if (channel.isThread())
					await channel.setLocked(false, 'Channel locked by DisCog');
				else
					await channel.permissionOverwrites.edit(
						interaction.guild.roles.everyone,
						{
							AddReactions: null,
							AttachFiles: null,
							CreateInstantInvite: null,
							CreatePrivateThreads: null,
							CreatePublicThreads: null,
							EmbedLinks: null,
							ManageMessages: null,
							ManageThreads: null,
							ReadMessageHistory: null,
							SendMessages: null,
							SendMessagesInThreads: null,
							SendTTSMessages: null,
							SendVoiceMessages: null,
							Speak: null,
							UseApplicationCommands: null,
							ViewChannel: null
						}
					);
				await interaction.editReply(
					`Channel ${channelMention(channel.id)} has been locked!`
				);
			}
	*/
		// #endregion
	}
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral
	});

	const subcommandGroup = interaction.options.getSubcommandGroup();

	if (subcommandGroup === 'addrole')
		await handlers.addrole[
			interaction.options.getSubcommand(true) as keyof typeof handlers.addrole
		](interaction);
	else
		await handlers.channel[
			interaction.options.getSubcommand(true) as keyof typeof handlers.channel
		](interaction);
};
