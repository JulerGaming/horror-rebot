/**
 * Watermarks an image to disclose generative AI
 * @param {any} image Base64 encoded string, when decoded it must contain image data
 * @returns {Buffer} Watermarked image in PNG format
 * @requires Canvas
 * @throws Throws an error if watermark generation failed, and throws a ReferenceError if `canvas` cannot be resolved
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

/**
 * Watermarks a video to disclose generative AI.
 * The watermark moves without animation: top-left for 3 seconds, middle-right
 * for 3 seconds, then bottom-left. The cycle repeats for the rest of the video.
 * @param {any} video Base64 encoded string containing video data
 * @returns {Buffer} Watermarked video in MP4 format
 * @requires Canvas and FFmpeg
 */
const watermarkAIVideo = async (video) => {
    const fs = require('fs/promises');
    const os = require('os');
    const path = require('path');
    const { spawn } = require('child_process');

    try {
        require.resolve('canvas');
    } catch (err) {
        throw new ReferenceError("Canvas not found");
    }

    let ffmpegPath;
    try {
        ffmpegPath = require('ffmpeg-static');
    } catch (err) {
        throw new ReferenceError("FFmpeg not found");
    }

    const { createCanvas } = require('canvas');
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'horror-ai-watermark-'));
    const inputPath = path.join(tempDirectory, 'input-video');
    const watermarkPath = path.join(tempDirectory, 'watermark.png');
    const outputPath = path.join(tempDirectory, 'output.mp4');

    try {
        const watermarkCanvas = createCanvas(32, 32);
        const ctx = watermarkCanvas.getContext('2d');
        ctx.translate(16, 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.quadraticCurveTo(3, -3, 16, 0);
        ctx.quadraticCurveTo(3, 3, 0, 16);
        ctx.quadraticCurveTo(-3, 3, -16, 0);
        ctx.quadraticCurveTo(-3, -3, 0, -16);
        ctx.closePath();
        ctx.fill();

        await Promise.all([
            fs.writeFile(inputPath, Buffer.from(video, 'base64')),
            fs.writeFile(watermarkPath, watermarkCanvas.toBuffer('image/png'))
        ]);

        const phase = "mod(t,9)";
        const filter = `[1:v]format=rgba[watermark];[0:v][watermark]overlay=x='if(lt(${phase},3),40,if(lt(${phase},6),main_w-overlay_w-40,40))':y='if(lt(${phase},3),40,if(lt(${phase},6),(main_h-overlay_h)/2,main_h-overlay_h-40))'[output]`;

        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-hide_banner',
                '-loglevel', 'error',
                '-i', inputPath,
                '-loop', '1',
                '-i', watermarkPath,
                '-filter_complex', filter,
                '-map', '[output]',
                '-map', '0:a?',
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '18',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-movflags', '+faststart',
                '-shortest',
                outputPath
            ]);

            let stderr = '';
            ffmpeg.stderr.on('data', chunk => {
                stderr += chunk;
            });
            ffmpeg.on('error', reject);
            ffmpeg.on('close', code => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg failed with exit code ${code}: ${stderr}`));
            });
        });

        return await fs.readFile(outputPath);
    } finally {
        await fs.rm(tempDirectory, { recursive: true, force: true });
    }
};

module.exports = { watermarkAIImage, watermarkAIVideo };