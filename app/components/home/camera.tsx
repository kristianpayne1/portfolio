"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { OrthographicCamera as ThreeOrthographicCamera } from "three";

const CAMERA_ZOOM = 2;

export default function Camera() {
    const { size } = useThree();
    const cameraRef = useRef<ThreeOrthographicCamera>(null);
    const aspect = size.height > 0 ? size.width / size.height : 1;

    useFrame(({ size }) => {
        const camera = cameraRef.current;
        if (!camera) return;

        const aspect = size.height > 0 ? size.width / size.height : 1;
        camera.left = -CAMERA_ZOOM * aspect;
        camera.right = CAMERA_ZOOM * aspect;
        camera.top = CAMERA_ZOOM;
        camera.bottom = -CAMERA_ZOOM;
        camera.updateProjectionMatrix();
    });

    return (
        <OrthographicCamera
            ref={cameraRef}
            makeDefault
            left={-CAMERA_ZOOM * aspect}
            right={CAMERA_ZOOM * aspect}
            top={CAMERA_ZOOM}
            bottom={-CAMERA_ZOOM}
            near={0.1}
            far={1000}
            zoom={1.5}
            position={[0, 0, 5]}
        />
    );
}
