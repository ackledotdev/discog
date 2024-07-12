import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHelpEntry } from '../CommandHelpEntry';

export interface Event {
	name: string;
	once: boolean;
	execute: (...args: unknown[]) => Promise<void>;
}

export interface Command {
	data: SlashCommandBuilder;
	help?: CommandHelpEntry;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
