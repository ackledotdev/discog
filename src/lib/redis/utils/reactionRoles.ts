import { createClient, RedisClientType } from 'redis';
import { MultipleReactionRoleStash, ReactionRoleStashKey } from '../schema';
import { Snowflake } from 'discord.js';

export const REACTION_ROLES_JSON_PATHS = {
	CHANNEL_ID: '$.channelId',
	MESSAGE: '$.message',
	ROLES: '$.roles'
} as const;

export function reactionRoleStashKey(
	guildId: Snowflake,
	userId: Snowflake
): ReactionRoleStashKey {
	return `reactionroles:${guildId}:${userId}`;
}

export function parseReactionRoleStashKey(key: ReactionRoleStashKey) {
	const parts = key.split(':');
	return {
		guildId: parts[1],
		userId: parts[2]
	};
}

const emptyReactionRoleStash = {
	channelId: null,
	message: null,
	roles: []
} satisfies MultipleReactionRoleStash;

async function initializeEmptyReactionRoleStash(
	client: RedisClientType,
	key: ReactionRoleStashKey
) {
	await client.json.set(key, '$', emptyReactionRoleStash);
}

export async function createReactionRoleStash(
	guildId: Snowflake,
	userId: Snowflake,
	overwrite = false
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	if (!overwrite) {
		if (await client.exists(key)) {
			client.close();
			return;
		}
	}

	await initializeEmptyReactionRoleStash(client, key);

	client.close();
}

export async function getReactionRoleStashRoleCount(
	guildId: Snowflake,
	userId: Snowflake
): Promise<number> {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	if (!(await client.exists(key))) {
		await initializeEmptyReactionRoleStash(client, key);
		return 0;
	}

	const count = (await client.json.arrLen(key, {
		path: REACTION_ROLES_JSON_PATHS.ROLES
	})) as number | null;

	client.close();

	return count ?? 0;
}

export async function getReactionRoleStash(
	guildId: Snowflake,
	userId: Snowflake
): Promise<MultipleReactionRoleStash | null> {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	const stash = (await client.json.get(
		key
	)) as MultipleReactionRoleStash | null;

	client.close();

	return stash;
}

export async function clearReactionRoleStash(
	guildId: Snowflake,
	userId: Snowflake
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);
	await client.del(key);

	client.close();
}

export async function setReactionRoleStashChannel(
	guildId: Snowflake,
	userId: Snowflake,
	channelId: Snowflake
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	if (!(await client.exists(key)))
		await initializeEmptyReactionRoleStash(client, key);

	await client.json.set(key, REACTION_ROLES_JSON_PATHS.CHANNEL_ID, channelId);

	client.close();
}

export async function setReactionRoleStashMessage(
	guildId: Snowflake,
	userId: Snowflake,
	message: string
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	if (!(await client.exists(key)))
		await initializeEmptyReactionRoleStash(client, key);

	await client.json.set(key, REACTION_ROLES_JSON_PATHS.MESSAGE, message);

	client.close();
}

/**
 * @returns true if the role was added, false if it was already present
 */
export async function addReactionRoleStashRole(
	guildId: Snowflake,
	userId: Snowflake,
	emoji: string | null,
	roleId: Snowflake
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	if (!(await client.exists(key)))
		await initializeEmptyReactionRoleStash(client, key);

	if (
		(
			(await client.json.get(key, {
				path: REACTION_ROLES_JSON_PATHS.ROLES
			})) as MultipleReactionRoleStash['roles'][]
		).some((arr) => arr.some((entry) => entry.roleId === roleId))
	) {
		client.close();
		return false;
	}

	await client.json.arrAppend(key, REACTION_ROLES_JSON_PATHS.ROLES, {
		emoji,
		roleId
	} satisfies MultipleReactionRoleStash['roles'][number]);

	client.close();
	return true;
}

/**
 * @returns true if the role was found and removed, false otherwise
 */
export async function removeReactionRoleStashRole(
	guildId: Snowflake,
	userId: Snowflake,
	roleId: Snowflake
) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const key = reactionRoleStashKey(guildId, userId);

	if (!(await client.exists(key))) {
		await initializeEmptyReactionRoleStash(client, key);
		client.close();
		return false;
	}

	const roles = (await client.json.get(key, {
		path: REACTION_ROLES_JSON_PATHS.ROLES
	})) as MultipleReactionRoleStash['roles'];

	const index = roles.findIndex((entry) => entry.roleId === roleId);
	if (index !== -1)
		await client.json.arrPop(key, {
			path: REACTION_ROLES_JSON_PATHS.ROLES,
			index
		});

	client.close();

	return index !== -1;
}
