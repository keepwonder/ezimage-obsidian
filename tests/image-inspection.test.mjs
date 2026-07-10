import assert from 'node:assert/strict';
import esbuild from 'esbuild';

const result = await esbuild.build({
  entryPoints: ['src/utils.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const module = { exports: {} };
new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);

const { formatMarkdownImageLink, inspectImageData, normalizeExtensionList, reconcileImageMetadata } = module.exports;
const arrayBuffer = buffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

// Minimal two-frame GIF. The misleading JPEG name reproduces the reported case.
const gifHeader = Buffer.from('GIF89a', 'ascii');
const gifScreenAndPalette = Buffer.from([
  1, 0, 1, 0, 0x80, 0, 0,
  0, 0, 0, 255, 255, 255,
]);
const gifFrame = Buffer.from([
  0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0,
  2, 2, 0x44, 0x01, 0,
]);
const disguisedGif = Buffer.concat([gifHeader, gifScreenAndPalette, gifFrame, gifFrame, Buffer.from([0x3b])]);
assert.deepEqual(inspectImageData(arrayBuffer(disguisedGif)), {
  format: 'gif', extension: 'gif', mimeType: 'image/gif', animated: true,
});
const correctedGif = reconcileImageMetadata(arrayBuffer(disguisedGif), 'animation.jpeg', 'image/jpeg');
assert.equal(correctedGif.fileName, 'animation.gif');
assert.equal(correctedGif.resolvedMimeType, 'image/gif');

const apng = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from([0, 0, 0, 0]), Buffer.from('acTL'), Buffer.alloc(4),
]);
assert.equal(inspectImageData(arrayBuffer(apng)).animated, true);

const animatedWebp = Buffer.concat([
  Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'),
  Buffer.from('ANIM'), Buffer.alloc(4),
]);
assert.equal(inspectImageData(arrayBuffer(animatedWebp)).animated, true);

const animatedAvif = Buffer.concat([
  Buffer.from([0, 0, 0, 20]), Buffer.from('ftypavis'), Buffer.alloc(4), Buffer.from('avif'),
]);
assert.equal(inspectImageData(arrayBuffer(animatedAvif)).animated, true);

const animatedSvg = Buffer.from('<svg><animate attributeName="x"/></svg>');
assert.equal(inspectImageData(arrayBuffer(animatedSvg)).animated, true);

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const correctedJpeg = reconcileImageMetadata(arrayBuffer(jpeg), 'photo.gif', 'image/gif');
assert.equal(correctedJpeg.fileName, 'photo.jpg');
assert.equal(correctedJpeg.resolvedMimeType, 'image/jpeg');
assert.equal(correctedJpeg.animated, false);

assert.deepEqual(normalizeExtensionList('.GIF, webp; SVG gif'), ['gif', 'webp', 'svg']);

const fixedDate = new Date('2026-07-10T09:08:07');
assert.equal(
  formatMarkdownImageLink('', { url: 'https://images.example.com/a.png', fileName: 'a.png', now: fixedDate }),
  '![](https://images.example.com/a.png)'
);
assert.equal(
  formatMarkdownImageLink('![{{name}}]({{url}})', {
    url: 'https://images.example.com/my-photo.webp',
    fileName: 'my-photo.jpg',
    now: fixedDate,
  }),
  '![my-photo](https://images.example.com/my-photo.webp)'
);
assert.equal(
  formatMarkdownImageLink('![{{date}} {{time}} {{fileName}} {{ext}}]({{url}})', {
    url: 'https://images.example.com/photo.png',
    fileName: 'weird [name].png',
    now: fixedDate,
  }),
  '![2026-07-10 09-08-07 weird \\[name\\].png png](https://images.example.com/photo.png)'
);

console.log('Image inspection regression tests passed.');
