import path from "path";
import { Client } from "./core";
import { MessageHandler } from "./core/MessageHandler";
export const ROOT_DIR = path.resolve(__dirname, "..");
(async () => {
    const client = new Client();
    await client.start();

    const { handleMessage, loadCommands } = new MessageHandler(client);
    await loadCommands();

    client.on("new_message", handleMessage);
})();
