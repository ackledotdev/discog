import {
	APIEmbedField,
	RestOrArray,
	inlineCode,
	normalizeArray
} from 'discord.js';

/**
 * Represents a command entry in the help command
 * @class
 */
export class CommandHelpEntry {
	description: string;
	name: string;
	_usage: string[] | undefined;

	/**
	 * Creates a new command entry
	 * @constructor
	 * @param {string} name the name of the command
	 * @param {string} description the description of the command
	 * @param {string[]} usage the usage of the command
	 */
	constructor(
		name: string,
		description: string,
		...usage: RestOrArray<string>
	) {
		/**
		 * The name of the command
		 * @type {string}
		 * @private
		 * @readonly
		 */
		this.name = name;
		/**
		 * The description of the command
		 * @type {string}
		 * @public
		 * @readonly
		 */
		this.description = description;
		/**
		 * The usage of the command
		 * @type {string[]}
		 * @private
		 * @readonly
		 */
		this._usage = normalizeArray(usage);
	}

	/**
	 * The usage of the command
	 * @type {string[]}
	 * @readonly
	 */
	get usage(): string[] {
		if (!this._usage) return [inlineCode(`/${this.name}`)];
		return this._usage.map(val => inlineCode(`/${this.name} ${val}`));
	}

	/**
	 * Converts the command entry to a Discord API embed field
	 * @returns {APIEmbedField}
	 */
	toDiscordAPIEmbedField(): APIEmbedField {
		return {
			name: this.name,
			value: `${this.description}\n${this.usage.join('\n')}`
		};
	}

	/**
	 * Converts the command entry to a JSON object
	 * @returns {SerializedCommandHelpEntry}
	 */
	toJSON(): SerializedCommandHelpEntry {
		return {
			description: this.description,
			name: this.name,
			usage: this._usage
		};
	}

	/**
	 * Creates a new command entry from a JSON object
	 * @param json {{description: string, name: string, usage?: string[]}
	 * @returns {CommandHelpEntry}
	 */
	static fromJSON(json: SerializedCommandHelpEntry): CommandHelpEntry {
		return new CommandHelpEntry(json.name, json.description, json.usage ?? []);
	}
}

interface SerializedCommandHelpEntry {
	description: string;
	name: string;
	usage?: string[];
}
