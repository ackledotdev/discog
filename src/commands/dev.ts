import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	MessageFlags,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
	userMention
} from 'discord.js';
import Jsoning from 'jsoning';
import {
	blacklistUser,
	getBlacklistIds,
	getDeveloperIds,
	isBlacklisted,
	isDeveloper,
	makeDeveloper,
	unBlacklistUser,
	unMakeDeveloper
} from '../lib/redis';

export const data = new SlashCommandBuilder()
	.setName('dev')
	.setDescription('Developer-only command')
	// .addSubcommand((subcommand) => {
	// 	return subcommand
	// 		.setName('global')
	// 		.setDescription('Send a global system announcement');
	// })
	.addSubcommandGroup((group) => {
		return group
			.setName('whitelist')
			.setDescription('Manage the bot developer whitelist')
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('add')
					.setDescription('Add a user to the dev list')
					.addUserOption((option) => {
						return option
							.setName('user')
							.setDescription('The user to add to the dev list')
							.setRequired(true);
					});
			})
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('ls')
					.setDescription('List all users in the dev list');
			})
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('rm')
					.setDescription('Remove a user from the dev list')
					.addUserOption((option) => {
						return option
							.setName('user')
							.setDescription('The user to remove from the dev list')
							.setRequired(true);
					});
			});
	})
	.addSubcommandGroup((group) => {
		return group
			.setName('blacklist')
			.setDescription('Manage the bot user blacklist')
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('add')
					.setDescription('Blacklist a user from using the bot')
					.addUserOption((option) => {
						return option
							.setName('user')
							.setDescription('The user to blacklist')
							.setRequired(true);
					});
			})
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('ls')
					.setDescription('List all users in the blacklist');
			})
			.addSubcommand((subcommand) => {
				return subcommand
					.setName('rm')
					.setDescription('Remove a user from the blacklist')
					.addUserOption((option) => {
						return option
							.setName('user')
							.setDescription('The user to remove from the blacklist')
							.setRequired(true);
					});
			});
	})
	.setDMPermission(true);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	if (!isDeveloper(interaction.user.id)) {
		await interaction.editReply('You are not a developer.');
		return;
	}

	switch (interaction.options.getSubcommandGroup()) {
		case 'blacklist':
			switch (interaction.options.getSubcommand()) {
				case 'add': {
					const auser = interaction.options.getUser('user', true);
					if (await isBlacklisted(auser.id)) {
						await interaction.editReply('User is already blacklisted.');
						return;
					}
					await blacklistUser(auser.id);
					await interaction.editReply('Done.');
					break;
				}
				case 'ls': {
					const blacklist = await getBlacklistIds();
					if (blacklist.length === 0) {
						await interaction.editReply('No users are blacklisted.');
						return;
					}
					await interaction.editReply(
						`Blacklisted users: ${blacklist
							.map((id) => userMention(id))
							.join(', ')}`
					);
					break;
				}
				case 'rm': {
					const ruser = interaction.options.getUser('user', true);
					if (!(await isBlacklisted(ruser.id))) {
						await interaction.editReply('User is not blacklisted.');
						return;
					}
					await unBlacklistUser(ruser.id);
					await interaction.editReply('Done.');
					break;
				}
			}
			break;
		case 'whitelist':
			switch (interaction.options.getSubcommand()) {
				case 'add': {
					const auser = interaction.options.getUser('user', true);
					if (await isDeveloper(auser.id)) {
						await interaction.editReply('User is already whitelisted.');
						return;
					}
					await makeDeveloper(auser.id);
					await interaction.editReply('Done.');
					break;
				}
				case 'ls': {
					const whitelist = await getDeveloperIds();
					if (whitelist.length === 0) {
						await interaction.editReply('No users are whitelisted.');
						return;
					}
					await interaction.editReply({
						allowedMentions: { parse: [] },
						content: `Whitelisted users: ${whitelist
							.map((id) => userMention(id))
							.join(', ')}`
					});
					break;
				}
				case 'rm': {
					const ruser = interaction.options.getUser('user', true);
					if (!(await isDeveloper(ruser.id))) {
						await interaction.editReply('User is not whitelisted.');
						return;
					}
					await unMakeDeveloper(ruser.id);
					await interaction.editReply('Done.');
					break;
				}
			}
			break;
		// case undefined:
		// default: {
		// 	switch (interaction.options.getSubcommand()) {
		// 		case 'global': {
		// 			interaction.showModal(
		// 				new ModalBuilder()
		// 					.setTitle('DisCog Global System Announcement')
		// 					.setCustomId('/global')
		// 					.addComponents(
		// 						new ActionRowBuilder<TextInputBuilder>().addComponents(
		// 							new TextInputBuilder()
		// 								.setCustomId('/global.text')
		// 								.setStyle(TextInputStyle.Paragraph)
		// 								.setLabel('Message')
		// 								.setPlaceholder('The message to announce in all guilds')
		// 						)
		// 					)
		// 			);
		// 			break;
		// 		}
		// 	}
		// 	break;
		// }
	}
};
