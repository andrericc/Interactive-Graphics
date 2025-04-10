// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    const bgPixels = bgImg.data;
    const fgPixels = fgImg.data;
    const bgW = bgImg.width;
    const bgH = bgImg.height;
    const fgW = fgImg.width;
    const fgH = fgImg.height;

    for (let j = 0; j < fgH; j++) {
        for (let i = 0; i < fgW; i++) {
            const destX = i + fgPos.x;
            const destY = j + fgPos.y;

            if (destX < 0 || destY < 0 || destX >= bgW || destY >= bgH) {
                continue;
            }

            const fgIdx = (j * fgW + i) * 4;
            const bgIdx = (destY * bgW + destX) * 4;

            const alphaFg = (fgPixels[fgIdx + 3] / 255) * fgOpac;
            const alphaBg = 1 - alphaFg;

            bgPixels[bgIdx]     = fgPixels[fgIdx]     * alphaFg + bgPixels[bgIdx]     * alphaBg;
            bgPixels[bgIdx + 1] = fgPixels[fgIdx + 1] * alphaFg + bgPixels[bgIdx + 1] * alphaBg;
            bgPixels[bgIdx + 2] = fgPixels[fgIdx + 2] * alphaFg + bgPixels[bgIdx + 2] * alphaBg;
            bgPixels[bgIdx + 3] = 255;
        }
    }
}
