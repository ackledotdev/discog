import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
	channelMention,
	inlineCode,
	time,
	userMention
} from 'discord.js';
import { CommandHelpEntry } from '../struct/CommandHelpEntry';

export const data = new SlashCommandBuilder()
	.setName('info')
	.setDescription('Get some info')
	.addSubcommand(subcommand => {
		return subcommand.setName('guild').setDescription('Guild info');
	})
	.addSubcommand(subcommand => {
		return subcommand.setName('channel').setDescription('Channel info');
	})
	.setContexts(InteractionContextType.Guild);

export const help = new CommandHelpEntry('info', 'Gets some info', [
	'channel',
	'guild'
]);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.reply('Working...');
	switch (interaction.options.getSubcommand(false)) {
		case 'channel':
			if (
				!interaction.channel ||
				interaction.channel.type != ChannelType.GuildText
			) {
				interaction.editReply(
					`Error: Not in a ${inlineCode('GuildText')} channel`
				);
				return;
			}
			const channel = await interaction.channel.fetch();
			await interaction.editReply({
				embeds: [
					new EmbedBuilder().setTitle('Channel Info').addFields(
						{ name: 'Name', value: channel.name },
						{ name: 'Description', value: channel.topic || 'None' },
						{ name: 'Channel ID', value: channel.id },
						{ name: 'URL', value: channel.url },
						{ name: 'Created At', value: time(channel.createdAt) },
						{
							name: 'Rate Limit',
							value: channel.rateLimitPerUser.toFixed(0)
						},
						{ name: 'NSFW', value: channel.nsfw.toString() }
					)
				]
			});
			break;
		case 'guild':
			if (!interaction.guild) {
				await interaction.editReply('Error: Not in a guild');
				return;
			}
			const guild = await interaction.guild.fetch();
			if (!guild.available) {
				await interaction.editReply('Internal error: Guild not available');
				return;
			}
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Guild Info')
						.addFields(
							{ name: 'Name', value: guild.name },
							{ name: 'Description', value: guild.description || 'None' },
							{ name: 'Guild ID', value: guild.id },
							{ name: 'Member Count', value: guild.memberCount.toString() },
							{
								name: 'Owner',
								value: `${
									(await guild.fetchOwner()).user.username
								} (${userMention(guild.ownerId)})`
							},
							{
								name: 'Created At',
								value: time(guild.createdAt)
							},
							{
								name: 'System Channel',
								value: guild.systemChannel
									? channelMention(guild.systemChannel.id)
									: 'None'
							},
							{
								name: 'Rules Channel',
								value: guild.rulesChannel
									? channelMention(guild.rulesChannel.name)
									: 'None'
							},
							{
								name: 'AFK Channel',
								value: guild.afkChannel
									? channelMention(guild.afkChannel.name)
									: 'None'
							},
							{
								name: 'Public Updates Channel',
								value: guild.publicUpdatesChannelId
									? channelMention(guild.publicUpdatesChannelId)
									: 'None'
							}
						)
						.setThumbnail(guild.iconURL())
						.setFooter({
							iconURL: interaction.client.user.displayAvatarURL(),
							text: 'Powered by DisCog'
						})
				]
			});
			break;
	}
};
