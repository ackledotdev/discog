import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	hyperlink,
	inlineCode
} from 'discord.js';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('about')
	.setDescription('About DisCog');

export const help = new CommandHelpEntry('about', 'Shows info about the bot');

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.reply({
		components: [
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setURL('https://discog.ackle.dev/')
					.setLabel('Website'),

				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setURL('https://github.com/ackledotdev/discog')
					.setLabel('Source')
			)
		],

		embeds: [
			new EmbedBuilder()
				.setColor(0x00ff00)
				.setThumbnail(interaction.client.user.displayAvatarURL())
				.setAuthor({
					iconURL: interaction.client.user.displayAvatarURL(),
					name: 'DisCog'
				})
				.setTimestamp()
				.setFooter({
					iconURL: interaction.client.user.displayAvatarURL(),
					text: 'About DisCog'
				})
				.setTitle('About DisCog')
				.setDescription(
					`${hyperlink('DisCog', 'https://discog.ackle.dev')} is a versatile general purpose Discord bot featuring utility commands as well a random collection of other commands. For a full list of commands, use the ${inlineCode('/coghelp')} command.\n\n` +
						`DisCog can also send you birthday wishes if you use the ${inlineCode('/bday register')} command to register your birthdate.\n\n` +
						`DisCog is open source and can be found on ${hyperlink('GitHub', 'https://github.com/ackledotdev/discog')}.\n\n` +
						`All of the code for this bot is licensed under the ${hyperlink('GNU General Public License v3.0', 'https://github.com/ackledotdev/discog/blob/master/LICENSE')}.`
				)
		]
	});
};
