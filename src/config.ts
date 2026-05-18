import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';

// % Production
export const clientId = '1150536178714554459' as const;
// % Development
// export const clientId = '1034561538721325056' as const;

export const permissionsBits = new PermissionsBitField().add(
	PermissionFlagsBits.AddReactions,
	PermissionFlagsBits.Administrator,
	PermissionFlagsBits.AttachFiles,
	PermissionFlagsBits.CreateInstantInvite,
	PermissionFlagsBits.EmbedLinks,
	PermissionFlagsBits.ManageChannels,
	PermissionFlagsBits.ManageEvents,
	PermissionFlagsBits.ManageGuild,
	PermissionFlagsBits.ManageMessages,
	PermissionFlagsBits.ManageRoles,
	PermissionFlagsBits.ManageThreads,
	PermissionFlagsBits.ManageWebhooks,
	PermissionFlagsBits.MentionEveryone,
	PermissionFlagsBits.ModerateMembers,
	PermissionFlagsBits.ReadMessageHistory,
	PermissionFlagsBits.SendMessages,
	PermissionFlagsBits.SendMessagesInThreads,
	PermissionFlagsBits.ViewAuditLog,
	PermissionFlagsBits.ViewChannel
).bitfield;

export const PORT = 8000;

/**
	export enum DatabaseKeys {
		Devs = 'devs',
		Blacklist = 'blacklist',
		Bday = 'bday',
		GuildConfig = 'guildConfig'
	}
*/
