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

export interface SingleReactionRoleConfig {
	roleId: Snowflake;
	targetMessageId: Snowflake;
	emoji: string;
	message: string;
}
