import { proto } from "@adiwajshing/baileys";
import { format } from "timeago.js";
import { getInfo } from "ytdl-core";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { formatNumber } from "../helper/utils";
import { COOKIES, ytdlDownload } from "../lib/yt/app";

@Command("yt", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    getOptions(flags: string[]) {
        const url = this.getFlag(flags, "--url=");
        const quality = this.getFlag(flags, "--quality=", ["high", "medium", "low"]);
        const type = this.getFlag(flags, "--type=", ["video", "audio"]);
        return { url, quality, type };
    }

    public override execute = async (M: Message, { args, flags }: IArgs): Promise<any> => {
        if (args.length <= 0) return M.reply("No url provided!");
        const url = args[0];
        flags = flags.filter((f) => f.startsWith("--url=") || f.startsWith("--quality=") || f.startsWith("--type="));
        const options = this.getOptions(flags);
        console.log("options", options);
        switch (options.type) {
            case "audio": {
                if (!options.url || !options.type)
                    throw new Error(`Some options are undefined! ${JSON.stringify(options)}`);
                const audioBuffer = await ytdlDownload(options.url, options.type, "high");
                return M.reply(audioBuffer, "audio");
            }
            case "video": {
                if (!options.url || !options.quality || !options.type)
                    throw new Error(`Some options are undefined! ${JSON.stringify(options)}`);
                const videoBuffer = await ytdlDownload(options.url, options.type, options.quality);
                return M.reply(videoBuffer, "video");
            }
            default:
                {
                    const { videoDetails } = await getInfo(url, {
                        requestOptions: { headers: { cookie: COOKIES } },
                    });
                    if (Number(videoDetails.lengthSeconds) > 1800)
                        return M.reply("Video terlalu panjang, maksimal 30 menit");
                    const text = `Judul: *${videoDetails.title}*\nChannel: *${videoDetails.author.name}*\nDurasi: *${
                        videoDetails.lengthSeconds
                    }s*\nViews : *${formatNumber(Number(videoDetails.viewCount), 0)}*\nUpdate Date : *${format(
                        videoDetails.publishDate,
                        "id_ID"
                    )}*`;
                    const thumbnailArrayBuffer = await fetch(
                        videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url
                    ).then((res) => res.arrayBuffer());
                    const thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);
                    const quality = [
                        { text: "High", value: "high" },

                        { text: "Medium", value: "medium" },
                    ];
                    const buttons: proto.Message.ButtonsMessage.IButton[] = [];
                    quality.forEach((q) => {
                        buttons.push({
                            buttonId: `.yt --url=${url} --quality=${q.value} --type=video`,
                            buttonText: { displayText: q.text },
                        });
                    });
                    buttons.push({
                        buttonId: `.yt --url=${url} --type=audio`,
                        buttonText: { displayText: "Audio" },
                    });
                    return this.client.sendMessage(
                        M.from,
                        {
                            image: thumbnailBuffer,
                            caption: text,
                            buttons,
                        },
                        { quoted: M.message }
                    );
                }
                break;
        }
    };
}
