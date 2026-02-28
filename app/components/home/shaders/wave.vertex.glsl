precision highp float;

uniform float uTime;

varying vec3 vPosition;

float hash(float n) {
  return fract(sin(n) * 1e4);
}

float noise(vec3 x) {
  const vec3 step = vec3(110.0, 241.0, 171.0);

  vec3 i = floor(x);
  vec3 f = fract(x);
  float n = dot(i, step);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash(n + dot(step, vec3(0.0, 0.0, 0.0))), hash(n + dot(step, vec3(1.0, 0.0, 0.0))), u.x),
      mix(hash(n + dot(step, vec3(0.0, 1.0, 0.0))), hash(n + dot(step, vec3(1.0, 1.0, 0.0))), u.x),
      u.y
    ),
    mix(
      mix(hash(n + dot(step, vec3(0.0, 0.0, 1.0))), hash(n + dot(step, vec3(1.0, 0.0, 1.0))), u.x),
      mix(hash(n + dot(step, vec3(0.0, 1.0, 1.0))), hash(n + dot(step, vec3(1.0, 1.0, 1.0))), u.x),
      u.y
    ),
    u.z
  );
}

float xmbNoise(vec3 x) {
  return cos(x.z * 4.0) * cos(x.z + uTime / 10.0 + x.x);
}

void main() {
  vec3 p = vec3(position.x, 0.0, position.y);

  p.y = xmbNoise(p) / 8.0;

  vec3 p2 = p;
  p2.x -= uTime / 5.0;
  p2.x /= 4.0;
  p2.y -= uTime / 100.0;
  p2.z -= uTime / 10.0;
  p.y -= noise(p2 * 8.0) / 12.0 + cos(p.x * 2.0 - uTime / 2.0) / 5.0 - 0.3;
  p.z -= noise(p2 * 8.0) / 12.0;

  vec4 modelPosition = modelMatrix * vec4(p, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  vPosition = p;
}
