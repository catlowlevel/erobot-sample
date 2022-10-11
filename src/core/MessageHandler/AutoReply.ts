import { MessageHandler } from ".";
import { ROOT_DIR } from "../..";
import { wildcardCheck } from "../../helper/utils";
import { Client } from "../Client";
import { LowDB } from "../LowDB";

interface AutoReplyType {
    [jid: string]: { pattern: string; replyMsg: string }[];
}
export class AutoReply {
    db: LowDB<AutoReplyType>;
    constructor(private client: Client, private handler: MessageHandler) {
        this.db = new LowDB<AutoReplyType>(`${ROOT_DIR}/json/msg_auto_reply.json`, {});
        this.db.waitInit().then(() => {
            this.client.log("AutoReply Initiated!", "green");
            this.client.on("new_message", (M) => {
                if (M.isCommand) return;
                const data = this.db.data[M.from];
                if (!data) return;

                for (const { pattern, replyMsg } of data.reverse()) {
                    const match = wildcardCheck(M.content, pattern);
                    if (match || M.content.toLowerCase().includes(pattern.toLowerCase())) {
                        M.markAsRead();
                        M.replyQueue(replyMsg);
                        return;
                    }
                }
            });
        });
    }
}
