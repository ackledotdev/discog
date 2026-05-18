import { SlashCommandBuilder } from 'discord.js';
import { CommandHelpEntry } from '../class/CommandHelpEntry';

export interface SerializedCommandHelpEntry {
	name: string;
	description: string;
	usage?: string[];
}

export interface Command {
	data: SlashCommandBuilder;
	help?: CommandHelpEntry;
	execute: (interaction: any) => Promise<void>;
}
