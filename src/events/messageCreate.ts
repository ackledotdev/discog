import { Events, Message } from 'discord.js';
import { getAutoDelete, scheduleAutoDelete } from '../lib/redis';

export const name = Events.MessageCreate;
export const once = false;

export const execute = async (message: Message) => {
	if (!message.inGuild()) return;

	const { content, channel, guild, id: messageId, createdAt } = message;

	const autoDelete = await getAutoDelete(guild.id, channel.id);
	if (!autoDelete) return;

	const { delay, matchMode, matchPattern } = autoDelete;

	if (matchMode === 'contains' && !content.includes(matchPattern)) return;
	if (matchMode === 'startswith' && !content.startsWith(matchPattern)) return;
	if (matchMode === 'endswith' && !content.endsWith(matchPattern)) return;

	await scheduleAutoDelete(
		guild.id,
		channel.id,
		messageId,
		delay * 60 * 1_000 + createdAt.getTime()
	);
};
