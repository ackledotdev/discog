import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Guild,
	PermissionFlagsBits,
	SlashCommandBuilder,
	bold,
	roleMention,
	underscore,
	userMention
} from 'discord.js';
import { CommandHelpEntry } from '../struct/CommandHelpEntry';

export const help = new CommandHelpEntry('admin', 'Admin commands');

export const data = new SlashCommandBuilder()
	.setName('admin')
	.setDescription('Automatically run admin tasks')
	.setDMPermission(false)
	.setDefaultMemberPermissions(
		PermissionFlagsBits.ManageGuild |
			PermissionFlagsBits.ManageRoles |
			PermissionFlagsBits.ModerateMembers
	)
	.addSubcommandGroup(subcommandGroup => {
		return subcommandGroup
			.setName('addrole')
			.setDescription('Add a role to users')
			.addSubcommand(subcommand => {
				return subcommand
					.setName('all')
					.setDescription('Add a role to all users')
					.addRoleOption(option => {
						return option
							.setName('role')
							.setDescription('Role to add')
							.setRequired(true);
					});
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('humans')
					.setDescription('Add a role to all humans')
					.addRoleOption(option => {
						return option
							.setName('role')
							.setDescription('Role to add')
							.setRequired(true);
					});
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('bots')
					.setDescription('Add a role to all bots')
					.addRoleOption(option => {
						return option
							.setName('role')
							.setDescription('Role to add')
							.setRequired(true);
					});
			});
	})
	.addSubcommandGroup(subcommandGroup => {
		return subcommandGroup
			.setName('channel')
			.setDescription('Manage channels')
			.addSubcommand(subcommand => {
				return subcommand
					.setName('clear')
					.setDescription('Clear a channel')
					.addChannelOption(option => {
						return option
							.setName('channel')
							.setDescription('Channel to clear')
							.setRequired(false);
					});
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('lock')
					.setDescription('Lock a channel')
					.addChannelOption(option => {
						return option
							.setName('channel')
							.setDescription('Channel to lock')
							.setRequired(false);
					})
					.addBooleanOption(option => {
						return option
							.setName('unlock')
							.setDescription('Unlock the channel instead')
							.setRequired(false);
					});
			});
	});

const handlers = {
	addrole: {
		all: async (interaction: ChatInputCommandInteraction) => {
			const bad = [],
				good = [],
				guild = interaction.guild as Guild,
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
					.map(u => userMention(u.id))
					.join(', ')}\nFailed to add role to following users:\n${bad
					.map(u => userMention(u.id))
					.join(', ')}`
			});
		},
		bots: async (interaction: ChatInputCommandInteraction) => {
			const bad = [],
				good = [],
				guild = interaction.guild as Guild,
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
					content: `Added role ${roleMention(
						role.id
					)} to following bot users:\n${good
						.map(u => userMention(u.id))
						.join(', ')}\nFailed to add role to following bot users:\n${bad
						.map(u => userMention(u.id))
						.join(', ')}`
				});
			}
		},
		humans: async (interaction: ChatInputCommandInteraction) => {
			const bad = [],
				good = [],
				guild = interaction.guild as Guild,
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
					content: `Added role ${roleMention(
						role.id
					)} to following human users:\n${good
						.map(u => userMention(u.id))
						.join(', ')}\nFailed to add role to following human users:\n${bad
						.map(u => userMention(u.id))
						.join(', ')}`
				});
			}
		}
	},
	channel: {
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
				content: `${underscore(
					bold(
						'Are you sure you want to clear this channel? This action is irreversible! Please make sure that you are absolutely sure you want to clear this channel.'
					)
				)}\nClick the button below to confirm.\nPlease wait 10 seconds to consider your decision.`
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
					content: `${underscore(
						bold(
							'Are you sure you want to clear this channel? This action is irreversible! Please make sure that you are absolutely sure you want to clear this channel.'
						)
					)}\nClick the button below to confirm.`
				});
			}, 10_000);
		},
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
					: interaction.channel,
				unlock = interaction.options.getBoolean('unlock', false);
			if (
				!channel ||
				channel.isDMBased() ||
				channel.isVoiceBased() ||
				!channel.isTextBased()
			) {
				await interaction.editReply(
					'Error: cannot lock/unlock this channel.\nCause may be insufficient permissions or invalid channel type.'
				);
				return;
			}
			if (!unlock) {
				if (channel.isThread())
					await channel.setLocked(true, 'Channel locked by DisCog');
				else
					await channel.permissionOverwrites.edit(
						interaction.guild.roles.everyone,
						{
							AddReactions: false,
							AttachFiles: false,
							CreateInstantInvite: false,
							CreatePrivateThreads: false,
							CreatePublicThreads: false,
							EmbedLinks: false,
							ManageMessages: false,
							ManageThreads: false,
							ReadMessageHistory: true,
							SendMessages: false,
							SendMessagesInThreads: false,
							SendTTSMessages: false,
							SendVoiceMessages: false,
							Speak: false,
							UseApplicationCommands: false,
							ViewChannel: true
						}
					);
			} else if (channel.isThread())
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
				`Channel ${channel} has been ${unlock ? 'unlocked' : 'locked'}!${
					unlock
						? '\nAll permissions have been reset to predefined defaults.'
						: ''
				}`
			);
		}
	}
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		ephemeral: true
	});
	const subcommandGroup =
		interaction.options.getSubcommandGroup() as keyof typeof handlers;
	if (subcommandGroup === 'addrole')
		await handlers.addrole[
			interaction.options.getSubcommand(true) as keyof typeof handlers.addrole
		](interaction);
	else
		await handlers.channel[
			interaction.options.getSubcommand(true) as keyof typeof handlers.channel
		](interaction);
	await interaction.editReply('Done!');
};
