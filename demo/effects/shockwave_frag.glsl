varying vec2 vUV;
varying vec2 vDirection;
varying vec2 vCenter;

uniform sampler2D uSampler;
uniform vec4 uViewport;

uniform float uAmplitude;

float bulge(in float distance){
    return distance*distance*distance*distance*(3.0 - 2.0 * distance*distance);
}

float pinch(in float distance){
    return mix(1.0, pow(distance, uAmplitude), 1.0 - distance);
}

void main(){
    float distance = clamp(length(vDirection),-1.0,1.0);

    float displacement = (
        mix(1.0, bulge(distance), uAmplitude * step(0.0, uAmplitude)) *
        mix(1.0, pinch(distance), -uAmplitude * step(0.0, -uAmplitude))
    );

    vec2 uv = vUV - vCenter;
    uv *= displacement;
    uv += vCenter;
    uv = clamp(uv, uViewport.xy, uViewport.xy + uViewport.zw);

    vec4 color = texture2D(uSampler, uv);
    gl_FragColor = mix(color, color * vec4(0.6,1.4,1.6,1.0), max(-0.36, 1.0 - displacement));  
}