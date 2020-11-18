export function HTMLNode(
    tag: string,
    { style, dataset, ...attributes }: any,
    children?: HTMLElement[],
    listeners?: Record<string, (event: Event) => void>
): HTMLElement {
    const element: HTMLElement = document.createElement(tag)
    Object.assign(element, attributes)
    Object.assign(element.style, style)
    Object.assign(element.dataset, dataset)
    if(children) children.forEach(child => element.appendChild(child))
    if(listeners) for(let event in listeners) element.addEventListener(event, listeners[event])
    return element
}