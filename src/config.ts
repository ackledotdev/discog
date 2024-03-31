import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';

// % Production
// export const clientId = '1150536178714554459';
// % Development
export const clientId = '1034561538721325056';

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

export const DENO_KV_URL =
	'https://api.deno.com/databases/bc5eaf7a-b565-43fd-bfe7-e1512d18f69d/connect';

export enum DatabaseKeys {
	Devs = 'devs',
	Blacklist = 'blacklist',
	Bday = 'bday',
	GuildConfig = 'guildConfig',
	ErrorLog = 'errorLog'
}
