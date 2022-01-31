// attribute vec3 position;
// attribute vec2 uv;
// attribute vec3 normal;

uniform float time;
varying float pulse;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 newPosition = position;
  newPosition.z = 0.1 * sin(length(position) * 30. + time);

pulse = 20.0 * newPosition.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}