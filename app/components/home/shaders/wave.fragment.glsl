precision mediump float;

uniform float uAlpha;
uniform vec3 uColor;

varying vec3 vPosition;

vec3 computeNormal(vec3 normal) {
  vec3 x = dFdx(normal);
  vec3 y = dFdy(normal);
  vec3 computedNormal = normalize(cross(x, y));
  return computedNormal;
}

float fresnel(float bias, float scale, float power, vec3 i, vec3 n) {
  return bias + scale * pow(1.0 + dot(i, n), power);
}


void main() {
  vec3 color = uColor;

  vec3 computedNormal = computeNormal(vPosition);
  vec3 eyeVector = vec3(0.0, 0.0, -1.0);
  float f = fresnel(0.0, 0.5, 4.0, eyeVector, computedNormal);
  float alpha = f * uAlpha;

  gl_FragColor = vec4(color, alpha);
}
