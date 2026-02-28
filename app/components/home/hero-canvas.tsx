"use client";

import Scene from "./scene";
import { ControlsProvider } from "./hooks/useControls";

export function HeroCanvas() {
    return (
        <div className="absolute h-screen w-full left-0 top-0">
            <ControlsProvider>
                <Scene />
            </ControlsProvider>
        </div>
    );
}
