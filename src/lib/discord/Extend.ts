import { Client, ClientOptions } from 'discord.js';
import { Collection } from '@discordjs/collection';

/**
    export
*/ class ExtendedCollection<K, V> extends Collection<K, V> {
	constructor(entries?: ReadonlyArray<readonly [K, V]> | null) {
		super(entries);
	}

	freeze() {
		return Object.freeze(this);
	}
}

export class CommandClient extends Client {
	commands: ExtendedCollection<string, any>;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new ExtendedCollection();
	}
}
