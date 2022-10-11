import { exec as ex } from "child_process";
import { createWriteStream } from "fs";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { promisify } from "util";
import ytdl from "ytdl-core";

const exec = promisify(ex);

export const COOKIES = ``;

export const ytdlDownload = async (
    url: string,
    type: "video" | "audio" = "video",
    quality: "high" | "medium" | "low"
): Promise<Buffer> => {
    if (type === "audio" || quality === "medium") {
        let filename = `${tmpdir()}/${Math.random().toString(36)}.${type === "audio" ? "mp3" : "mp4"}`;
        const stream = createWriteStream(filename);
        ytdl(url, {
            quality: type === "audio" ? "highestaudio" : "highest",
            requestOptions: { headers: { cookie: COOKIES } },
        }).pipe(stream);
        filename = await new Promise((resolve, reject) => {
            stream.on("finish", () => resolve(filename));
            stream.on("error", (error) => reject(error && console.log(error)));
        });
        const buffer = await readFile(filename);
        await unlink(filename);
        return buffer;
    }
    let audioFilename = `${tmpdir()}/${Math.random().toString(36)}.mp3`;
    let videoFilename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
    const filename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
    const audioStream = createWriteStream(audioFilename);
    ytdl(url, {
        quality: "highestaudio",
        requestOptions: { headers: { cookie: COOKIES } },
    }).pipe(audioStream);
    audioFilename = await new Promise((resolve, reject) => {
        audioStream.on("finish", () => resolve(audioFilename));
        audioStream.on("error", (error) => reject(error && console.log(error)));
    });
    const stream = createWriteStream(videoFilename);
    ytdl(url, {
        quality: quality === "high" ? "highestvideo" : "lowestvideo",
        requestOptions: { headers: { cookie: COOKIES } },
    }).pipe(stream);
    videoFilename = await new Promise((resolve, reject) => {
        stream.on("finish", () => resolve(videoFilename));
        stream.on("error", (error) => reject(error && console.log(error)));
    });
    await exec(`ffmpeg -i ${videoFilename} -i ${audioFilename} -c:v copy -c:a aac ${filename}`);
    const buffer = await readFile(filename);
    Promise.all([unlink(videoFilename), unlink(audioFilename), unlink(filename)]);
    return buffer;
};
