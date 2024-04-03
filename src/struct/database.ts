/* eslint-disable no-mixed-spaces-and-tabs */
import { Snowflake } from 'discord.js';

export interface BaseGuildConfig {
	auditlog?:
		| {
				enabled: true;
				channel: Snowflake;
		  }
		| {
				enabled?: false | null;
				channel?: null;
		  };
	birthdays?:
		| {
				enabled: true;
				channel: Snowflake;
		  }
		| {
				enabled?: false | null;
				channel?: null;
		  };
	greetings?:
		| {
				channel: Snowflake;
				goodbyeEnabled?: boolean;
				welcomeEnabled: true;
		  }
		| {
				channel: Snowflake;
				goodbyeEnabled: true;
				welcomeEnabled?: boolean;
		  }
		| {
				channel?: null;
				goodbyeEnabled?: false;
				welcomeEnabled?: false;
		  };
	systemchannel?: Snowflake | null;
}

export interface PopulatedGuildConfig extends BaseGuildConfig {
	auditlog:
		| {
				enabled: true;
				channel: Snowflake;
		  }
		| {
				enabled: false;
				channel: null;
		  };
	birthdays:
		| {
				enabled: true;
				channel: Snowflake;
		  }
		| {
				enabled: false;
				channel: null;
		  };
	greetings:
		| {
				channel: Snowflake;
				goodbyeEnabled: boolean;
				welcomeEnabled: true;
		  }
		| {
				channel: Snowflake;
				goodbyeEnabled: true;
				welcomeEnabled: boolean;
		  }
		| {
				channel: null;
				goodbyeEnabled: false;
				welcomeEnabled: false;
		  };
	systemchannel: Snowflake | null;
}

export interface BirthdayData {
	month: number;
	date: number;
}
