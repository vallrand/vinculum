import { Int16TupleMap } from '../helpers/Int16TupleMap'

export class ContactMaterial {
    friction: number = 0.3
    restitution: number = 0
    stiffness: number = 1e6
    relaxation: number = 4
    frictionStiffness: number = 1e6
    frictionRelaxation: number = 4
    surfaceVelocity: number = 0
    contactSkinSize: number = 0.005
    frictionGravity: number = 9.78
}

export class MaterialCollection extends Int16TupleMap<ContactMaterial> {
    private readonly defaultMaterial = new ContactMaterial
    public findContactMaterial(materialA: number, materialB: number): ContactMaterial {
        return this.get(materialA, materialB) || this.defaultMaterial
    }
}