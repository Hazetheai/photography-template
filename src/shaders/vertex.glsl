// attribute vec3 position;
// attribute vec2 uv;
// attribute vec3 normal;

uniform float uTime;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uQuadSize;
uniform vec4 uCorners;

// varying float vPulse;
varying vec2 vUv;
// varying vec3 vNormal;
varying vec2 vSize;

void main() {
  vUv = uv;
  // vNormal = normal;
  vec3 newPosition = position;
  float PI = 3.1415926;

  // Used to ensure "waves" starts and ends at 0
  float sineProgress = sin(PI * uProgress);
  // Sine func to offset progress
  float waves = sineProgress * .1 * sin(5. * length(uv) + 5. * uProgress);

  vec4 defaultState = modelMatrix*vec4( position, 1.0 );
  vec4 fullScreenState = vec4( position, 1.0 );
  // fullScreenState.x *=uResolution.x/uQuadSize.x;
  // fullScreenState.y *=uResolution.y/uQuadSize.y;
  fullScreenState.x *= uResolution.x;
  fullScreenState.y *= uResolution.y;
  fullScreenState.z += uCorners.x;

  float cornersProgress = mix(
  // the xyzw can be swapped to change the corner order
    mix(uCorners.x, uCorners.y, uv.x),
    mix(uCorners.z, uCorners.w, uv.x),
    uv.y
  );

  // Use uProgress for linear change
  vec4 finalState = mix(defaultState, fullScreenState, cornersProgress +  waves);

  vSize = mix(uQuadSize, uResolution, cornersProgress);

  // modelMatrix is responsible for the shape moving on the screen
  // Without it, mesh positions are reset to 0,0;
    gl_Position = projectionMatrix * viewMatrix * finalState;
}