import { range } from 'math/utilities'

export default (samplers: number): string => `
varying vec2 vUV;
varying vec4 vColor;
varying vec3 vTint;
varying float vMaterial;

uniform sampler2D uSamplers[${samplers}];

void main(void){
    int tex = int(vMaterial);
    vec4 color;
    ${range(samplers)
    .map(i => `${i ? 'else ' : ''}if(tex == ${i}) color = texture2D(uSamplers[${i}], vUV);`)
    .join('\n')}
    gl_FragColor = vColor * color + vec4(vTint, 0.0);
}`