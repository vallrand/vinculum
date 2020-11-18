attribute vec2 aPosition;

uniform mat3 uViewMatrix;
uniform mat3 uInvViewMatrix;
uniform vec4 uViewport;

varying vec2 vUV;
varying vec2 vScreenPosition;
varying vec2 vWorldPosition;

void main(void){
    vScreenPosition = (0.5 + 0.5 * aPosition);
    vUV = vScreenPosition * uViewport.zw + uViewport.xy;
    vWorldPosition = (uInvViewMatrix * vec3(aPosition, 1.0)).xy;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}