import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("sample", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        M.reply("Example");
    };
}
