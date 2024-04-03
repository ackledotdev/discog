import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	userMention
} from 'discord.js';
import { CommandHelpEntry } from '../struct/CommandHelpEntry';
import { openKv } from '@deno/kv';
import { DENO_KV_URL, DatabaseKeys } from '../config';
import { BirthdayData } from '../struct/database';

export const data = new SlashCommandBuilder()
	.setName('bday')
	.setDescription("Register your birthday or view another's")
	.addSubcommand(
		new SlashCommandSubcommandBuilder()
			.setName('register')
			.setDescription('Register your birthday')
			.addIntegerOption(option => {
				return option
					.setName('month')
					.setDescription('Month of birth')
					.setMinValue(1)
					.setMaxValue(12)
					.setRequired(true);
			})
			.addIntegerOption(option => {
				return option
					.setName('date')
					.setDescription('Date of birth')
					.setMinValue(1)
					.setMaxValue(31)
					.setRequired(true);
			})
	)
	.addSubcommand(
		new SlashCommandSubcommandBuilder()
			.setName('view')
			.setDescription("View someone's birthday")
			.addUserOption(option => {
				return option
					.setName('user')
					.setDescription('User to view birthday')
					.setRequired(false);
			})
	);

export const help = new CommandHelpEntry(
	'bday',
	"Register your birthday or view another's",
	['register <month: number> <day: number>', 'view [user: user || @self]']
);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const db = await openKv(DENO_KV_URL);
	switch (interaction.options.getSubcommand()) {
		case 'register': {
			await interaction.deferReply({
				ephemeral: true
			});
			const bday: BirthdayData = {
				month: interaction.options.getInteger('month', true),
				date: interaction.options.getInteger('date', true)
			};
			await db.set([DatabaseKeys.Bday, interaction.user.id], bday);
			await interaction.editReply({
				content: `Your birthday is set to ${bday.month}/${bday.date}.`
			});
			break;
		}
		case 'view':
			{
				await interaction.deferReply();
				const id =
					interaction.options.getUser('user')?.id ?? interaction.user.id;
				const ubday = (await db.get([DatabaseKeys.Bday, id])).value as
					| BirthdayData
					| undefined
					| null;
				await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('User Birthday')
							.setDescription(
								ubday
									? `${userMention(id)}'s birthday is on ${ubday.month}/${ubday.date}.`
									: `${userMention(id)} has not registered their birthday.`
							)
							.setFooter({
								iconURL: interaction.client.user.displayAvatarURL(),
								text: 'Powered by DisCog'
							})
					]
				});
			}
			break;
	}
};
