import { Snowflake } from 'discord.js';

export interface GuildConfig {
	auditlogChannel: Snowflake | null;
	greetings: GuildGreetingsConfig;
	systemChannel: Snowflake | null;
}

export interface GuildGreetingsConfig {
	channel: Snowflake | null;
	welcomeEnabled: boolean;
	goodbyeEnabled: boolean;
}

export type ReactionRoleStashKey = `reactionroles:${string}:${string}`;

export interface MultipleReactionRoleStash {
	channelId: Snowflake | null;
	message: string | null;
	roles: {
		emoji: string | null;
		roleId: Snowflake;
	}[];
}
