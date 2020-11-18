attribute vec2 aPosition;

uniform mat3 uViewMatrix;
uniform mat3 uInvViewMatrix;
uniform vec4 uViewport;

uniform vec2 uCenter;
uniform float uRadius;

varying vec2 vUV;
varying vec2 vDirection;
varying vec2 vCenter;

void main(void){
    vUV = (0.5 + 0.5 * aPosition) * uViewport.zw + uViewport.xy;
    gl_Position = vec4(aPosition, 0.0, 1.0);
    
    vec3 worldPosition = uInvViewMatrix * vec3(aPosition, 1.0);
    vDirection = (worldPosition.xy - uCenter) / uRadius;
    vCenter = (0.5 + 0.5 * (uViewMatrix * vec3(uCenter, 1.0)).xy) * uViewport.zw + uViewport.xy;
}