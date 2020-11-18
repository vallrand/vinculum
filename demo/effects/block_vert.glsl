attribute vec2 aPosition;
attribute vec2 aUV;
attribute vec4 aColor;

uniform mat3 uProjectionMatrix;

varying vec2 vUV;
varying vec4 vColor;
varying vec2 vWorldPosition;

void main(void){
    vWorldPosition = aPosition;
    vec2 position = (uProjectionMatrix * vec3(aPosition, 1.0)).xy;
    gl_Position = vec4(position, 0.0, 1.0);
    vUV = aUV;
    vColor = aColor;
}