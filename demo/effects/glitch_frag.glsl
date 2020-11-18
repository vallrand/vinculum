precision highp float;
varying vec2 vUV;
varying vec2 vScreenPosition;
varying vec2 vWorldPosition;

uniform sampler2D uSampler;

uniform float uTime;
uniform float uIntensity;
//uniform float uChromaticAberration;

float rand(float n){return fract(sin(n) * 43758.5453123);}
float rand(vec2 n){return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);}
float noise(float p){
	float fl = floor(p);
    float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}
float noise(vec2 n){
	const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float blockNoise(float p, float threshold, float seed){
    float n = noise(128.0 * vec2(p, p));
    float i = floor(n * 24.0);
    i = noise(i + seed) - 0.5;
    return i * step(abs(i), threshold);
}

void main(void){
    vec2 uv = vUV;

    float noiseOffset = floor(uTime + sin(13.0 * uTime) + sin(uTime)) * 0.64;

    float displaceIntesnsity = uIntensity * (0.2 + 0.3 * pow(sin(uTime * 1.2), 5.0));
    float displace = blockNoise(uv.y / 25.0 + noiseOffset, displaceIntesnsity, 131.79);
    displace *= blockNoise(2.0 * uv.x / 111.0 + noiseOffset, displaceIntesnsity, 11.89);
    
    uv.x += displace;
    
    float rgbIntesnsity = uIntensity * (0.1 + 0.1 * sin(uTime * 5.2));
    vec2 uvOffset = 0.1 * vec2(blockNoise(uv.y / 65.0 + noiseOffset, rgbIntesnsity, 893.32), 0.0);
    
    float red = texture2D(uSampler, uv-uvOffset).r;
	float green = texture2D(uSampler, uv).g;
    float blue = texture2D(uSampler, uv+uvOffset).b;

    vec3 mask = vec3(1.0, 1.0, 1.0);
    
    float dropoutIntensity = uIntensity * 0.2;
    float dropout = blockNoise(uv.y / 23.0 + noiseOffset, dropoutIntensity, uTime) * blockNoise(uv.x / 31.0 + noiseOffset, dropoutIntensity, uTime);
    mask *= (1.0 - 8.0 * dropout);
    
    gl_FragColor = vec4(mask * vec3(red, green, blue), 1.0);
}