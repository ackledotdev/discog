import {
	getGuildConfig,
	setGuildAuditLogChannel,
	setGuildSystemChannel
} from '../lib/redis';
import {
	EmbedBuilder,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
	bold,
	channelMention,
	ChatInputCommandInteraction,
	underline
} from 'discord.js';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('conf')
	.setDescription('Configure DisCog for your server')
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(
		PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ViewAuditLog
	)
	.addSubcommand((subcommand) => {
		return subcommand
			.setName('auditlog')
			.setDescription('Configure the audit log')
			.addBooleanOption((option) => {
				return option
					.setName('enabled')
					.setDescription('Whether to enable the audit log')
					.setRequired(true);
			})
			.addChannelOption((option) => {
				return option
					.setName('channel')
					.setDescription('The channel to send audit logs to')
					.setRequired(false);
			});
	})
	.addSubcommand((subcommand) => {
		return subcommand
			.setName('systemchannel')
			.setDescription('Configure the system messages channel')
			.addChannelOption((option) => {
				return option
					.setName('channel')
					.setDescription('The channel to send system messages to')
					.setRequired(false);
			});
	})
	.addSubcommand((subcommand) => {
		return subcommand
			.setName('greetings')
			.setDescription('Configure the greeting messages')
			.addBooleanOption((option) => {
				return option
					.setName('welcome')
					.setDescription('Whether to enable welcome messages')
					.setRequired(true);
			})
			.addBooleanOption((option) => {
				return option
					.setName('goodbye')
					.setDescription('Whether to enable goodbye messages')
					.setRequired(true);
			})
			.addChannelOption((option) => {
				return option
					.setName('channel')
					.setDescription('The channel to send welcome and goodbye messages to')
					.setRequired(false);
			});
	})
	.addSubcommand((subcommand) => {
		return subcommand
			.setName('view')
			.setDescription('View the current configuration');
	});

export const help = new CommandHelpEntry(
	'conf',
	'Configure DisCog for your server',
	'view',
	'auditlog <enabled: boolean> [channel: channel]',
	'systemchannel [channel: channel]',
	'greetings <welcome: boolean> <goodbye: boolean> [channel: channel]'
);

// copilot: use this object as an example for the execute function. do not just copy.
/**
	const OLD_handlers = {
		auditlog: async (interaction, setDefaults, config) => {
			const channel = interaction.options.getChannel('channel', false),
				enabled = interaction.options.getBoolean('enabled', true);
			if (enabled && channel)
				if (channel instanceof NewsChannel && channel instanceof TextChannel) {
					await interaction.editReply(
						'You must provide a generic text channel to enable audit logs.'
					);
					return config;
				} else config.auditlog;
			else if (enabled && !channel) {
				await interaction.editReply(
					'You must provide a channel to enable audit logs'
				);
				return;
			} else if (!enabled)
				config.auditlog = {
					channel: null,
					enabled
				};
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Audit Log Configuration')
						.setDescription(
							`This is the server audit log configuration. DisCog will send messages to the selected channel everytime a noteworthy event is detected as long as the option is enabled.${
								setDefaults
									? bold(
											`\n\nSince this server had no prior data, the defaults have been calculated and set. You can view the current settings at any time by running ${inlineCode('/conf view')}`
										)
									: ''
							}`
						)
						.setFields(
							{
								name: 'Enabled',
								value: config.auditlog.enabled.toString()
							},
							{
								name: 'Channel',
								value: config.auditlog.channel
									? channelMention(config.auditlog.channel)
									: 'None'
							}
						)
				]
			});
			return config;
		},
		greetings: async (interaction, setDefaults, config) => {
			const channel =
					interaction.options.getChannel('channel', false) ??
					(config.greetings.channel
						? await interaction.guild.channels.fetch(config.greetings.channel)
						: null),
				goodbye = interaction.options.getBoolean('goodbye', true),
				welcome = interaction.options.getBoolean('welcome', true);
			if (goodbye && channel)
				if (channel instanceof NewsChannel && channel instanceof TextChannel) {
					await interaction.editReply(
						'You must provide a generic text channel to enable audit logs.'
					);
					return config;
				} else
					config.greetings = {
						channel: channel.id,
						goodbyeEnabled: goodbye,
						welcomeEnabled: welcome
					};
			else if (welcome && channel)
				if (channel instanceof NewsChannel && channel instanceof TextChannel) {
					await interaction.editReply(
						'You must provide a generic text channel to enable audit logs.'
					);
					return config;
				} else
					config.greetings = {
						channel: channel.id,
						goodbyeEnabled: goodbye,
						welcomeEnabled: welcome
					};
			else if ((welcome || goodbye) && !channel)
				await interaction.editReply(
					'You must provide a channel to enable greeting messages'
				);
			else if (!welcome && !goodbye)
				config.greetings = {
					channel: null,
					goodbyeEnabled: goodbye,
					welcomeEnabled: welcome
				};
			else {
				await interaction.editReply(
					'An error occured while configuring the greeting messages. Please contact the developer for assistance.'
				);
				return config;
			}
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Goodbye Message Configuration')
						.setDescription(
							`This is the server's goodbye message configuration. DisCog will send goodbye messages to the selected channel as long as the option is enabled.${
								setDefaults
									? bold(
											`\n\nSince this server had no prior data, the defaults have been calculated and set. You can view the current settings at any time by running ${inlineCode('/conf view')}`
										)
									: ''
							}`
						)
						.setFields(
							{
								name: 'Welcome Enabled',
								value: config.greetings.welcomeEnabled.toString()
							},
							{
								name: 'Goodbye Enabled',
								value: config.greetings.goodbyeEnabled.toString()
							},
							{
								name: 'Channel',
								value: config.greetings.channel
									? channelMention(config.greetings.channel)
									: 'None'
							}
						)
				]
			});
			return config;
		},
		systemchannel: async (interaction, setDefaults, config) => {
			const channel = interaction.options.getChannel('channel', false);
			if (channel) {
				if (channel instanceof NewsChannel && channel instanceof TextChannel) {
					await interaction.editReply(
						'You must provide a generic text channel to enable audit logs.'
					);
					return config;
				} else config.systemchannel = channel.id;
			} else config.systemchannel = null;
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('System Messages Configuration')
						.setDescription(
							`This is the server's system messages configuration. DisCog will send system messages to the selected channel.${
								setDefaults
									? bold(
											`\n\nSince this server had no prior data, the defaults have been calculated and set. You can view the current settings at any time by running ${inlineCode('/conf')}`
										)
									: ''
							}`
						)
						.setFields({
							name: 'Channel',
							value: config.systemchannel
								? channelMention(config.systemchannel)
								: 'None'
						})
				]
			});
			return config;
		},
		view: async (interaction, setDefaults, config) => {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Configuration Information')
						.setDescription(
							`Configure DisCog for your server\n${inlineCode('/conf view')}\n${inlineCode('/conf auditlog <enabled: boolean> [channel: channel]')}\n${inlineCode('/conf birthdays <enabled: boolean> [channel: channel]')}\n${inlineCode('/conf greetings <welcome: boolean> <goodbye: boolean> [channel: channel]')}${
								setDefaults
									? `\n\n${bold('Since this server had no prior data, the defaults have been calculated and set.')}`
									: ''
							}\n\n${underscore(bold('Current Configuration:'))}`
						)
						.setFields(
							{
								name: 'Audit Log — Enabled',
								value: config.auditlog.enabled.toString()
							},
							{
								name: 'Audit Log — Channel',
								value: config.auditlog.channel
									? channelMention(config.auditlog.channel)
									: 'None'
							},
							{
								name: 'Birthday Announcements — Enabled',
								value: config.birthdays.enabled.toString()
							},
							{
								name: 'Birthday Announcements — Channel',
								value: config.birthdays.channel
									? channelMention(config.birthdays.channel)
									: 'None'
							},
							{
								name: 'Welcome Messages — Enabled',
								value: config.greetings.welcomeEnabled.toString()
							},
							{
								name: 'Goodbye Messages — Enabled',
								value: config.greetings.goodbyeEnabled.toString()
							},
							{
								name: 'Welcome/Goodbye Messages — Channel',
								value: config.greetings.channel
									? channelMention(config.greetings.channel)
									: 'None'
							},
							{
								name: 'System Messages — Channel',
								value: config.systemchannel
									? channelMention(config.systemchannel)
									: 'None'
							}
						)
				]
			});
			return config;
		}
	};
*/

const handlers = {
	view: async function (interaction: ChatInputCommandInteraction) {
		const config = await getGuildConfig(interaction.guildId!);
		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Configuration Information')
					.setDescription(underline(bold('Current Configuration:')))
					.setFields(
						{
							name: 'Audit Log Channel',
							value: config.auditlogChannel
								? channelMention(config.auditlogChannel)
								: 'Disabled'
						},
						{
							name: 'Welcome Messages',
							value: config.greetings.welcomeEnabled ? 'Enabled' : 'Disabled'
						},
						{
							name: 'Goodbye Messages',
							value: config.greetings.goodbyeEnabled ? 'Enabled' : 'Disabled'
						},
						{
							name: 'Greetings Message Channel',
							value: config.greetings.channel
								? channelMention(config.greetings.channel)
								: 'Disabled'
						}
					)
			]
		});
	},

	auditlog: async function (interaction: ChatInputCommandInteraction) {
		const enabled = interaction.options.getBoolean('enabled', true),
			channel = interaction.options.getChannel('channel', false);

		if (enabled && channel) {
			if (!(channel instanceof TextChannel)) {
				await interaction.editReply(
					'You must provide a generic text channel to enable audit logs.'
				);
				return;
			}

			await setGuildAuditLogChannel(interaction.guildId!, channel.id);
			await interaction.editReply(
				`Audit log has been enabled and set to ${channelMention(channel.id)}.`
			);
		} else if (enabled && !channel) {
			await interaction.editReply(
				'You must provide a channel to enable audit logs.'
			);
		} else {
			// disabled, channel is irrelevant
			await setGuildAuditLogChannel(interaction.guildId!, null);
			await interaction.editReply('Audit log has been disabled.');
		}
	},

	greetings: async function (interaction: ChatInputCommandInteraction) {},

	systemchannel: async function (interaction: ChatInputCommandInteraction) {
		// copilot: follow audit log config pattern
		const channel = interaction.options.getChannel('channel', false);

		if (channel) {
			if (!(channel instanceof TextChannel)) {
				await interaction.editReply(
					'You must provide a generic text channel to set the system messages channel.'
				);
				return;
			}

			await setGuildSystemChannel(interaction.guildId!, channel.id);
			await interaction.editReply(
				`System messages channel has been set to ${channelMention(channel.id)}.`
			);
		} else {
			await setGuildSystemChannel(interaction.guildId!, null);
			await interaction.editReply('System messages channel has been unset.');
		}
	}
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply();

	if (!interaction.inGuild()) {
		await interaction.editReply(
			'This command can only be used in a server. Please run this command in a server to configure DisCog.'
		);
		return;
	}

	const subcommand =
		interaction.options.getSubcommand() as keyof typeof handlers;

	if (!handlers[subcommand])
		await interaction.editReply(
			'An error occurred while executing the command. Please contact the developer for assistance.'
		);
	else await handlers[subcommand](interaction);
};
