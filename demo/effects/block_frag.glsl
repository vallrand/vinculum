precision highp float;
varying vec2 vUV;
varying vec4 vColor;
varying vec2 vWorldPosition;

uniform float uTime;

mat2 rotationMat2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float rand(float n){return fract(sin(n) * 43758.5453123);}
float rand(vec2 n){return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);}
float rand(ivec2 n){return rand(vec2(n));}

float noise(float p){
	float fl = floor(p);
    float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

float noise(vec2 n){
	const ivec2 d = ivec2(0.0, 1.0);
    ivec2 b = ivec2(floor(n)); 
    vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float fbm(in vec2 p, in float time){
	float z=2.0;
    float rz=0.0;
    float n = noise(p * 0.5 + vec2(0.0, time));
    mat2 rm = rotationMat2(-0.64);
	for(int i=1;i<4;i++){
        p += vec2(n,time*0.5);

        n = noise(p + n);
        rz += (sin(n*5.0)*0.5+0.5) / z;
				
		z *= 1.2;
		p *= 2.0;
        p *= rm;
	}
	return rz;	
}

float frame(in float width){
    vec2 rect = abs(vUV - 0.5);
    return smoothstep(0.5, 0.5 - width, max(rect.x, rect.y));
}

void main(void){
    vec2 uv = vWorldPosition * 0.01;
    float rz = fbm(uv, uTime);

    vec3 color = vec3(1.0-rz*rz, 0.2 / rz, 0.2 / rz);
    color = pow(color, vec3(1.6,2.0,2.0));

    float width = 0.2;
    float edge = mix(-width, 1.0, vColor.a * frame(0.1));
    float fade = smoothstep(edge, edge + width, clamp(color.r,0.0,1.0));
    color.gb *= smoothstep(0.8, 0.5, fade);
    
    gl_FragColor = vec4(vColor.rgb * color, 1.0 - fade);
}