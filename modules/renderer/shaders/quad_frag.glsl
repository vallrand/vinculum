varying vec2 vUV;
varying vec2 vScreenPosition;
varying vec2 vWorldPosition;

uniform sampler2D uSampler;

void main(void){
    gl_FragColor = texture2D(uSampler, vUV);
}