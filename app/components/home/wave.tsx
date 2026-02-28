"use client";

import { useRef, type ComponentProps } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Color, DoubleSide, Material, OrthographicCamera } from "three";
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
    const { camera, viewport } = useThree();
    const viewportWidth =
        camera instanceof OrthographicCamera
            ? (camera.right - camera.left) / camera.zoom
            : viewport.width;
    const waveLength = Math.max(viewportWidth / 2, 1) * length;

    useFrame((_, deltaTime) => {
        const material = materialRef.current;
        if (!material) return;

        material.uTime += deltaTime;
    });

    return (
        <mesh {...meshProps} scale={[waveLength, 1, 1]}>
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
