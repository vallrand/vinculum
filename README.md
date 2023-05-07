# Vinculum

[![github-pages Status](https://github.com/vallrand/vinculum/workflows/github-pages/badge.svg)](https://github.com/vallrand/vinculum/actions)

Puzzle Platformer. Entity Component System / TypeScript Demo.

[Demo](http://vallrand.github.io/vinculum/index.html)

### Build
```sh
npm install
npm run start //development
npm run build //production
```

Open Browser at `http://127.0.0.1:9000?debug`

### Features

  - Spritesheet packing and optimization.
  - 2D Batched renderering.
  - 2D Physics.
  - Audio
  - Animation System
  - Particle System

### Framework
Creating system example:
```typescript
class LogicSystem extends ProcedureSystem {
    private readonly components: DataView<LogicComponent>
    constructor(manager: EntityManager, options){
        this.components = manager.aquireDataView(LogicComponent)
    }
    execute(context: IUpdateContext){
        for(let i = 1; i <= this.components.data.length; i++)
            this.components.data.get(i).updateLogic()
    }
}

const manager = new EntityManager()

manager.registerSystem(LogicSystem, options)
```

Creating entity example:
```typescript
const entity = manager.createEntity()

manager.createComponent(entity, Transform2D, { position: [100, 200] })
manager.createComponent(entity, Material, { texture: 'assets/texture.png' })
manager.createComponent(entity, Sprite2D)
manager.createComponent(entity, LogicComponent, { value: 112 })

```