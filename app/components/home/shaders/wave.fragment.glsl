varying vec2 vUv;

uniform vec3 uColor;
uniform float uTime;
uniform float uAlpha;

void main() {
    gl_FragColor = vec4(uColor, uAlpha);
}