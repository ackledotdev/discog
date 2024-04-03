import 'dotenv/config';
import {
	ActivityType,
	CategoryChannel,
	ChannelType,
	Colors,
	EmbedBuilder,
	Events,
	ForumChannel,
	GatewayIntentBits,
	MediaChannel,
	OAuth2Scopes,
	PresenceUpdateStatus,
	Snowflake,
	TimestampStyles,
	codeBlock,
	time,
	userMention
} from 'discord.js';
import { CommandClient } from './struct/discord/Extend';
import { Methods, createServer } from './server';
import { DENO_KV_URL, DatabaseKeys, PORT, permissionsBits } from './config';
import { argv, cwd, stdout } from 'process';
import { Command, Event } from './struct/discord/types';
import { InteractionHandlers } from './interactionHandlers';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger';
import { readdirSync } from 'fs';
import { scheduleJob } from 'node-schedule';
import { openKv } from '@deno/kv';
import { Jsoning } from 'jsoning';
import { BirthdayData } from './struct/database';

argv.shift();
argv.shift();
if (argv.includes('-d')) {
	logger.level = 'debug';
	logger.debug('Debug mode enabled.');
}

const db = await openKv(DENO_KV_URL);
logger.debug('Loaded dev database.');

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
logger.debug('Created client instance.');

const server = createServer(
	{
		handler: (_req, res) =>
			res.redirect(
				client.generateInvite({
					permissions: permissionsBits,
					scopes: [
						OAuth2Scopes.ApplicationsCommands,
						OAuth2Scopes.ApplicationsCommandsUpdate,
						OAuth2Scopes.ApplicationCommandsPermissionsUpdate,
						OAuth2Scopes.Bot,
						OAuth2Scopes.Guilds,
						OAuth2Scopes.Identify
					]
				})
			),
		method: Methods.GET,
		route: '/invite'
	},
	{
		handler: (_req, res) => res.sendStatus(200),
		method: Methods.GET,
		route: '/'
	},
	{
		handler: (req, res) => {
			if (
				req.headers['content-type'] != 'application/json' &&
				req.headers['content-type'] != undefined
			)
				res.status(415).end();
			else if (client.isReady())
				res
					.header({
						'Access-Control-Allow-Origin': 'https://discog.localplayer.dev',
						Vary: 'Origin'
					})
					.status(200)
					.contentType('application/json')
					.send({
						clientPing: client.ws.ping,
						clientReady: client.isReady(),
						commandCount: client.application!.commands.cache.size,
						guildCount: client.application!.approximateGuildCount,
						lastReady: client.readyAt!.valueOf(),
						timestamp: Date.now(),
						uptime: client.uptime
					})
					.end();
			else res.status(503).end();
		},
		method: Methods.GET,
		route: '/api/bot'
	}
);
logger.debug('Created server instance.');

const commandsPath = join(dirname(fileURLToPath(import.meta.url)), 'commands');
const commandFiles = readdirSync(commandsPath).filter(file =>
	file.endsWith('.ts')
);
logger.debug('Loaded command files.');
const cmndb = new Jsoning('botfiles/cmnds.db.json');
for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	logger.debug(`Loading command ${filePath}`);
	const command: Command = await import(filePath);
	client.commands.set(command.data.name, command);
	if (command.help)
		await cmndb.set(
			command.data.name,
			// @ts-expect-error types
			command.help.toJSON()
		);
}
client.commands.freeze();
logger.info('Loaded commands.');

const eventsPath = join(cwd(), 'src', 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts'));
for (const file of eventFiles) {
	const filePath = join(eventsPath, file);
	const event: Event = await import(filePath);
	if (event.once)
		client.once(event.name, async (...args) => await event.execute(...args));
	else client.on(event.name, async (...args) => await event.execute(...args));
}
logger.debug('Loaded events.');

client
	.on(Events.ClientReady, () => logger.info('Client#ready'))
	.on(Events.InteractionCreate, async interaction => {
		if (interaction.user.bot) return;
		const blacklisted = (await db.get<Snowflake[]>([DatabaseKeys.Blacklist]))
			?.value;
		if (
			(blacklisted ?? []).includes(interaction.user.id) &&
			interaction.isCommand()
		) {
			await interaction.reply({
				content: 'You are blacklisted from using this bot.',
				ephemeral: true
			});
			return;
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
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply(
						'There was an error while running this command.'
					);
				} else {
					await interaction.reply({
						content: 'There was an error while running this command.',
						ephemeral: true
					});
				}
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
							ephemeral: true
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
						ephemeral: true
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
						ephemeral: true
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
						ephemeral: true
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
						ephemeral: true
					});
				} catch (e) {
					logger.error(e);
				}
			}
		}
	})
	.on(Events.Debug, m => logger.debug(m))
	.on(Events.Error, m => logger.error(m))
	.on(Events.Warn, m => logger.warn(m));
logger.debug('Set up client events.');

await client
	.login(process.env.DISCORD_TOKEN)
	.then(() => logger.info('Logged in.'));

process.on('SIGINT', () => {
	client.destroy();
	stdout.write('\n');
	logger.info('Destroyed Client.');
	process.exit(0);
});

// Schedule the bdayInterval function to run every day at 12:00 AM PST for a server running 7 hours ahead of PST
scheduleJob('0 7 * * *', () => bdayInterval().catch(e => logger.error(e)));
logger.debug('Scheduled birthday interval.');

server.listen(process.env.PORT ?? PORT);
logger.info(`Listening to HTTP server on port ${process.env.PORT ?? PORT}.`);

process.on('uncaughtException', sendError);
process.on('unhandledRejection', sendError);
logger.debug('Set up error handling.');

logger.info('Process setup complete.');

async function bdayInterval() {
	const today = new Date();
	const allBirthdays: { id: string; data: BirthdayData }[] = [];
	for await (const val of db.list({ prefix: [DatabaseKeys.Bday] }))
		allBirthdays.push({
			id: val.key[1].toString(),
			data: val.value as BirthdayData
		});
	const birthdaysToday = allBirthdays.filter(
		({ data }) =>
			data.month == today.getMonth() + 1 && data.date == today.getDate()
	);
	for (const { id } of birthdaysToday) {
		const user = await client.users.fetch(id);
		for (let guild of client.guilds.cache.values()) {
			guild = await guild.fetch();
			if (!guild.members.cache.has(id)) return;
			const birthdayChannels = guild.channels.cache.filter(channel => {
				return !!(
					(channel.type == ChannelType.GuildAnnouncement ||
						channel.type == ChannelType.GuildText) &&
					(channel.name.toLowerCase().includes('bday') ||
						channel.name.toLowerCase().includes('birthday') ||
						channel.name.toLowerCase().includes('b-day'))
				);
			});
			const channel = birthdayChannels.first() || guild.systemChannel || null;
			if (
				!channel ||
				channel instanceof CategoryChannel ||
				channel instanceof ForumChannel ||
				channel instanceof MediaChannel
			)
				continue;
			const replies = [
				`Do you know what day it is? It's ${userMention(user.id)}'s birthday!`,
				`It's ${userMention(user.id)}'s birthday!`,
				`Time to celebrate ${userMention(user.id)}'s birthday!`,
				`Everyone wish ${userMention(user.id)} a happy birthday!`,
				`Happy birthday, ${userMention(user.id)}!`,
				`🎉${userMention(user.id)}🎉\n${codeBlock(
					`new Birthday({
	user: '${userMention(user.id)}',
	day: ${today.toLocaleDateString()}
});`
				)}`
			];
			await channel.send(replies[Math.floor(replies.length * Math.random())]);
		}
	}
}

async function sendError(e: Error) {
	for (const devId of (await db.get<Snowflake[]>([DatabaseKeys.Devs]))?.value ??
		[]) {
		client.users.fetch(devId).then(user => {
			const date = new Date();
			user.send({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error Log')
						.setDescription(e.message)
						.addFields({ name: 'Stack Trace', value: codeBlock(e.stack ?? '') })
						.addFields({
							name: 'ISO 8601 Timestamp',
							value: date.toISOString()
						})
						.addFields({
							name: 'Localized DateTime',
							value: time(date, TimestampStyles.LongDateTime)
						})
						.setColor(Colors.Red)
						.setTimestamp()
				]
			});
		});
	}
}
