"use client";

import { Canvas } from "@react-three/fiber";
import Wave from "./wave";

export function HeroCanvas() {
    return (
        <div className="absolute h-screen w-full left-0 top-0">
            <Canvas>
                <ambientLight intensity={0.6} />
                <directionalLight position={[3, 3, 3]} intensity={1.2} />
                <directionalLight position={[-2, -3, -2]} intensity={0.6} />
                <Wave />
            </Canvas>
        </div>
    );
}
