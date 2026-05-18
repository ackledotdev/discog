import {
	AttachmentBuilder,
	SlashCommandBuilder,
	ChatInputCommandInteraction
} from 'discord.js';
import { toCanvas } from 'qrcode';
import { CommandHelpEntry } from '../lib/class/CommandHelpEntry';
import { createCanvas } from 'canvas';

export const data = new SlashCommandBuilder()
	.setName('qr')
	.setDescription('Generate a QR code from a message or link')
	.addStringOption((option) => {
		return option
			.setName('text')
			.setDescription('The text/link to encode')
			.setRequired(true);
	})
	.addBooleanOption((option) => {
		return option
			.setName('ephemeral')
			.setDescription('Whether the reply should be ephemeral')
			.setRequired(false);
	});
export const help = new CommandHelpEntry(
	'qr',
	'Encodes some text or a link in a QR code',
	'<text: string>'
);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.reply({
		content: 'Generating QR code...',
		ephemeral: interaction.options.getBoolean('ephemeral') ?? false
	});

	const text = interaction.options.getString('text', true);

	const canvas = createCanvas(400, 400);
	await toCanvas(canvas, text, {});

	await interaction.editReply({
		content: 'Successfully generated a QR code!',
		files: [
			new AttachmentBuilder(canvas.toBuffer(), {
				description: `QR code for ${text}`,
				name: 'qr.png'
			})
		]
	});
};
