import {
    AnyMessageContent,
    DownloadableMessage,
    downloadContentFromMessage,
    GroupMetadata,
    MediaType,
    MessageType,
    proto,
} from "@adiwajshing/baileys";
// import getUrls from 'get-urls'
import { extractNumbers } from "../helper/utils";
import { Client } from "./Client";

interface CollectOption {
    timeout: number;
    max?: number;
    senderOnly?: boolean;
}
export class Message {
    static PREFIX = ".";
    constructor(private M: proto.IWebMessageInfo, private client: Client) {
        this.message = this.M;
        this.from = M.key.remoteJid || "";
        this.chat = this.from.endsWith("@s.whatsapp.net") ? "dm" : "group";
        const jid =
            this.chat === "dm" && this.M.key.fromMe
                ? this.client.correctJid(this.client.user?.id || "")
                : this.chat === "group"
                ? this.client.correctJid(M.key.participant || "")
                : this.client.correctJid(this.from);
        const username = "Test";
        this.sender = {
            jid,
            username,
        };
        this.type = (Object.keys(M.message || {})[0] as MessageType) || "conversation";
        if (this.M.pushName) this.sender.username = this.M.pushName;
        const supportedMediaType = ["videoMessage", "imageMessage"];
        this.hasSupportedMediaMessage =
            this.type === "buttonsMessage"
                ? supportedMediaType.includes(Object.keys(M.message?.buttonsMessage || {})[0])
                : supportedMediaType.includes(this.type);
        const getContent = (): string => {
            if (M.message?.buttonsResponseMessage) return M.message?.buttonsResponseMessage?.selectedButtonId || "";
            if (M.message?.listResponseMessage)
                return M.message?.listResponseMessage?.singleSelectReply?.selectedRowId || "";
            return M.message?.conversation
                ? M.message.conversation
                : this.hasSupportedMediaMessage
                ? supportedMediaType
                      .map((type) => M.message?.[type as "imageMessage"]?.caption)
                      .filter((caption) => caption)[0] || ""
                : M.message?.extendedTextMessage?.text
                ? M.message?.extendedTextMessage.text
                : "";
        };
        this.content = getContent();
        const mentions = (M.message?.[this.type as "extendedTextMessage"]?.contextInfo?.mentionedJid || []).filter(
            (x) => x !== null && x !== undefined
        );
        for (const mentioned of mentions) this.mentioned.push(mentioned);
        let text = this.content;
        for (const mentioned of this.mentioned) text = text.replace(mentioned.split("@")[0], "");
        this.numbers = extractNumbers(text);
        if (M.message?.[this.type as "extendedTextMessage"]?.contextInfo?.quotedMessage) {
            const { quotedMessage, participant, stanzaId } =
                M.message?.[this.type as "extendedTextMessage"]?.contextInfo || {};
            if (quotedMessage && participant && stanzaId) {
                const Type = Object.keys(quotedMessage)[0] as MessageType;
                const getQuotedContent = (): string => {
                    if (quotedMessage?.buttonsResponseMessage)
                        return quotedMessage?.buttonsResponseMessage?.selectedDisplayText || "";
                    if (quotedMessage?.listResponseMessage)
                        return quotedMessage?.listResponseMessage?.singleSelectReply?.selectedRowId || "";
                    return quotedMessage?.conversation
                        ? quotedMessage.conversation
                        : supportedMediaType.includes(Type)
                        ? supportedMediaType
                              .map((type) => quotedMessage?.[type as "imageMessage"]?.caption)
                              .filter((caption) => caption)[0] || ""
                        : quotedMessage?.extendedTextMessage?.text
                        ? quotedMessage?.extendedTextMessage.text
                        : "";
                };
                // const { username, jid } = this.client.contact.getContact(
                // 	this.client.correctJid(participant)
                // );
                this.quoted = {
                    sender: {
                        jid,
                        username,
                    } || {
                        username: "User",
                        jid: this.client.correctJid(participant),
                    },
                    content: getQuotedContent(),
                    message: quotedMessage,
                    type: Type,
                    hasSupportedMediaMessage:
                        Type !== "buttonsMessage"
                            ? supportedMediaType.includes(Type)
                            : supportedMediaType.includes(Object.keys(quotedMessage?.buttonsMessage || {})[1]),
                    key: {
                        remoteJid: this.from,
                        fromMe:
                            this.client.correctJid(participant) === this.client.correctJid(this.client.user?.id || ""),
                        id: stanzaId,
                        participant,
                    },
                };
            }
        }
    }

    /**
     *
     * @param options Options
     * @param newMessageCB Process new messages, return undefined to NOT collect the message
     * @returns Collected messages
     */
    public collectMessages = (options: CollectOption, newMessageCB?: (M: Message) => any | Promise<any>) => {
        if (options.timeout < 1000) throw new Error("timeout must be greater than 1000ms");
        console.log("Collecting messages");
        return new Promise<Message[]>((res, rej) => {
            const messages: Message[] = [];

            const timeout = setTimeout(() => {
                done();
            }, options.timeout);

            const done = () => {
                try {
                    clearTimeout(timeout);
                    this.client.off("new_message", messageHandler);
                    console.log(`Collect done : ${messages.length} collected`);
                    res(messages);
                } catch (error) {
                    rej(error);
                }
            };

            const messageHandler = async (M: Message) => {
                if (options.senderOnly) {
                    if (M.sender.jid !== this.sender.jid) return void null;
                }
                M.markAsRead();
                if (newMessageCB) {
                    const result = await newMessageCB(M);
                    if (result !== undefined) {
                        messages.push(M);
                        console.log(`${messages.length} message${messages.length > 1 ? "s" : ""} collected`);
                    }
                } else {
                    messages.push(M);
                    console.log(`${messages.length} message${messages.length > 1 ? "s" : ""} collected`);
                }
                if (options.max) {
                    if (messages.length >= options.max) {
                        done();
                    }
                }
            };
            this.client.on("new_message", messageHandler);

            //const interval = setInterval(() => {
            //try {
            //if (options.max) {
            //if (messages.length >= options.max) {
            //clearInterval(interval);
            //clearTimeout(timeout);
            //done();
            //}
            //} else {
            //clearInterval(interval);
            //}
            //} catch (error) {
            //rej(error);
            //}
            //}, 100);
        });
    };

    public typing = async (): Promise<void> => {
        await this.client.presenceSubscribe(this.from);
        return this.client.sendPresenceUpdate("composing", this.from);
    };
    public typingDone = async () => {
        return this.client.sendPresenceUpdate("paused", this.from);
    };

    public simplify = async (): Promise<Message> => {
        if (this.chat === "dm") return this;
        return await this.client
            .groupMetadata(this.from)
            .then((res) => {
                const result = res;
                this.groupMetadata = result;
                return this;
            })
            .catch(() => this);
    };

    get stubType(): proto.WebMessageInfo.StubType | undefined | null {
        return this.M.messageStubType;
    }

    get stubParameters(): string[] | undefined | null {
        return this.M.messageStubParameters;
    }

    public reply = async (
        content: string | Buffer,
        type: "text" | "image" | "video" | "audio" | "sticker" | "document" = "text",
        gif?: boolean,
        mimetype?: string,
        caption?: string,
        mentions?: string[],
        externalAdReply?: proto.IContextInfo["externalAdReply"],
        thumbnail?: Buffer,
        fileName?: string,
        options: {
            sections?: proto.Message.ListMessage.ISection[];
            buttonText?: string;
            title?: string;
        } = {}
    ): Promise<ReturnType<typeof this.client.sendMessage>> => {
        if (type === "text" && Buffer.isBuffer(content)) throw new Error("Cannot send Buffer as a text message");
        return this.client.sendMessage(
            this.from,
            {
                [type]: content,
                gifPlayback: gif,
                caption,
                mimetype,
                mentions,
                fileName,
                jpegThumbnail: thumbnail ? thumbnail.toString("base64") : undefined,
                contextInfo: externalAdReply
                    ? {
                          externalAdReply,
                      }
                    : undefined,
                footer: options.sections?.length ? `EroBot` : undefined,
                sections: options.sections,
                title: options.title,
                buttonText: options.buttonText,
            } as unknown as AnyMessageContent,
            {
                quoted: this.M,
            }
        );
    };

    public replyQueue = async (
        content: string | Buffer,
        type: "text" | "image" | "video" | "audio" | "sticker" | "document" = "text",
        gif?: boolean,
        mimetype?: string,
        caption?: string,
        mentions?: string[],
        externalAdReply?: proto.IContextInfo["externalAdReply"],
        thumbnail?: Buffer,
        fileName?: string,
        options: {
            sections?: proto.Message.ListMessage.ISection[];
            buttonText?: string;
            title?: string;
        } = {}
    ): Promise<ReturnType<typeof this.client.sendMessage>> => {
        if (type === "text" && Buffer.isBuffer(content)) throw new Error("Cannot send Buffer as a text message");
        return this.client.sendMessageQueue(
            this.from,
            {
                [type]: content,
                gifPlayback: gif,
                caption,
                mimetype,
                mentions,
                fileName,
                jpegThumbnail: thumbnail ? thumbnail.toString("base64") : undefined,
                contextInfo: externalAdReply
                    ? {
                          externalAdReply,
                      }
                    : undefined,
                footer: options.sections?.length ? `EroBot` : undefined,
                sections: options.sections,
                title: options.title,
                buttonText: options.buttonText,
            } as unknown as AnyMessageContent,
            {
                quoted: this.M,
            }
        );
    };

    public markAsRead = async () => this.client.readMessages([this.message.key]);

    public react = async (
        emoji: string,
        key: proto.IMessageKey = this.M.key
    ): Promise<ReturnType<typeof this.client.sendMessage>> =>
        await this.client.sendMessage(this.from, {
            react: {
                text: emoji,
                key,
            },
        });

    public downloadMediaMessage = async (message: proto.IMessage): Promise<Buffer> => {
        let type = Object.keys(message)[0] as MessageType;
        let msg = message[type as keyof typeof message];
        if (type === "buttonsMessage" || type === "viewOnceMessage") {
            if (type === "viewOnceMessage") {
                msg = message.viewOnceMessage?.message;
                type = Object.keys(msg || {})[0] as MessageType;
            } else type = Object.keys(msg || {})[1] as MessageType;
            msg = (msg as any)[type];
        }
        const stream = await downloadContentFromMessage(
            msg as DownloadableMessage,
            type.replace("Message", "") as MediaType
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    public get isCommand(): boolean {
        let max = 3;
        //handle whitespace after prefix: <prefix>  <command> => <prefix><command>
        while (this.content.startsWith(Message.PREFIX) && this.content.at(1) === " " && max-- > 0) {
            if (!max) break;
            this.content = this.content.replace(" ", "");
        }
        const args = this.content.split(/[ ,\n]/gm);
        if (!args[0] || !args[0].startsWith(Message.PREFIX) || this.content.length <= 1) return false;
        return true;
    }

    public from: string;
    public sender: { username?: string | null; jid?: string };
    public content: string;
    public numbers: number[];
    public hasSupportedMediaMessage: boolean;
    public type: MessageType;
    public message: proto.IWebMessageInfo;
    public chat: "dm" | "group";
    public mentioned: string[] = [];
    public quoted?: {
        content: string;
        sender: { username?: string | null; jid?: string | null };
        type: MessageType;
        message: proto.IMessage;
        hasSupportedMediaMessage: boolean;
        key: proto.IMessageKey;
    };
    public emojis: string[];
    public urls: string[];
    public groupMetadata?: GroupMetadata;
}
