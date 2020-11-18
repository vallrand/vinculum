import { GL, GLContext } from '../gl'

export const enum BlendMode {
    NONE = 0,
    NORMAL = 1,
    ADD = 2,
    SCREEN = 3,
    MULTIPLY = 4,
    SUBTRACT = 5,
    SRC_IN = 6,
    SRC_OUT = 7,
    SRC_ATOP = 8,
    DST_OVER = 9,
    DST_IN = 10,
    DST_OUT = 11,
    DST_ATOP = 12,
    XOR = 13
}

export const applyBlendMode = {
    [BlendMode.NONE](gl: GLContext){
        gl.disable(GL.BLEND)
    },
    [BlendMode.NORMAL](gl: GLContext, premultipliedAlpha: boolean){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        if(premultipliedAlpha) gl.blendFunc(GL.ONE, GL.ONE_MINUS_SRC_ALPHA)
        else gl.blendFuncSeparate(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA)
    },
    [BlendMode.ADD](gl: GLContext, premultipliedAlpha: boolean){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        if(premultipliedAlpha) gl.blendFunc(GL.ONE, GL.ONE)
        else gl.blendFuncSeparate(GL.SRC_ALPHA, GL.ONE, GL.ONE, GL.ONE)
    },
    [BlendMode.SCREEN](gl: GLContext, premultipliedAlpha: boolean){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        if(premultipliedAlpha) gl.blendFuncSeparate(GL.ONE, GL.ONE_MINUS_SRC_COLOR, GL.ONE, GL.ONE_MINUS_SRC_ALPHA)
        else gl.blendFuncSeparate(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_COLOR, GL.ONE, GL.ONE_MINUS_SRC_ALPHA)
    },
    [BlendMode.MULTIPLY](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFuncSeparate(GL.DST_COLOR, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA)
    },
    [BlendMode.SUBTRACT](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquationSeparate(GL.FUNC_REVERSE_SUBTRACT, GL.FUNC_ADD)
        gl.blendFuncSeparate(GL.ONE, GL.ONE, GL.ONE, GL.ONE)
    },
    [BlendMode.SRC_IN](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.DST_ALPHA, GL.ZERO)
    },
    [BlendMode.SRC_OUT](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.ONE_MINUS_DST_ALPHA, GL.ZERO)
    },
    [BlendMode.SRC_ATOP](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.DST_ALPHA, GL.ONE_MINUS_SRC_ALPHA)
    },
    [BlendMode.DST_OVER](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.ONE_MINUS_DST_ALPHA, GL.ONE)
    },
    [BlendMode.DST_IN](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.ZERO, GL.SRC_ALPHA)
    },
    [BlendMode.DST_OUT](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.ZERO, GL.ONE_MINUS_SRC_ALPHA)
    },
    [BlendMode.DST_ATOP](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.ONE_MINUS_DST_ALPHA, GL.SRC_ALPHA)
    },
    [BlendMode.XOR](gl: GLContext){
        gl.enable(GL.BLEND)
        gl.blendEquation(GL.FUNC_ADD)
        gl.blendFunc(GL.ONE_MINUS_DST_ALPHA, GL.ONE_MINUS_SRC_ALPHA)
    }
}