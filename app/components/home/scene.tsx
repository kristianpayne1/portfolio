"use client";

import { Canvas } from "@react-three/fiber";
import Camera from "./camera";
import Wave from "./wave";
import useControls from "./hooks/useControls";
import { easings, useSpring } from "@react-spring/web";
import { useEffect } from "react";

export default function Scene() {
    const { opacity, setOpacity } = useControls();
    const [, api] = useSpring(() => ({
        from: { brightness: 0.0, opacity: 0.0 },
    }));

    useEffect(() => {
        api.start({
            from: { brightness: 0.0, opacity: 0.0 },
            to: { brightness: 1.0, opacity: 0.5 },
            config: { duration: 1e3, easing: easings.easeInOutSine },
            onChange: ({ value }) => {
                setOpacity(value.opacity);
            },
        });
    }, [api, setOpacity]);

    return (
        <Canvas>
            <Camera />
            <Wave position={[0, -0.7, 0]} opacity={opacity} />
        </Canvas>
    );
}
