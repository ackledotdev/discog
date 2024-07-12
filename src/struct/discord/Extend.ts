import { Client, ClientOptions } from 'discord.js';
import { Collection, ReadonlyCollection } from '@discordjs/collection';
import { Command } from './types';

/**
	export
*/ class ExtendedCollection<K, V> extends Collection<K, V> {
	constructor(entries?: readonly (readonly [K, V])[] | null) {
		super(entries);
	}
	public freeze(): ReadonlyCollection<K, V> {
		return Object.freeze(this);
	}
}

export class CommandClient extends Client {
	commands: ExtendedCollection<string, Command>;

	constructor(options: ClientOptions) {
		super(options);

		this.commands = new ExtendedCollection<string, Command>();
	}
}
