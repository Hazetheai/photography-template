// attribute vec3 position;
// attribute vec2 uv;
// attribute vec3 normal;

uniform float uTime;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uQuadSize;

varying float vPulse;
varying vec2 vUv;
varying vec3 vNormal;
varying vec2 vSize;

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 newPosition = position;

    vec4 defaultState = modelMatrix*vec4( position, 1.0 );
    vec4 fullScreenState = vec4( position, 1.0 );
    fullScreenState.x *=uResolution.x/uQuadSize.x;
    fullScreenState.y *=uResolution.y/uQuadSize.y;

  vec4 finalState = mix(defaultState, fullScreenState, uProgress);

  vSize = mix(uQuadSize, uResolution, uProgress);

  // modelMatrix is responsible for the shape moving on the screen
  // Without it, mesh positions are reset to 0,0;
    gl_Position = projectionMatrix * viewMatrix * finalState;
}