const Bitmap = ({ width, height, data, ...meta }) => ({
    width, height,
    data: data || new Uint8Array(width * height * 4),
    crop: { left: 0, right: 0, top: 0, bottom: 0 },
    frame: { x: 0, y: 0, width, height },
    ...meta
})

Bitmap.copy = (
    source, target,
    targetX = 0, targetY = 0,
    sourceX = 0, sourceY = 0,
    sourceWidth = source.width, sourceHeight = source.height
) => {
    sourceWidth = Math.min(sourceWidth, source.width - sourceX, target.width - targetX)
    sourceHeight = Math.min(sourceHeight, source.height - sourceY, target.height - targetY)
    for(let x = 0; x < sourceWidth; x++)
    for(let y = 0; y < sourceHeight; y++){
        const sourceIndex = (source.width * (y + sourceY) + x + sourceX) * 4
        const targetIndex = (target.width * (y + targetY) + x + targetX) * 4
        target.data[targetIndex+0] = source.data[sourceIndex+0]
        target.data[targetIndex+1] = source.data[sourceIndex+1]
        target.data[targetIndex+2] = source.data[sourceIndex+2]
        target.data[targetIndex+3] = source.data[sourceIndex+3]
    }
    return target
}
Bitmap.trim = ({ alphaThreshold = 0 }) => bitmap => {
    const { width, height, data, frame, crop } = bitmap

    const threshold = 0xFF * alphaThreshold
    let left = width - 1, right = 0
    let top = height - 1, bottom = 0

    for(let x = 0; x < width; x++)
    for(let y = 0; y < height; y++){
        const index = (y * width + x) * 4
        const alpha = data[index + 3]
        if(alpha <= threshold) continue

        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
    }

    const trimmed = Bitmap({
        width: right - left + 1,
        height: bottom - top + 1,
        meta: bitmap.meta,
        crop: {
            left: Math.max(0, crop.left - left),
            top: Math.max(0, crop.top - top),
            right: Math.max(0, crop.right - (width - 1 - right)),
            bottom: Math.max(0, crop.bottom - (height - 1 - bottom))
        },
        frame: {
            x: frame.x - left,
            y: frame.y - top,
            width: frame.width,
            height: frame.height
        }
    })
    Bitmap.copy(bitmap, trimmed, 0, 0, left, top, trimmed.width, trimmed.height)
    return trimmed
}
Bitmap.pad = ({ extrude = false, padding = 0 }) => bitmap => {
    if(!padding) return bitmap

    const { width, height, data, frame, crop } = bitmap

    const padded = Bitmap({
        width: width + 2 * padding,
        height: height + 2 * padding,
        meta: bitmap.meta,
        crop: {
            left: crop.left + padding,
            right: crop.right + padding,
            top: crop.top + padding,
            bottom: crop.bottom + padding
        },
        frame: {
            x: frame.x + padding,
            y: frame.y + padding,
            width: frame.width,
            height: frame.height
        }
    })
    Bitmap.copy(bitmap, padded, padding, padding)

    if(extrude){
        if(frame.x >= 0) for(let x = padding - 1; x >= 0; x--)
            Bitmap.copy(padded, padded, x, 0, padding, 0, 1, padded.height)
        if(frame.width - frame.x <= width) for(let x = padding - 1; x >= 0; x--)
            Bitmap.copy(padded, padded, padded.width - x - 1, 0, padded.width - padding - 1, 0, 1, padded.height)
        if(frame.y >= 0) for(let y = padding - 1; y >= 0; y--)
            Bitmap.copy(padded, padded, 0, y, 0, padding, padded.width, 1)
        if(frame.height - frame.y <= height) for(let y = padding - 1; y >= 0; y--)
            Bitmap.copy(padded, padded, 0, padded.height - y - 1, 0, padded.height - padding - 1, padded.width, 1)
    }
    
    return padded
}

module.exports = Bitmap