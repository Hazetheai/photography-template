// attribute vec3 position;
// attribute vec2 uv;
// attribute vec3 normal;

uniform float uTime;

varying float vPulse;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 newPosition = position;
  newPosition.z = 0.05 * sin(length(position) * 30. + uTime);


  vPulse = 20.0 * newPosition.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}