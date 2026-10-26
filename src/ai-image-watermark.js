const { createCanvas, loadImage } = require("canvas");

const OWNER_USER_ID = "804839205309382676";

// Return the actual upload bytes; never fall back to an unmarked non-owner image.
async function watermarkAIImage(buffer, requesterId) {
    if (requesterId === OWNER_USER_ID) {
        return buffer;
    }

    const image = await loadImage(buffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    const label = "AI GENERATED";
    const margin = Math.min(image.width, image.height) * 0.02;
    const padding = margin * 0.6;
    let fontSize = Math.min(image.width, image.height) * 0.035;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const availableWidth = image.width - 2 * (margin + padding);
    fontSize *= Math.min(1, availableWidth / ctx.measureText(label).width);
    ctx.font = `bold ${fontSize}px sans-serif`;

    const width = ctx.measureText(label).width + padding * 2;
    const height = fontSize * 1.5 + padding * 2;
    const x = image.width - margin - width;
    const y = image.height - margin - height;
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + padding, y + height / 2);

    return canvas.toBuffer("image/png");
}

module.exports = { watermarkAIImage };
