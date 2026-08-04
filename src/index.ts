import 'dotenv/config';

import {
	ActivityType,
	Colors,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	MessageFlags,
	OAuth2Scopes,
	PresenceUpdateStatus,
	TimestampStyles,
	codeBlock,
	time
} from 'discord.js';
import { CommandClient } from './lib/discord/Extend';
import { METHODS, createServer } from './server';
import { PORT, permissionsBits } from './config';
import { argv, cwd, stdout } from 'process';
import { InteractionHandlers } from './interactionHandlers';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger';
import { readdirSync } from 'fs';
import { Jsoning, JSONValue } from 'jsoning';
import { Request, Response } from 'express';
import {
	AUTODELETE_KEYS,
	autoDeleteEntryKey,
	fetchAutoDeleteMessages,
	getDeveloperIds,
	isBlacklisted
} from './lib/redis';
import { Command } from './lib/discord/types';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { createClient } from 'redis';

argv.shift();
argv.shift();

if (argv.includes('-d')) {
	logger.level = 'debug';
	logger.debug('Debug mode enabled.');
}

const client = new CommandClient({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.MessageContent
	],
	presence: {
		activities: [
			{
				name: '/about',
				type: ActivityType.Playing
			}
		],
		afk: false,
		status: PresenceUpdateStatus.Online
	}
});

const server = createServer(
	{
		handler: (_req: Request, res: Response) =>
			res.redirect(
				client.generateInvite({
					permissions: permissionsBits,
					scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
				})
			),
		method: METHODS.GET,
		route: '/invite'
	},
	{
		handler: (_req: Request, res: Response) => res.redirect('/status'),
		method: METHODS.GET,
		route: '/'
	},
	{
		handler: (_req: Request, res: Response) => {
			res.sendStatus(client.isReady() ? 200 : 503);
		},
		method: METHODS.GET,
		route: '/status'
	},
	{
		handler: (req: Request, res: Response) => {
			if (
				req.headers['content-type'] !== 'application/json' &&
				req.headers['content-type'] != undefined
			)
				res.status(415).end();
			else if (client.isReady())
				res
					.status(200)
					.contentType('application/json')
					.send({
						clientPing: client.ws.ping,
						clientReady: client.isReady(),
						commandCount: client.application.commands.cache.size,
						guildCount: client.application.approximateGuildCount,
						lastReady: client.readyAt.valueOf(),
						timestamp: Date.now(),
						uptime: client.uptime
					})
					.end();
			else res.status(503).end();
		},
		method: METHODS.GET,
		route: '/bot'
	},
	{
		handler: (req: Request, res: Response) => {
			if (
				req.headers['content-type'] !== 'application/json' &&
				req.headers['content-type'] != undefined
			)
				res.status(415).end();
			else if (client.isReady())
				res
					.status(200)
					.contentType('application/json')
					.send({
						commands: client.commands.map((command) => ({
							data: command.data.toJSON(),
							help: command.help?.toJSON()
						})),
						timestamp: Date.now()
					})
					.end();
			else res.status(503).end();
		},
		method: METHODS.GET,
		route: '/commands'
	}
);

const commandsPath = join(dirname(fileURLToPath(import.meta.url)), 'commands');
const commandFiles = readdirSync(commandsPath).filter((file) =>
	file.endsWith('.ts')
);

const cmndb = new Jsoning('botfiles/cmnds.db.json');
for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	logger.debug(`Loading command ${filePath}`);
	const command: Command = await import(filePath);
	client.commands.set(command.data.name, command);
	if (command.help)
		await cmndb.set(
			command.data.name,
			command.help.toJSON() as unknown as JSONValue
		);
}
client.commands.freeze();
logger.info('Loaded commands.');

const eventsPath = join(cwd(), 'src', 'events');
const eventFiles = readdirSync(eventsPath).filter((file) =>
	file.endsWith('.ts')
);
for (const file of eventFiles) {
	const filePath = join(eventsPath, file);
	const event = await import(filePath);
	if (event.once)
		client.once(event.name, async (...args) => await event.execute(...args));
	else client.on(event.name, async (...args) => await event.execute(...args));
}
logger.info('Loaded events.');

client
	.on(Events.ClientReady, () => logger.info('Client#ready'))
	.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.user.bot) return;

		try {
			if (
				(await isBlacklisted(interaction.user.id)) &&
				interaction.isCommand()
			) {
				await interaction.reply({
					content: 'You are blacklisted from using this bot.',
					flags: MessageFlags.Ephemeral
				});
				return;
			}
		} catch (e) {
			logger.error(e);
		}

		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) {
				await interaction.reply('Internal error: Command not found');
				return;
			}
			try {
				await command.execute(interaction);
			} catch (e) {
				logger.error(e);
				if (interaction.replied || interaction.deferred)
					await interaction.editReply(
						'There was an error while running this command.'
					);
				else
					await interaction.reply({
						content: 'There was an error while running this command.',
						flags: MessageFlags.Ephemeral
					});
			}
		} else if (interaction.isModalSubmit()) {
			try {
				await InteractionHandlers.ModalSubmit(interaction);
			} catch (e) {
				try {
					if (interaction.replied)
						await interaction.editReply({
							content: 'There was an error while running this command.'
						});
					else
						await interaction.reply({
							content: 'There was an error while running this command.',
							flags: MessageFlags.Ephemeral
						});
				} catch (e) {
					logger.error(e);
				}
				logger.error(e);
			}
		} else if (interaction.isButton()) {
			try {
				await InteractionHandlers.Button(interaction);
			} catch (e) {
				try {
					await interaction.reply({
						content: 'There was an error while running this command.',
						flags: MessageFlags.Ephemeral
					});
				} catch {
					await interaction.editReply(
						'There was an error while running this command.'
					);
					logger.error(e);
				}
			}
		} else if (interaction.isUserContextMenuCommand()) {
			try {
				await InteractionHandlers.ContextMenu.User(interaction);
			} catch {
				try {
					await interaction.reply({
						content: 'There was an error while running this command.',
						flags: MessageFlags.Ephemeral
					});
				} catch (e) {
					logger.error(e);
				}
			}
		} else if (interaction.isMessageContextMenuCommand()) {
			try {
				await InteractionHandlers.ContextMenu.Message(interaction);
			} catch {
				try {
					await interaction.reply({
						content: 'There was an error while running this command.',
						flags: MessageFlags.Ephemeral
					});
				} catch (e) {
					logger.error(e);
				}
			}
		} else if (interaction.isStringSelectMenu()) {
			try {
				await InteractionHandlers.StringSelectMenu(interaction);
			} catch {
				try {
					await interaction.reply({
						content: 'There was an error while running this command.',
						flags: MessageFlags.Ephemeral
					});
				} catch (e) {
					logger.error(e);
				}
			}
		}
	})
	.on(Events.Debug, (m) => logger.debug(m))
	.on(Events.Error, (m) => {
		logger.error(m);
		sendError(m);
	})
	.on(Events.Warn, (m) => logger.warn(m));

const scheduler = new ToadScheduler();
const autodeleteJob = new SimpleIntervalJob(
	{
		// minutes: 1,
		seconds: 30,
		runImmediately: true
	},
	new AsyncTask('autodelete messages', async () => {
		const messages = await fetchAutoDeleteMessages();
		const redisClient = await createClient({
			url: process.env.REDIS_URL
		}).connect();

		const redisOps = [];
		for (const { messageId, channelId, guildId } of messages) {
			redisOps.push(
				redisClient.zRem(
					AUTODELETE_KEYS.AUTODELETE_SORTSET,
					autoDeleteEntryKey(guildId, channelId, messageId)
				)
			);
			let channel = await client.channels.fetch(channelId).catch(() => null);
			if (!channel)
				channel = await client.guilds
					.fetch(guildId)
					.then((guild) => guild.channels.fetch(channelId))
					.catch(() => null);
			if (!channel || !channel.isTextBased()) continue;
			await channel.messages
				.fetch(messageId)
				.then((msg) => msg.delete())
				.catch();
		}
		Promise.allSettled(redisOps)
			.then(() => redisClient.close())
			.catch(() => redisClient.close());
	})
);

client.login(process.env.DISCORD_TOKEN).then(() => {
	logger.info('Logged in.');
	scheduler.addSimpleIntervalJob(autodeleteJob);
	logger.info('Started auto-delete scheduler.');
});

process.on('SIGINT', () => {
	sendError(new Error('SIGINT received.'));
	client.destroy();
	stdout.write('\n');
	logger.info('Destroyed Client.');
	process.exit(0);
});

server.listen(process.env.PORT ?? PORT);
logger.info(`Listening to HTTP server on port ${process.env.PORT ?? PORT}.`);

process.on('uncaughtException', sendError);
process.on('unhandledRejection', sendError);

logger.info('Process setup complete.');

async function sendError(e: unknown) {
	for (const devId of await getDeveloperIds()) {
		client.users.fetch(devId).then((user) => {
			const date = new Date();
			user.send({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error Log')
						.setDescription(e instanceof Error ? e.message : String(e))
						.addFields({
							name: 'Stack Trace',
							value: codeBlock(
								e instanceof Error
									? (e.stack ?? 'No stack trace available')
									: String(e)
							)
						})
						.addFields({
							name: 'ISO 8601 Timestamp',
							value: date.toISOString()
						})
						.addFields({
							name: 'Localized DateTime',
							value: time(date, TimestampStyles.FullDateShortTime)
						})
						.setColor(Colors.Red)
						.setTimestamp()
				]
			});
		});
	}
}
