export function debounce<T extends Function>(callback: T, delay: number = 0): T {
    let timeout: number = null
    return function(){
        const context = this
        const args = arguments
        window.clearTimeout(timeout)
        timeout = window.setTimeout(function(){
            callback.apply(context, args)
        }, delay)
    } as any
}