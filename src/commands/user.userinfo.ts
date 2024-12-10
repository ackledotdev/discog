import {
	ApplicationCommandType,
	ContextMenuCommandBuilder,
	ContextMenuCommandType
} from 'discord.js';

export const data = new ContextMenuCommandBuilder()
	.setName('User Info')
	.setType(ApplicationCommandType.User as ContextMenuCommandType);
