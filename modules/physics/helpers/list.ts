export function appendList<T>(
    target: T[], source: T[], start: number, end: number, offset: number = target.length
): T[] {
    target.length += end - start
    for(let i = start; i < end; i++)
        target[offset++] = source[i]
    return target
}