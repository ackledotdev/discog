import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ModalBuilder,
	SlashCommandBuilder,
	Snowflake,
	TextInputBuilder,
	TextInputStyle,
	userMention
} from 'discord.js';
import Jsoning from 'jsoning';

export const data = new SlashCommandBuilder()
	.setName('dev')
	.setDescription('Developer-only command')
	.addSubcommand(subcommand => {
		return subcommand
			.setName('global')
			.setDescription('Send a global system announcement');
	})
	.addSubcommandGroup(group => {
		return group
			.setName('whitelist')
			.setDescription('Manage the bot developer whitelist')
			.addSubcommand(subcommand => {
				return subcommand
					.setName('add')
					.setDescription('Add a user to the dev list')
					.addUserOption(option => {
						return option
							.setName('user')
							.setDescription('The user to add to the dev list')
							.setRequired(true);
					});
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('ls')
					.setDescription('List all users in the dev list');
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('rm')
					.setDescription('Remove a user from the dev list')
					.addUserOption(option => {
						return option
							.setName('user')
							.setDescription('The user to remove from the dev list')
							.setRequired(true);
					});
			});
	})
	.addSubcommandGroup(group => {
		return group
			.setName('blacklist')
			.setDescription('Manage the bot user blacklist')
			.addSubcommand(subcommand => {
				return subcommand
					.setName('add')
					.setDescription('Blacklist a user from using the bot')
					.addUserOption(option => {
						return option
							.setName('user')
							.setDescription('The user to blacklist')
							.setRequired(true);
					});
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('ls')
					.setDescription('List all users in the blacklist');
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName('rm')
					.setDescription('Remove a user from the blacklist')
					.addUserOption(option => {
						return option
							.setName('user')
							.setDescription('The user to remove from the blacklist')
							.setRequired(true);
					});
			});
	})
	.setDMPermission(true);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const db = new Jsoning('botfiles/dev.db.json');
	const whitelist = ((await db.get('whitelist')) as string[]) || [];
	const blacklist = ((await db.get('blacklist')) as string[]) || [];
	if (!whitelist.includes(interaction.user.id)) {
		await interaction.reply('Restricted Commmand');
		return;
	}
	switch (interaction.options.getSubcommandGroup()) {
		case 'blacklist':
			switch (interaction.options.getSubcommand()) {
				case 'add': {
					const auser = interaction.options.getUser('user', true);
					if (blacklist.includes(auser.id)) {
						await interaction.reply('User is already blacklisted.');
						return;
					}
					await db.set('blacklist', [...blacklist, auser.id]);
					await interaction.reply('Done.');
					break;
				}
				case 'ls': {
					if (blacklist.length === 0) {
						await interaction.reply('No users are blacklisted.');
						return;
					}
					await interaction.reply(
						`Blacklisted users: ${blacklist
							.map(id => userMention(id))
							.join(', ')}`
					);
					break;
				}
				case 'rm': {
					const ruser = interaction.options.getUser('user', true);
					if (!blacklist.includes(ruser.id)) {
						await interaction.reply('User is not blacklisted.');
						return;
					}
					await db.set(
						'blacklist',
						blacklist.filter((id: Snowflake) => id !== ruser.id)
					);
					await interaction.reply('Done.');
					break;
				}
			}
			break;
		case 'whitelist':
			switch (interaction.options.getSubcommand()) {
				case 'add': {
					const auser = interaction.options.getUser('user', true);
					if (whitelist.includes(auser.id)) {
						await interaction.reply('User is already whitelisted.');
						return;
					}
					await db.set('whitelist', [...whitelist, auser.id]);
					await interaction.reply('Done.');
					break;
				}
				case 'ls': {
					if (whitelist.length === 0) {
						await interaction.reply('No users are whitelisted.');
						return;
					}
					await interaction.reply({
						allowedMentions: { parse: [] },
						content: `Blacklisted users: ${whitelist
							.map(id => userMention(id))
							.join(', ')}`
					});
					break;
				}
				case 'rm': {
					const ruser = interaction.options.getUser('user', true);
					if (!whitelist.includes(ruser.id)) {
						await interaction.reply('User is not whitelisted.');
						return;
					}
					await db.set(
						'whitelist',
						whitelist.filter((id: Snowflake) => id !== ruser.id)
					);
					await interaction.reply('Done.');
					break;
				}
			}
			break;
		case undefined:
		default: {
			switch (interaction.options.getSubcommand()) {
				case 'global': {
					interaction.showModal(
						new ModalBuilder()
							.setTitle('DisCog Global System Announcement')
							.setCustomId('/global')
							.addComponents(
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId('/global.text')
										.setStyle(TextInputStyle.Paragraph)
										.setLabel('Message')
										.setPlaceholder('The message to announce in all guilds')
								)
							)
					);
					break;
				}
			}
			break;
		}
	}
};
