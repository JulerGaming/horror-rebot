const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { createCanvas, loadImage } = require('canvas');
const { watermarkAIImage } = require('../src/ai-image-watermark');

function sample(width, height, transparent = false) {
    const canvas = createCanvas(width, height);
    if (!transparent) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(0, 0, width, height);
    }
    return canvas.toBuffer('image/png');
}

async function pixels(buffer) {
    const image = await loadImage(buffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return { width: image.width, height: image.height, data: ctx.getImageData(0, 0, image.width, image.height).data };
}

for (const [width, height] of [[1024, 1024], [1536, 1024], [1024, 1536], [64, 64], [32, 512]]) {
    test(`embeds watermark without resizing ${width}x${height}`, async () => {
        const input = sample(width, height);
        const before = await pixels(input);
        const after = await pixels(await watermarkAIImage(input, 'other-user'));
        assert.equal(after.width, width);
        assert.equal(after.height, height);
        const top = width * Math.floor(height * 0.8) * 4;
        assert.deepEqual(after.data.slice(0, top), before.data.slice(0, top));
        assert.notDeepEqual(after.data.slice(top), before.data.slice(top));
    });
}

test('owner is byte-for-byte exempt; missing requester is not exempt', async () => {
    const input = sample(256, 256);
    assert.strictEqual(await watermarkAIImage(input, '804839205309382676'), input);
    assert.notDeepEqual(await watermarkAIImage(input), input);
});

test('transparent image stays transparent outside the semi-transparent watermark', async () => {
    const { data } = await pixels(await watermarkAIImage(sample(256, 256, true), 'other'));
    assert.equal(data[3], 0);
    const alpha = Array.from(data).filter((_, i) => i % 4 === 3);
    assert.ok(alpha.some(value => value > 0));
    assert.ok(Math.max(...alpha) < 255);
});

test('invalid image rejects instead of returning unmarked bytes', async () => {
    await assert.rejects(watermarkAIImage(Buffer.from('invalid'), 'other'));
});

// Exercise the actual tool body without booting the bot or contacting Discord/OpenAI.
const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
const toolBody = source.slice(source.indexOf('generateImage: async (args) => {') + 'generateImage: '.length, source.indexOf('\n    };\n\n    const tools = [', source.indexOf('generateImage: async (args) => {'))).trim().replace(/\n        }$/, '\n        }');

for (const edit of [false, true]) {
    for (const owner of [false, true]) {
        test(`${edit ? 'edit' : 'generation'} attaches ${owner ? 'original owner' : 'watermarked'} bytes`, async () => {
            const input = sample(256, 256);
            const result = await runTool(input, owner, edit);
            assert.equal(result.files.length, 1);
            assert.equal(result.calls[0], edit ? 'edit' : 'generate');
            const expected = await watermarkAIImage(input, owner ? '804839205309382676' : 'other');
            assert.deepEqual(result.files[0].attachment, expected);
        });
    }
}

test('watermark failure queues no attachment and refunds quota', async () => {
    const result = await runTool(Buffer.from('invalid'), false, false, true);
    assert.equal(result.files.length, 0);
    assert.equal(result.quota.count, 0);
});

async function runTool(input, owner, edit, expectFailure = false) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hrbot-watermark-'));
    const files = [];
    const calls = [];
    const id = owner ? '804839205309382676' : 'other';
    class OpenAI {
        moderations = { create: async () => ({ results: [{ flagged: false }] }) };
        images = Object.fromEntries(['generate', 'edit'].map(method => [method, async () => {
            calls.push(method);
            return { data: [{ b64_json: input.toString('base64') }] };
        }]));
    }
    try {
        const tool = vm.runInNewContext(`(${toolBody})`, {
            require: () => ({ toFile: async () => ({}) }), message: { author: { id } },
            fs, path, __dirname: dir, OpenAI, process: { env: {} }, Buffer, files,
            watermarkAIImage, URL, AbortSignal, console,
            fetch: async () => ({ ok: true, headers: { get: () => 'image/png' } })
        });
        const promise = tool({ prompt: 'A landscape', referenceUrls: edit ? ['https://example.com/reference.png'] : [] });
        if (expectFailure) await assert.rejects(promise);
        else assert.equal(await promise, 'Image successfully attached');
        const quotaPath = path.join(dir, 'image-generation-usage', `${id}.json`);
        return { files, calls, quota: fs.existsSync(quotaPath) ? JSON.parse(fs.readFileSync(quotaPath)) : null };
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
