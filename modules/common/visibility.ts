export function addVisibilityEventListener(callback: (toggle: boolean) => void): void {
    const vendorPrefixes = ['','moz','ms','webkit']
    const visibilityProperty = vendorPrefixes
    .map(prefix => `${prefix}${prefix ? 'H' : 'h'}idden`)
    .find(property => property in document)

    if(visibilityProperty == null || !document.addEventListener) return
    const visibilityEvent = `${visibilityProperty.slice(0, -6)}visibilitychange`

    document.addEventListener(visibilityEvent, event => 
        callback(!document[visibilityProperty])
    , false)
}