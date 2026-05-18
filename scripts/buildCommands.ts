import 'dotenv/config';
import { commandsPath, registerCommands } from './registerCommands';
import { argv } from 'process';
import { readdir } from 'fs/promises';

argv.shift();
argv.shift();

let commandFiles: string[];
if (argv.length == 0) {
	commandFiles = (await readdir(commandsPath)).filter((file) =>
		file.endsWith('.ts')
	);
} else {
	commandFiles = (await readdir(commandsPath)).filter(
		(file) => file.endsWith('.ts') && argv.includes(file.replace('.ts', ''))
	);
}
if (commandFiles.length == 0) {
	console.log('No commands found');
	process.exit(1);
}

console.log(`Registering ${commandFiles.length} commands...`);

console.log(
	await (
		await registerCommands(process.env.DISCORD_TOKEN as string, commandFiles)
	).getCommands()
);
