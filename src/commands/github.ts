import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder
} from 'discord.js';
import { Octokit } from 'octokit';
import { CommandHelpEntry } from '../struct/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('github')
	.setDescription('Get information about a GitHub user.')
	.addSubcommand(subcommand => {
		return subcommand
			.setName('profile')
			.setDescription("View a GitHub user's profile.")
			.addStringOption(option => {
				return option
					.setName('username')
					.setDescription('The GitHub username to view.')
					.setRequired(true);
			});
	})
	.addSubcommand(subcommand => {
		return subcommand
			.setName('repos')
			.setDescription("View a GitHub user's repositories.")
			.addStringOption(option => {
				return option
					.setName('username')
					.setDescription('The GitHub username to view.')
					.setRequired(true);
			});
	})
	.addSubcommand(subcommand => {
		return subcommand
			.setName('stats')
			.setDescription("View a GitHub user's stats.")
			.addStringOption(option => {
				return option
					.setName('username')
					.setDescription('The GitHub username to view.')
					.setRequired(true);
			});
	});

export const help = new CommandHelpEntry(
	'github',
	'View some info for GitHub users',
	'profile <username: string>',
	'repos <username: string>',
	'stats <username: string>'
);

const BaseEmbed = (interaction: ChatInputCommandInteraction) =>
		new EmbedBuilder()
			.setColor('White')
			.setDescription('Fetching data from GitHub, please wait...')
			.setTimestamp()
			.setFooter({
				iconURL: interaction.client.user.displayAvatarURL(),
				text: 'Powered by DisCog'
			}),
	OctoKit = new Octokit({ userAgent: 'DisCog' });
const Handlers: {
	[key: string]: (interaction: ChatInputCommandInteraction) => unknown;
} = {
	profile: async (interaction: ChatInputCommandInteraction) => {
		await interaction.reply({
			embeds: [BaseEmbed(interaction).setTitle('Github | Profile')]
		});
		const { data } = await OctoKit.rest.users.getByUsername({
			username: interaction.options.getString('username', true)
		});
		if (!data.id)
			await interaction.editReply({
				embeds: [
					BaseEmbed(interaction)
						.setTitle('GitHub | Profile')
						.setDescription('This user does not exist on GitHub.')
				]
			});
		else
			await interaction.editReply({
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('View full profile on GitHub')
							.setURL(data.html_url)
					)
				],
				embeds: [
					BaseEmbed(interaction)
						.setTitle('GitHub | Profile')
						.setDescription(null)
						.setFields(
							{
								name: 'Username',
								value: interaction.options.getString('username', true)
							},
							{
								name: 'Name',
								value: data.name ?? 'Not Provided'
							},
							{
								name: 'Followers',
								value: data.followers.toString()
							},
							{
								name: 'Following',
								value: data.following.toString()
							},
							{
								name: 'Join Date',
								value: new Date(data.created_at).toString()
							}
						)
						.setThumbnail(data.avatar_url)
						.setFooter({
							iconURL: interaction.client.user.displayAvatarURL(),
							text: 'Powered by DisCog'
						})
				]
			});
	},
	repos: async (interaction: ChatInputCommandInteraction) => {
		await interaction.reply({
			embeds: [BaseEmbed(interaction).setTitle('Github | Repositories')]
		});
		const username = interaction.options.getString('username', true);
		const { data } = await OctoKit.rest.repos.listForUser({
			username: username
		});
		if (!data.length)
			await interaction.editReply({
				embeds: [
					BaseEmbed(interaction).setDescription(
						'This user either has no public repositories or does not exist.'
					)
				]
			});
		else
			await interaction.editReply({
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('View full list on GitHub')
							.setURL(`https://github.com/${username}`)
					)
				],
				embeds: [
					BaseEmbed(interaction)
						.setDescription(null)
						.setFields(
							// @ts-expect-error octokit types are weird
							...data.map(repo => ({
								name: repo.name,
								value:
									repo.description ??
									`No description provided.` +
										`\n${repo.html_url}\n${repo.stargazers_count ?? 0} Stars`
							}))
						)
				]
			});
	},
	stats: async (interaction: ChatInputCommandInteraction) => {
		await interaction.reply({
			embeds: [BaseEmbed(interaction).setTitle('Github | Stats')]
		});
		const { data } = await OctoKit.rest.users.getByUsername({
			username: interaction.options.getString('username', true)
		});
		if (!data.id)
			await interaction.editReply({
				embeds: [
					BaseEmbed(interaction).setDescription(
						'This user does not exist on GitHub.'
					)
				]
			});
		else
			await interaction.editReply({
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('View full profile on GitHub')
							.setURL(data.html_url)
					)
				],
				embeds: [
					BaseEmbed(interaction)
						.setTitle('GitHub | Stats')
						.setDescription(null)
						.setThumbnail(data.avatar_url)
						.setFields(
							{
								name: 'Username',
								value: data.login
							},
							{
								name: 'Name',
								value: data.name ?? 'Not Provided'
							},
							{
								name: 'Bio',
								value: data.bio ?? 'Not Provided'
							},
							{
								name: 'Followers',
								value: data.followers.toString()
							},
							{
								name: 'Following',
								value: data.following.toString()
							},
							{
								name: 'Join Date',
								value: new Date(data.created_at).toString()
							},
							{
								name: 'Public Repositories',
								value: data.public_repos.toString()
							}
						)
				]
			});
	}
};

export const execute = async (interaction: ChatInputCommandInteraction) =>
	await Handlers[interaction.options.getSubcommand(true)](interaction);
