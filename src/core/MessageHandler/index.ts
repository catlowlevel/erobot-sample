import chalk from "chalk";
import { readdirSync } from "fs";
import { join } from "path";
import { ROOT_DIR } from "../..";
import { getRandomColor } from "../../helper/utils";
import { BaseCommand } from "../BaseCommand";
import { Client } from "../Client";
import { Message } from "../Message";
import { AutoReply } from "./AutoReply";
export interface IArgs {
    context: string;
    args: string[];
    flags: string[];
}

interface ICommandConfig {
    description: string;
    usage: string;
    aliases?: string[];
}

export interface ICommand {
    /**Name of the command */
    name: string;
    /**The client of WhatsApp */
    client: Client;
    /**Handler of message */
    config: ICommandConfig;
    handler: MessageHandler;
    /**Method for executing the command */
    execute(M: Message, args: IArgs): Promise<void | never>;
}

export class MessageHandler {
    commands = new Map<string, ICommand>();
    aliases = new Map<string, ICommand>();

    autoReply: AutoReply;

    private path = [ROOT_DIR, "src", "commands"];

    constructor(private client: Client) {
        client.waitConnected().then(() => {
            this.autoReply = new AutoReply(client, this);
        });
    }

    private loadCommand = (path: string) =>
        new Promise<void>((res) => {
            try {
                const command: BaseCommand = new (require(path).default)();
                command.client = this.client;
                command.handler = this;
                this.commands.set(command.name, command);
                if (command.config.aliases) command.config.aliases.forEach((a) => this.aliases.set(a, command));

                const color = getRandomColor();
                console.log(`Command ${chalk.keyword(color)(command.name)} loaded!`);
                res();
            } catch (error) {
                console.log(`Command ${chalk.red(path)} fail to load. Reason : ${error}`);
                res();
            }
        });

    public loadCommands = async () => {
        this.client.log("=====Loading commands========", "blue");
        const files = readdirSync(join(...this.path));
        files
            .filter((file) => file.startsWith("_") === false)
            .map(async (file) => {
                const commandPath = join(...[...this.path, file]);
                await this.loadCommand(commandPath);
            });
        this.client.log("==============================", "blue");
    };

    public handleMessage = (M: Message) => {
        const prefix = Message.PREFIX;
        const isCommand = M.isCommand; // calling this here is necessary
        const args = M.content.split(/[ ,\n]/gm);
        const title = M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
        if (!isCommand) {
            return M.simplify().then((M) => {
                const title = M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
                return console.log(`${M.sender.username}@${title} => ${M.content}`);
            });
        }
        const cmd = args[0].toLowerCase().slice(prefix.length);
        const command = this.commands?.get(cmd) || this.aliases?.get(cmd);
        if (!command) return M.reply("Perintah tidak dikenal!");
        const color = getRandomColor();
        const color2 = getRandomColor();
        this.client.log(`Executing command ${chalk.keyword(color2)(cmd)} from ${title} by ${M.sender.username}`, color);

        const lastTime = Date.now();
        return M.typing().then(async () => {
            try {
                if (M.from !== this.client.user?.id) {
                    this.client.readMessages([M.message.key]);
                }
                await command.execute(M, this.formatArgs(args));
                const timeTaken = Date.now() - lastTime;
                this.client.log(
                    `Command ${chalk.keyword(color2)(cmd)} executed after ${chalk.keyword(color2)(
                        `${(timeTaken / 1000).toFixed(3)}s`
                    )}!`,
                    color
                );
            } catch (err) {
                const timeTaken = Date.now() - lastTime;
                this.client.log(
                    `Command ${chalk.keyword(color2)(cmd)} fail to execute after ${chalk.keyword(color2)(
                        `${(timeTaken / 1000).toFixed(3)}s`
                    )}!\nReason : ${err}`,
                    "red"
                );
                console.trace(err);
                await M.reply("Terjadi kesalahan.").catch(console.error);
            } finally {
                return M.typingDone();
            }
        });
    };
    private formatArgs = (args: string[]): IArgs => {
        args.splice(0, 1);
        return {
            args,
            context: args.join(" ").trim(),
            flags: args.filter((arg) => arg.startsWith("--")),
        };
    };
}
