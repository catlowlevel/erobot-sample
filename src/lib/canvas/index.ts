import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";

//https://stackoverflow.com/a/19593950
function roundedImage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

export const toRoundedImage = async (file: string | Buffer, radius: number) => {
    const img = await loadImage(file);
    // radius = radius + img.height * 2 + img.width * 2;
    // radius = radius + img.width / 2 - img.height / 2;
    const x = Math.min(img.width, img.height);
    radius /= 100;
    radius = Math.max(radius, 0);
    radius = Math.min(radius, 1);
    radius = ((x ^ 2) + ((x * 2) / x) * 2) * 0.5 * radius; // unknown calculation
    console.log(img.width, img.height, radius);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    roundedImage(ctx, 0, 0, img.width, img.height, radius);
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    const buffer = canvas.toBuffer();
    return buffer;
};

// loadImage("output.jpg").then((img) => {
//     const canvas = createCanvas(img.width, img.height);
//     const ctx = canvas.getContext("2d");
//     roundedImage(ctx, 0, 0, img.width, img.height, 20);
//     ctx.clip();
//     ctx.drawImage(img, 0, 0);
//     const buffer = canvas.toBuffer();
//     writeFileSync("img.png", buffer);
// });
