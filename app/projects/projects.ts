export type Project = {
    slug: string;
    title: string;
    description: string;
    image: string;
    href: string;
    repo: string;
    tags: string[];
    wip?: boolean;
};

export const projects: Project[] = [
    {
        slug: "threejs-chess",
        title: "ThreeJS | Chess",
        description:
            "A 3D chess game built in Three.js with custom-modelled pieces, a freely rotatable camera, and an AI opponent that is very easy to beat.",
        image: "/projects/chess.png",
        href: "https://kristianpayne1.github.io/threejs-chess/",
        repo: "https://github.com/kristianpayne1/threejs-chess",
        tags: ["ThreeJS", "GLSL"],
    },
    {
        slug: "threejs-forest-road",
        title: "ThreeJS | Forest Road",
        description:
            "A stylised forest road scene built in Blender and baked so the lighting and shadows look realistic without costing anything at runtime. The water uses custom shaders for the wave motion.",
        image: "/projects/landscape.png",
        href: "https://kristianpayne1.github.io/threejs-forest-road/",
        repo: "https://github.com/kristianpayne1/threejs-forest-road",
        tags: ["ThreeJS", "GLSL"],
    },
    {
        slug: "threejs-pirate-ship",
        title: "ThreeJS | Pirate Ship",
        description:
            "A pirate ship sailing on a procedurally animated ocean, powered by custom vertex shaders for the wave displacement.",
        image: "/projects/boat.png",
        href: "https://kristianpayne1.github.io/threejs-pirate-ship/",
        repo: "https://github.com/kristianpayne1/threejs-pirate-ship",
        tags: ["ThreeJS", "GLSL"],
    },
    {
        slug: "threejs-space-ship",
        title: "ThreeJS | Space Ship",
        description:
            "A game inspired by StarFox. Dodge, shoot, and do a barrel roll!",
        image: "/projects/space.png",
        href: "https://kristianpayne1.github.io/threejs-space-ship/",
        repo: "https://github.com/kristianpayne1/threejs-space-ship",
        tags: ["ThreeJS", "GLSL"],
        wip: true,
    },
    {
        slug: "threejs-basketball",
        title: "ThreeJS | Basketball",
        description:
            "A physics-driven basketball mini-game where you flick the ball at the hoop. Built with Three.js and a lightweight physics integration.",
        image: "/projects/basketball.png",
        href: "https://kristianpayne1.github.io/threejs-basketball/",
        repo: "https://github.com/kristianpayne1/threejs-basketball",
        tags: ["ThreeJS", "Physics", "WebGL"],
        wip: true
    },
];
