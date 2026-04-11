"use client";

import { useRef, type ComponentProps } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Color, DoubleSide, Material, Mesh, OrthographicCamera } from "three";
import FlowMaterial from "./materials/FlowMaterial";

extend({ FlowMaterial });

type WaveProps = ComponentProps<"mesh"> & {
    resolution?: number;
    opacity?: number;
    color?: Color;
    length?: number;
};

type FlowUniformMaterial = Material & {
    uTime: number;
    uAlpha: number;
    uColor: Color;
};

export default function Wave({
    resolution = 128,
    opacity = 0.5,
    color = new Color("#fff"),
    length = 1,
    ...meshProps
}: WaveProps) {
    const materialRef = useRef<FlowUniformMaterial | null>(null);
    const meshRef = useRef<Mesh | null>(null);
    const { camera, viewport } = useThree();

    useFrame((state, deltaTime) => {
        const material = materialRef.current;
        if (material) {
            material.uTime += deltaTime;
        }

        const mesh = meshRef.current;
        if (mesh) {
            const cam = state.camera;
            const viewportWidth =
                cam instanceof OrthographicCamera
                    ? (cam.right - cam.left) / cam.zoom
                    : state.viewport.width;
            const waveLength = Math.max(viewportWidth / 2, 1) * length;
            mesh.scale.set(waveLength, 1, 1);
        }
    });

    const initialViewportWidth =
        camera instanceof OrthographicCamera
            ? (camera.right - camera.left) / camera.zoom
            : viewport.width;
    const initialWaveLength = Math.max(initialViewportWidth / 2, 1) * length;

    return (
        <mesh ref={meshRef} {...meshProps} scale={[initialWaveLength, 1, 1]}>
            <planeGeometry args={[2, 2, resolution, resolution]} />
            <flowMaterial
                ref={materialRef}
                side={DoubleSide}
                transparent
                depthTest={false}
                uAlpha={opacity}
                uColor={color}
            />
        </mesh>
    );
}
