/**
 * Watermarks an image to disclose generative AI
 * @param {any} image Base64 encoded string, when decoded it must contain image data
 * @returns {Buffer} Watermarked image in PNG format
 * @requires Canvas
 */
const watermarkAIImage = async (image) => {
    try {
        require.resolve('canvas');
    } catch (err) {
        throw new ReferenceError("Canvas not found");
    }
    
    const { createCanvas, loadImage } = require("canvas");
    const generatedImage = await loadImage(Buffer.from(image, "base64"));
    const canvas = createCanvas(generatedImage.width, generatedImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(generatedImage, 0, 0);

    const scale = Math.min(canvas.width, canvas.height) / 1024;
    ctx.save();
    ctx.translate(canvas.width - 40 * scale, canvas.height - 40 * scale);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(3, -3, 16, 0);
    ctx.quadraticCurveTo(3, 3, 0, 16);
    ctx.quadraticCurveTo(-3, 3, -16, 0);
    ctx.quadraticCurveTo(-3, -3, 0, -16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = { watermarkAIImage };