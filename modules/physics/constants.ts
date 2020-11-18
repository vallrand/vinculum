export const enum ShapeType {
    PARTICLE = 0x01,
    CIRCLE = 0x02,
    LINE = 0x04,
    BOX = 0x08,
    CONVEX = 0x10
}

export const enum BodyType {
    STATIC = 0,
    DYNAMIC = 1,
    KINEMATIC = 2
}

export const enum SleepState {
    AWAKE = 0,
    ASLEEP = 1,
    SLEEPY = 2
}