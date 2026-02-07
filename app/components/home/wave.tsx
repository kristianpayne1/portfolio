import { shaderMaterial } from "@react-three/drei";
import { useFrame, extend } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";
import type { Mesh } from "three";

import vertexShader from "./shaders/wave.vertex.glsl";
import fragmentShader from "./shaders/wave.fragment.glsl";

export const WaveMaterial = shaderMaterial(
    {
        uColor: new Color("#ffffff"),
        uTime: 0.0,
        uAlpha: 0.5,
    },
    vertexShader,
    fragmentShader
);

extend({ WaveMaterial });

export default function Wave() {
    const ref = useRef<Mesh>(null);
    const matRef = useRef<InstanceType<typeof WaveMaterial>>(null);

    useFrame((_, deltaTime) => {
        if (!ref.current) return;
        if (!matRef.current) return;
        matRef.current.uniforms.uTime.value += deltaTime;
    });

    return (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 5, 1000, 100]} />
            <waveMaterial
                ref={matRef}
                side={DoubleSide}
                blending={AdditiveBlending}
                transparent
            />
        </mesh>
    );
}
