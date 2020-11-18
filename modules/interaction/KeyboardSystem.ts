import { ISystem, Manager } from 'framework/Manager'

type KeyBinding = Array<string | Array<string>>
interface KeyboardSystemOptions {
    keybindings: Record<string, KeyBinding>
}

export class KeyboardSystem implements ISystem {
    private readonly keys: Record<string, boolean> = Object.create(null)
    private readonly state: Record<string, number> = Object.create(null)
    private readonly lookup: Record<string, Array<string>> = Object.create(null)
    private readonly keybindings: Record<string, KeyBinding>
    constructor(private readonly manager: Manager, options: KeyboardSystemOptions){
        this.keybindings = options.keybindings
        for(let key in this.keybindings){
            const bindings: KeyBinding = this.keybindings[key]
            this.state[key] = 0
            Array.prototype.concat.apply([], bindings)
            .forEach((keyCode: string) => {
                const lookup = this.lookup[keyCode] = this.lookup[keyCode] || []
                if(~lookup.indexOf(key)) return
                lookup.push(key)
            })
        }
        
        window.addEventListener('keydown', event => {
            if(this.keys[event.code]) return
            this.keys[event.code] = true
            const keys = this.lookup[event.code]
            if(keys) for(let i = 0; i < keys.length; i++)
                this.evaluateKeyState(keys[i])
        })
        window.addEventListener('keyup', event => {
            this.keys[event.code] = false

            const keys = this.lookup[event.code]
            if(keys) for(let i = 0; i < keys.length; i++)
                this.evaluateKeyState(keys[i])
        })
    }
    private evaluateKeyState(key: string): void {
        const binding: KeyBinding = this.keybindings[key]
        const count: number = binding
        .reduce((total: number, bind: string | string[]) =>
            total + Number(Array.isArray(bind)
            ? (bind as string[]).every(bind => this.keys[bind])
            : !!this.keys[bind as string]), 0)
        this.state[key] = count
    }
    public keyDown(key: string): boolean { return !!this.state[key] }
}