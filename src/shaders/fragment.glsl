uniform float uTime;
uniform float uProgress;
uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uQuadSize;
uniform vec2 uHovered;

// varying float vPulse;
varying vec2 vUv;
// varying vec3 vNormal;
varying vec2 vSize;

// Scale UVs viewport to maintain aspect ratio
vec2 getUV(vec2 uv, vec2 textureSize, vec2 quadSize){
    // Decrease uv val for manipulation
    vec2 tempUV = uv - vec2(0.5);

    float quadAspect = quadSize.x / quadSize.y;
    float textureAspect = textureSize.x / textureSize.y;

    // Implementation background-size:cover 
    if( quadAspect < textureAspect ){
        tempUV = tempUV * vec2(quadAspect/textureAspect, 1.);
    } else {
        tempUV = tempUV * vec2(1., textureAspect/quadAspect);
    }

    // Re-add subtracted value to preserve correct ratios
    tempUV += vec2(0.5);
    return tempUV;

}


void main() {
    // Example of how to manipulate UV
    // vec2 newUV = (vUv - vec2(0.5)) * vec2(2., 1.)  + vec2(0.5);
    
    vec2 correctUV = getUV(vUv, uTextureSize, vSize);

    vec4 image = vec4(uHovered.x) * texture(uTexture, correctUV);


    // gl_FragColor = vec4( vUv, 0.0, 1.);
    gl_FragColor =  image;
}