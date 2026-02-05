"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function SpinningCube() {
    const meshRef = useRef<Mesh>(null);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x += delta * 0.35;
        meshRef.current.rotation.y += delta * 0.45;
    });

    return (
        <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            <meshStandardMaterial
                color="#7dd3fc"
                roughness={0.25}
                metalness={0.7}
            />
        </mesh>
    );
}

export function HeroCanvas() {
    return (
        <div className="absolute h-[320px] w-full md:h-[420px] left-0 top-0">
            <Canvas camera={{ position: [2.4, 2.2, 3.2], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[3, 3, 3]} intensity={1.2} />
                <directionalLight position={[-2, -3, -2]} intensity={0.6} />
                <SpinningCube />
            </Canvas>
        </div>
    );
}
