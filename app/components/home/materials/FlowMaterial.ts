import { shaderMaterial } from "@react-three/drei";
import { type ThreeElement } from "@react-three/fiber";
import { Color } from "three";

import flowVertexShader from "../shaders/wave.vertex.glsl";
import flowFragmentShader from "../shaders/wave.fragment.glsl";

const defaultFlowUniforms = {
    uTime: 0,
    uAlpha: 0.5,
    uColor: new Color("#fff"),
};

const FlowMaterial = shaderMaterial(
    defaultFlowUniforms,
    flowVertexShader,
    flowFragmentShader,
);

export default FlowMaterial;

declare module "@react-three/fiber" {
    interface ThreeElements {
        flowMaterial: ThreeElement<typeof FlowMaterial>;
    }
}

export { defaultFlowUniforms };
