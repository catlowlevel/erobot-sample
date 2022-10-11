import { Client } from "./Client";
import { Message } from "./Message";
import { IArgs, ICommand, MessageHandler } from "./MessageHandler";

export class BaseCommand {
    constructor(public name: string, public config: ICommand["config"]) {}

    public execute = async (M: Message, args: IArgs): Promise<void | never> => {
        throw new Error("Command method not implemented");
    };

    public client!: Client;

    public handler!: MessageHandler;

    protected getIndex = (array: string[], search: string) =>
        array.findIndex((val) => val.toLowerCase().startsWith(search.toLowerCase()));

    protected getFlag<T extends string>(flags: string[], flag: string, expected?: T[], def?: T): T | undefined {
        const index = this.getIndex(flags, flag);
        if (index < 0) return def;
        const flagValue = flags[index].split("=")[1] as T;
        if (expected && def) {
            if (index < 0 || !expected?.includes(flagValue)) return def;
        }
        return flagValue;
    }
}
