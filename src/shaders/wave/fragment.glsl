uniform float uTime;
uniform sampler2D uTexture;

varying float vPulse;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    // gl_FragColor = vec4(0.,0.,1., 1.);

    // vec4 myimage = texture(
    //     uTexture,
    //     vUv + 0.01*sin(vUv*20. + time) 
    // );

    // float sinePulse = (1. + sin(vUv.x*50. - time))*0.5;
    // gl_FragColor = vec4( vUv,0.,1.);
    // gl_FragColor = vec4( sinePulse,0.,0.,1.);
    // gl_FragColor = myimage;
    gl_FragColor = vec4( 1.0, vPulse,0.,1.);
}