varying vec2 vUv;
varying float vElevation;

uniform float uTime;
void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float elevation = sin(uv.x * uTime) * 0.1;
    elevation += cos(uv.y * uTime) * 0.1;

    modelPosition.y += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vUv = uv;
    vElevation = elevation;
}
