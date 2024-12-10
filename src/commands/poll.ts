import {
	BaseGuildTextChannel,
	ChatInputCommandInteraction,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
	userMention
} from 'discord.js';
import { CommandHelpEntry } from '../struct/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('poll')
	.setDescription('Create a poll')
	.setContexts(InteractionContextType.Guild)

	// #region data
	.addStringOption(option => {
		return option
			.setName('question')
			.setDescription('The question to be asked in the poll')
			.setRequired(true);
	})
	.addChannelOption(option => {
		return option
			.setName('channel')
			.setDescription('The channel to post the poll to')
			.setRequired(true);
	})
	.addBooleanOption(option => {
		return option
			.setName('pingeveryone')
			.setDescription('Ping @everyone?')
			.setRequired(true);
	})
	.addStringOption(option => {
		return option
			.setName('option1')
			.setDescription('An answer')
			.setRequired(true);
	})
	.addStringOption(option => {
		return option
			.setName('option2')
			.setDescription('An answer')
			.setRequired(true);
	})
	.addStringOption(option => {
		return option
			.setName('option3')
			.setDescription('An answer')
			.setRequired(false);
	})
	.addStringOption(option => {
		return option
			.setName('option4')
			.setDescription('An answer')
			.setRequired(false);
	})
	.addStringOption(option => {
		return option
			.setName('option5')
			.setDescription('An answer')
			.setRequired(false);
	})
	.addStringOption(option => {
		return option
			.setName('option6')
			.setDescription('An answer')
			.setRequired(false);
	})
	.addStringOption(option => {
		return option
			.setName('option7')
			.setDescription('An answer')
			.setRequired(false);
	})
	.addStringOption(option => {
		return option
			.setName('option8')
			.setDescription('An answer')
			.setRequired(false);
	})
	.addStringOption(option => {
		return option
			.setName('option9')
			.setDescription('An answer')
			.setRequired(false);
	});
// #endregion data

export const help = new CommandHelpEntry('poll', 'Creates a poll', [
	'<question: string> <channel: channel> [pingeveryone: boolean || false] <option1: string> <option2: string> [option3: string] [option3: string] [option4: string] [option5: string] [option6: string] [option7: string] [option8: string] [option9: string]'
]);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply();
	const options = [];
	for (let i = 1; i <= 9; i++) {
		if (i <= 2) options.push(interaction.options.getString(`option${i}`, true));
		else if (interaction.options.getString(`option${i}`, false))
			options.push(interaction.options.getString(`option${i}`, false));
	}
	// Create embed
	const embed = new EmbedBuilder()
		.setColor(0x00ff00)
		.setTimestamp()
		.setTitle(interaction.options.getString('question'))
		.setFooter({
			iconURL: interaction.client.user.displayAvatarURL(),
			text: 'Poll powered by DisCog'
		});
	const NumberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
	// Populate embed with options
	options.forEach((value, index) =>
		embed.addFields({ name: NumberEmojis[index], value: value ?? '' })
	);
	const channel = interaction.options.getChannel('channel', true);
	if (!channel) throw new Error();
	if (!(channel instanceof BaseGuildTextChannel))
		throw new Error('/poll: Channel is not BaseGuildTextChannel');
	const msg = await channel.send({
		content: `${
			interaction.options.getBoolean('pingeveryone', true) ? '@everyone ' : ''
		} New poll by ${userMention(interaction.user.id)}`,
		embeds: [embed]
	});
	for (let i = 0; i < options.length; i++) await msg.react(NumberEmojis[i]);
	await interaction.editReply('Done.');
};
