import { Client,  TextChannel, DMChannel, MessageOptions, ChannelLogsQueryOptions,  Guild, PresenceData } from 'discord.js';
import { EngineInstance, EngineCommand, EngineCall, EngineListenOptions, EngineEditOptions } from '../types/engine';
import selectGuild from './controllers/selectGuild';
import selectChannel from './controllers/selectChannel';
import fetchGuild from './controllers/fetchGuild';
import fetchChannel from './controllers/fetchChannel';
import fetchUser from './controllers/fetchUser';
import fetchMember from './controllers/fetchMember';
import showGuilds from './controllers/showGuilds';
import showChannels from './controllers/showChannels';
import showMembers from './controllers/showMembers';
import updatePrecense from './controllers/updatePresence';
import sendMessage from './controllers/sendMessage';
import editMessage from './controllers/editMessage';
import deleteMessage from './controllers/deleteMessage';
import deleteMessages from './controllers/deleteMessages';
import readChannel from './controllers/readChannel';
import listenClient from './controllers/listenClient';
import listenGuild from './controllers/listenGuild';
import listenChannel from './controllers/listenChannel';
import { EngineError } from './errors';
import { SerialGuild, SerialChannel, SerialUser, SerialMember, SerialPresence, SerialMessage } from '../types/serial';

/** Engine#instance EngineInstance containing context variables */
class Instance implements EngineInstance {
    /**
     * Init an instance
     * @param discordToken - discord bot token
     * @param currentGuild - Instance guild
     * @param currentChannel - Instance channel
     */
    constructor (public discordToken?: string, public currentGuild?: Guild, public currentChannel?: TextChannel | DMChannel) {

    }
}

/** discordquery engine class */
export class Engine {
    /** The Discord.Client instance used with the engine */
    client: Client;
    /** The discord bot token to use with the client */
    discordToken?: string;
    /** The EngineInstance containing context variables */
    instance: EngineInstance;
    /** Internal callstack for executeStack */
    stack: Array<EngineCall> = [];

    /**
     *  Create Engine
     * @param discordToken - discord bot token
     */
    constructor (discordToken?: string) {
        this.client = new Client();
        this.discordToken = discordToken;
        this.instance = new Instance(discordToken);
    }

    /** Initializes discord instance */
    async login (discordToken?: string): Promise<void> {
        try {
            this.client = new Client();
            await this.client.login(discordToken || this.discordToken);
        } catch (error) {
            throw new EngineError('login', this, 'Invalid Discord Token');
        }
    }

    /**
     * Add a call to Engine#stack
     * @param command - EngineCommand command
     * @param args - Arguments needed by the command
     */
    pushStack<K extends keyof EngineCommand> (command: K, args: EngineCommand[K]): void {
        this.stack.push({
            command: command,
            args: args
        });
    }

    /**
     * Run over Engine#stack and execute each command
     * @param callback - handle all command returns (values)
     */
    async executeStack (callback: (command: keyof EngineCommand, value: any) => void): Promise<void> {
        for (let i = 0; i < this.stack.length; i++) {
            const value = await this.execute(this.stack[i].command, ...this.stack[i].args);
            callback(this.stack[i].command, value);
            this.stack = this.stack.filter((_item, index) => index === i);
        }
    }

    /**
     * Execute any command from EngineCommand and ensure Engine#Client is connected beforehand
     * @param command - EngineCommand command
     * @param args - Arguments needed by the command
     */
    async execute<K extends keyof EngineCommand> (command: K, ...args: EngineCommand[K] ): Promise<any> {
        return new Promise(async (resolve, reject) => {
            if (command === 'login') {
                await this.login(args[0] as string).then(resolve).catch(reject);
            } else if (!this.client.token) {
                await this.login().then(resolve).catch(reject);
            }

            switch (command) {
                case 'selectGuild': this.selectGuild(args[0] as string).then(resolve).catch(reject); break;
                case 'selectChannel': this.selectChannel(args[0] as string).then(resolve).catch(reject); break;
                case 'fetchGuild': this.fetchGuild(args[0] as string).then(resolve).catch(reject); break;
                case 'fetchChannel': this.fetchChannel(args[0] as string).then(resolve).catch(reject); break;
                case 'fetchUser':  this.fetchUser(args[0] as string).then(resolve).catch(reject); break;
                case 'fetchMember': this.fetchMember(args[0] as string).then(resolve).catch(reject); break;
                case 'showGuilds': this.showGuilds(args[0] ? args[0] as string : undefined).then(resolve).catch(reject); break;
                case 'showChannels': this.showChannels(args[0] ? args[0] as string : undefined).then(resolve).catch(reject); break;
                case 'showMembers':  this.showChannels(args[0] ? args[0] as string : undefined).then(resolve).catch(reject); break;
                case 'updatePrecense': this.updatePrecense(args[0] as PresenceData).then(resolve).catch(reject); break;
                case 'sendMessage': this.sendMessage(args[0] as MessageOptions).then(resolve).catch(reject); break;
                case 'editMessage': this.editMessage(args[0] as EngineEditOptions).then(resolve).catch(reject); break;
                case 'deleteMessage': this.deleteMessage(args[0] as string).then(resolve).catch(reject); break;
                case 'deleteMessages': this.deleteMessages(args[0] as ChannelLogsQueryOptions).then(resolve).catch(reject); break;
                case 'readChannel': this.readChannel(args[0] as ChannelLogsQueryOptions).then(resolve).catch(reject); break;
                case 'listenClient': this.listenClient(args[0] as EngineListenOptions).then(resolve).catch(reject); break;
                case 'listenGuild': this.listenClient(args[0] as EngineListenOptions).then(resolve).catch(reject); break;
                case 'listenChannel': this.listenClient(args[0] as EngineListenOptions).then(resolve).catch(reject); break;
            }
        });
    }

    /**
     * Set guild in Engine#instance
     * @param guildID - discord guild id to select
     */
    async selectGuild (guildID: string): Promise<void> {
        if (!this.client || !/\d{18}/.test(guildID)) throw new EngineError('selectGuild', this);
        this.instance.currentGuild = await selectGuild(this.client, guildID);
    }

    /**
     * Set channel in Engine#instance
     * @param channelID - discord channel id to select
     */
    async selectChannel (channelID: string): Promise<void> {
        if (!this.client || !/\d{18}/.test(channelID)) throw new EngineError('selectChannel', this);
        this.instance.currentChannel = await selectChannel(this.client, channelID);
    }

    /**
     * Get Discord.Guild by id
     * @param guildID - discord guild id to fetch
     */
    async fetchGuild (guildID: string): Promise<SerialGuild | undefined> {
        if (!this.client || !/\d{18}/.test(guildID)) throw new EngineError('fetchGuild', this);
        const guild = await fetchGuild(this.client, guildID);
        return guild;
    }

    /**
     * Get Discord.Channel by id
     * @param channelID - discord channel id to fetch
     */
    async fetchChannel (channelID: string): Promise<SerialChannel | undefined> {
        if (!this.client || !/\d{18}/.test(channelID)) throw new EngineError('fetchChannel', this);
        const channel = await fetchChannel(this.client, channelID);
        return channel;
    }

    /**
     * Get Discord.User by id
     * @param userID - discord user id to fetch
     */
    async fetchUser (userID: string): Promise<SerialUser | undefined> {
        if (!this.client || !/\d{18}/.test(userID)) throw new EngineError('fetchUser', this);
        const user = await fetchUser(this.client, userID);
        return user;
    }

    /**
     * Get Discord.GuildMember by id
     * @param userID - discord user id to fetch
     */
    async fetchMember (userID: string): Promise<SerialMember | undefined> {
        if (!this.client || !this.instance.currentGuild || !/\d{18}/.test(userID)) throw new EngineError('fetchMember', this);
        const member = await fetchMember(this.instance.currentGuild, userID);
        return member;
    }

    /**
     * Get a list of guilds Engine#client exists in
     * @param search - string to match name of the guilds
     */
    async showGuilds (search?: string): Promise<Array<SerialGuild>> {
        if (!this.client) throw new EngineError('showGuilds', this);
        const guilds = await showGuilds(this.client, search);
        return guilds;
    }

    /**
     * Get a list of channels Engine#instance.currentGuild has
     * @param search - string to match name of the channels
     */
    async showChannels (search?: string): Promise<Array<SerialChannel>> {
        if (!this.client || !this.instance.currentGuild) throw new EngineError('showChannels', this);
        const channels = showChannels(this.instance.currentGuild, search);
        return channels;
    }

    /**
     * Get a list of members Engine#instance.currentGuild has
     * @param search - string to match name of the username#0000
     */
    async showMembers (search?: string): Promise<Array<SerialMember>> {
        if (!this.client || !this.instance.currentGuild) throw new EngineError('showChannels', this);
        const channels = showMembers(this.instance.currentGuild, search);
        return channels;
    }


    /**
     * Update Engine#client (bot instance) discord presence
     * @param newPresence - new overwriting precense
     */
    async updatePrecense (newPresence: PresenceData): Promise<SerialPresence | undefined> {
        if (!this.client) throw new EngineError('updatePrecense', this);
        return await updatePrecense(this.client, newPresence);
    }

    /**
     * Send a message in Engine#instance.currentChannel
     * @param options - MessageOptions object that defines the discord message
     */
    async sendMessage (options: MessageOptions): Promise<SerialMessage> {
        if (!this.client || !this.instance.currentChannel) throw new EngineError('sendMessage', this);
        const message = await sendMessage(this.instance.currentChannel, options);
        return message;
    }

    /**
     * Edit an existing message in Engine#instance.currentChannel
     * @param options - EngineEditOptions which specifices the message to edit and the new message
     */
    async editMessage (options: EngineEditOptions): Promise<SerialMessage> {
        if (!this.client || !this.instance.currentChannel) throw new EngineError('editMessage', this);
        const message = await editMessage(this.instance.currentChannel, options.messageID, options.editOptions);
        return message;
    }

    /**
     * Delete a message in Engine#instance.currentChannel
     * @param messageID - discord message id of the existing message to delete
     */
    async deleteMessage (messageID: string): Promise<SerialMessage> {
        if (!this.client || !this.instance.currentChannel || !/\d{18}/.test(messageID)) throw new EngineError('deleteMessage', this);
        const message = await deleteMessage(this.instance.currentChannel as TextChannel, messageID);
        return message;
    }

    /**
     * Delete multiple messages at once in Engine#instance.currentChannel
     * @param options - ChannelLogsQueryOptions that determines what messages to delete
     */
    async deleteMessages (options: ChannelLogsQueryOptions): Promise<Array<SerialMessage>> {
        if (!this.client || !this.instance.currentChannel) throw new EngineError('deleteMessages', this);
        const deletedMessages = await deleteMessages(this.instance.currentChannel as TextChannel, options);
        return deletedMessages;
    }

    /**
     * Get a list of messages in Engine#instance.currentChannel
     * @param options - ChannelLogsQueryOptions that determines what messages to fetch
     */
    async readChannel (options: ChannelLogsQueryOptions): Promise<Array<SerialMessage>> {
        if (!this.client || !this.instance.currentChannel) throw new EngineError('readChannel', this);
        const messages = await readChannel(this.instance.currentChannel, options);
        return messages;
    }

    /**
     * Listen to all Engine#client events
     * @param options - EngineListenOptions object used to handle and filter incomming discord events
     */
    async listenClient (options: EngineListenOptions): Promise<void> {
        if (!this.client) throw new EngineError('listenClient', this);
        return listenClient(this.client, options);
    }

    /**
     * Listen to all Engine#instance.currentGuild events
     * @param options - EngineListenOptions object used to handle and filter incomming discord events
     */
    async listenGuild (options: EngineListenOptions): Promise<void> {
        if (!this.client || !this.instance.currentGuild) throw new EngineError('listenGuild', this);
        return listenGuild(this.client, this.instance.currentGuild, options);
    }

    /**
     * Listen to all Engine#instance.currentChannel events
     * @param options - EngineListenOptions object used to handle and filter incomming discord events
     */
    async listenChannel (options: EngineListenOptions): Promise<void> {
        if (!this.client || !this.instance.currentChannel) throw new EngineError('listenChannel', this);
        return listenChannel(this.client, this.instance.currentChannel, options);
    }
}