attribute vec2 aPosition;
attribute vec2 aUV;
attribute vec4 aColor;
attribute vec3 aTint;
attribute float aMaterial;

uniform mat3 uProjectionMatrix;

varying vec2 vUV;
varying vec4 vColor;
varying vec3 vTint;
varying float vMaterial;

void main(void){
    vec2 position = (uProjectionMatrix * vec3(aPosition, 1.0)).xy;
    gl_Position = vec4(position, 0.0, 1.0);
    vUV = aUV;
    vColor = aColor;
    vTint = aTint;
    vMaterial = aMaterial + .5;
}