import type { ReactThreeFiber } from "@react-three/fiber";
import type { WaveMaterial } from "../components/home/wave";

declare module "@react-three/fiber" {
    interface ThreeElements {
        waveMaterial: ReactThreeFiber.Object3DNode<
            InstanceType<typeof WaveMaterial>,
            typeof WaveMaterial
        >;
    }
}

export {};
