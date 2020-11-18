attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uModelMatrix;
uniform mat4 uMVP;

varying vec3 vNormal;
varying vec2 vUV;

void main(void){
    vUV = aUV;
    vNormal = uModelMatrix * vec4(aNormal, 0.0);
    gl_Position = uMVP * vec4(aPosition, 1.0);
}