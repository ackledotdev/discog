import { createClient } from 'redis';
import { SingleReactionRoleConfig } from '../schema';

export const REACTION_ROLES_KEYS = {
	EMOJI: 'emoji',
	MESSAGE: 'message',
	ROLE_ID: 'roleId'
} as const;

export function messageReactionRolesKey(messageId: string) {
	return `reactionroles:${messageId}`;
}

export async function createSingleReactionRole({
	emoji,
	message,
	roleId,
	targetMessageId
}: SingleReactionRoleConfig) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	await client.hSet(targetMessageId, {
		[REACTION_ROLES_KEYS.EMOJI]: emoji,
		[REACTION_ROLES_KEYS.MESSAGE]: message,
		[REACTION_ROLES_KEYS.ROLE_ID]: roleId
	});

	client.close();
}

export async function getSingleReactionRole(targetMessageId: string) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	const data = await client.hGetAll(targetMessageId);
	if (!data || !data[REACTION_ROLES_KEYS.ROLE_ID]) {
		await client.hDel(targetMessageId, [
			REACTION_ROLES_KEYS.ROLE_ID,
			REACTION_ROLES_KEYS.EMOJI,
			REACTION_ROLES_KEYS.MESSAGE
		]);
		client.close();
		return null;
	}

	client.close();

	return {
		emoji: data[REACTION_ROLES_KEYS.EMOJI],
		message: data[REACTION_ROLES_KEYS.MESSAGE],
		roleId: data[REACTION_ROLES_KEYS.ROLE_ID],
		targetMessageId
	} as SingleReactionRoleConfig;
}

export async function deleteSingleReactionRole(targetMessageId: string) {
	const client = await createClient({
		url: process.env.REDIS_URL
	}).connect();

	await client.hDel(targetMessageId, [
		REACTION_ROLES_KEYS.ROLE_ID,
		REACTION_ROLES_KEYS.EMOJI,
		REACTION_ROLES_KEYS.MESSAGE
	]);

	client.close();
	return;
}
