/* eslint-disable indent */
import {
	APIEmbedField,
	ButtonInteraction,
	EmbedBuilder,
	GuildMember,
	MessageContextMenuCommandInteraction,
	ModalSubmitInteraction,
	PermissionFlagsBits,
	Snowflake,
	StageChannel,
	StringSelectMenuInteraction,
	UserContextMenuCommandInteraction,
	codeBlock,
	inlineCode,
	time,
	userMention
} from 'discord.js';
import { format } from 'prettier';
import { logger } from './logger';
import { openKv } from '@deno/kv';
import { DENO_KV_URL, DatabaseKeys } from './config';

const db = await openKv(DENO_KV_URL);

export const InteractionHandlers = {
	async Button(interaction: ButtonInteraction): Promise<void> {
		switch (interaction.customId) {
			case '/admin_channel_clear': {
				await interaction.deferReply({ ephemeral: true });
				if (
					!interaction.inGuild() ||
					!interaction.guild ||
					!interaction.channel
				) {
					await interaction.editReply(
						'Error: cannot clear this channel.\nCause: not in guild.'
					);
					return;
				}
				const channel = interaction.channel;
				if (
					!channel ||
					channel.isDMBased() ||
					channel.isVoiceBased() ||
					!channel.isTextBased() ||
					channel.isThread()
				)
					await interaction.editReply(
						'Error: cannot clear this channel.\nCause may be insufficient permissions or invalid channel type.'
					);
				else {
					for (const [, message] of await channel.messages.fetch()) {
						await message.delete();
					}
				}
				await interaction.editReply('Deleted all messages in this channel.');
				break;
			}
		}
	},
	ContextMenu: {
		async Message(
			interaction: MessageContextMenuCommandInteraction
		): Promise<void> {
			switch (interaction.commandName) {
				case 'Message JSON': {
					const json = await format(
						JSON.stringify(interaction.targetMessage.toJSON()),
						{
							parser: 'json5',
							tabWidth: 2,
							useTabs: false
						}
					);
					if (json.length > 1990) {
						if (
							!interaction.channel?.isTextBased() ||
							interaction.channel instanceof StageChannel
						)
							return;
						await interaction.reply(
							'JSON is too long, sending in multiple messages...'
						);
						const jsons = json.match(/[\s\S]{1,1990}/g) || [];
						for (const json of jsons) {
							await interaction.channel.send(codeBlock(json));
						}
					} else await interaction.reply(codeBlock(json));
					break;
				}
			}
		},
		async User(interaction: UserContextMenuCommandInteraction): Promise<void> {
			switch (interaction.commandName) {
				case 'User Info': {
					const infouser = await interaction.targetUser.fetch(true);
					const mutfields: APIEmbedField[] = [];
					if (interaction.guild && interaction.targetMember) {
						mutfields.push({
							name: 'Server join date',
							value: time(
								// eslint-disable-next-line no-extra-parens
								(interaction.targetMember as GuildMember).joinedAt || undefined
							)
						});
					}
					await interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setColor(infouser.hexAccentColor || null)
								.setTitle(`Who is ${infouser.tag}?`)
								.setThumbnail(infouser.displayAvatarURL())
								.addFields(
									{ name: 'ID:', value: infouser.id },
									{
										name: 'Discord join date:',
										value: time(infouser.createdAt)
									},
									{ name: 'Is bot?', value: infouser.bot.toString() }
								)
								.setTimestamp()
								.setFooter({
									iconURL: interaction.client.user.displayAvatarURL(),
									text: 'Powered by DisCog'
								})
								.addFields(mutfields)
						]
					});
					break;
				}
				case 'User JSON':
					await interaction.reply(
						codeBlock(
							await format(JSON.stringify(interaction.targetUser.toJSON()), {
								parser: 'json5',
								tabWidth: 2,
								useTabs: false
							})
						)
					);
			}
		}
	},
	async ModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
		switch (interaction.customId) {
			case '/contact_suggestion': {
				await interaction.deferReply({ ephemeral: true });
				const devs =
						(await db.get<Snowflake[]>([DatabaseKeys.Devs])).value ?? [],
					suggestion = interaction.fields.getTextInputValue('suggestion');
				if (!devs || devs.length === 0)
					throw new Error('No developers found in the database.');
				for (const devId of devs) {
					const dev = await interaction.client.users.fetch(devId);
					await dev.send({
						embeds: [
							new EmbedBuilder()
								.setTitle('New Suggestion')
								.setDescription(suggestion)
								.setTimestamp()
								.setFooter({
									iconURL: interaction.user.displayAvatarURL(),
									text: `Suggested by ${userMention(interaction.user.id)} (${
										interaction.user.tag
									})`
								})
						]
					});
				}
				await interaction.editReply(
					'Your suggestion sent to developers! Thanks so much for helping us improve this bot!'
				);
				break;
			}
			case '/global': {
				await interaction.reply('Working...');
				const content = interaction.fields.getTextInputValue('/global.text');
				const badGuilds: string[] = [];
				for (const guild of interaction.client.guilds.cache.values()) {
					if (
						!guild.systemChannel ||
						!guild.systemChannel
							.permissionsFor(
								guild.members.cache.get(
									interaction.client.user.id
								) as GuildMember
							)
							.has(PermissionFlagsBits.SendMessages)
					) {
						badGuilds.push(guild.name);
						guild
							.fetchOwner()
							.then(member => member.createDM())
							.then(dm =>
								dm.send({
									embeds: [
										new EmbedBuilder()
											.setTitle('DisCog Global System Announcement')
											.setDescription(
												`You are receiving this message because you are the owner of a guild which I am part of, and I have an important system message to deliver to your guild. However, your guild either does not have a system channel, or I do not have the necessary permissions to send the message. Because of this, I could not post the announcement. You can set a system channel by going to Server Settings > Overview > System Messages Channel and change channel permissions by right-clicking or long pressing (mobile) the system channel, selecting Edit Channel, and going to the Permissions category. In the meantime, please use my ${inlineCode(
													'/announce'
												)} command to deliver the following message to your guild.`
											)
											.setFields(
												{ name: 'Guild Name', value: guild.name },
												{ name: 'Message', value: content }
											)
									]
								})
							);
						return;
					}
					try {
						guild.systemChannel.send({
							// Remove @everyone ping: does content need to have a value?
							// eslint-disable-next-line capitalized-comments
							// content: '',
							embeds: [
								new EmbedBuilder()
									.setTitle('DisCog Global System Announcement')
									.setDescription(content)
									.setTimestamp()
									.setFooter({
										iconURL: interaction.user.displayAvatarURL(),
										text: `Sent by ${interaction.user.tag}`
									})
							]
						});
					} catch (e) {
						badGuilds.push(guild.name);
						guild
							.fetchOwner()
							.then(member => member.createDM())
							.then(dm =>
								dm.send({
									embeds: [
										new EmbedBuilder()
											.setTitle('DisCog Global System Announcement')
											.setDescription(
												`You are receiving this message because you are the owner of a guild which I am part of, and I have an important system message to deliver to your guild. However, your guild does not have a system channel, so I could not post the announcement. You can set a system channel by going to Server Settings > Overview > System Messages Channel. In the meantime, please use my ${inlineCode(
													'/announce'
												)} command to deliver the following message to your guild.`
											)
											.setFields(
												{ name: 'Guild Name', value: guild.name },
												{ name: 'Message', value: content }
											)
									]
								})
							);
						logger.error(e);
					}
				}
				await interaction.editReply(
					`Done. ${
						badGuilds.length > 0
							? `The following guilds did not receive the announcement: ${badGuilds.join(
									', '
								)}`
							: 'All guilds received the announcement.'
					}`
				);
				break;
			}
		}
	},
	async StringSelectMenu(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		interaction: StringSelectMenuInteraction
	): Promise<void> {}
};
