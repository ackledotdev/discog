import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	time
} from 'discord.js';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('unix')
	.setDescription('Converts UNIX timestamps')
	.addSubcommand((subcommand) => {
		return subcommand
			.setName('date')
			.setDescription('Converts a UNIX timestamp to a date')
			.addIntegerOption((option) => {
				return option
					.setName('timestamp')
					.setDescription('The UNIX timestamp to convert (milliseconds)')
					.setRequired(true);
			});
	})
	.addSubcommand((subcommand) => {
		return subcommand
			.setName('timestamp')
			.setDescription('Converts a date to a UNIX timestamp')
			.addStringOption((option) => {
				return option
					.setName('date')
					.setDescription('The date string to convert')
					.setRequired(true);
			});
	});

export const help = new CommandHelpEntry(
	'unix',
	'Converts UNIX timestamps',
	'date <timestamp: number>',
	'timestamp <date: string>'
);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	switch (interaction.options.getSubcommand()) {
		case 'date':
			const timestamp = interaction.options.getInteger('timestamp', true);
			await interaction.reply({
				embeds: [
					new EmbedBuilder().setTitle('UNIX Timestamp to Date').setDescription(
						`Timestamp: ${timestamp}\nDate: ${new Date(
							timestamp
						).toLocaleString('en-US', {
							timeZone: 'America/Los_Angeles'
						})} PST (${time(timestamp / 1_000)})`
					)
				]
			});
			break;

		case 'timestamp':
			const dateStr = interaction.options.getString('date', true);
			const date = new Date(dateStr);
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Date to UNIX Timestamp')
						.setDescription(
							`Date: ${dateStr}\nTimestamp (ms): ${date.getTime()}`
						)
				]
			});
			break;
	}
};
