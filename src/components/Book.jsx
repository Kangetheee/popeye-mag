import {
    Bone,
    BoxGeometry,
    MeshStandardMaterial,
    Color,
    Float32BufferAttribute,
    Skeleton,
    SkinnedMesh,
    Uint16BufferAttribute,
    Vector3,
    SkeletonHelper,
} from "three";
import { pages } from "./UI";
import { useRef, useMemo } from "react";
import { useHelper } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { degToRad } from "three/src/math/MathUtils.js";

// Constants for page dimensions and segments
const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 5;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// Create the page geometry and position it
const pageGeometry = new BoxGeometry(
    PAGE_WIDTH,
    PAGE_HEIGHT,
    PAGE_DEPTH,
    PAGE_SEGMENTS,
    2
);
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

// Prepare skinning attributes
const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i); // Get the vertex
    const x = vertex.x; // Get the x position of the vertex
    const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); // Calculate skin index
    let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; // Calculate skin weight

    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); // Set skin index
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0); // Set skin weights
}

// Set the skin index and weights as attributes on the geometry
pageGeometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
    "skinWeights",
    new Float32BufferAttribute(skinWeights, 4)
);

// Define the materials for the pages
const whiteColor = new Color("white");
const pageMaterials = [
    new MeshStandardMaterial({ color: whiteColor }),
    new MeshStandardMaterial({ color: "#111" }),
    new MeshStandardMaterial({ color: whiteColor }),
    new MeshStandardMaterial({ color: whiteColor }),
    new MeshStandardMaterial({ color: "pink" }),
    new MeshStandardMaterial({ color: "pink" }),
];

// Page component
const Page = ({ number, front, back, ...props }) => {
    const group = useRef();
    const skinnedMeshRef = useRef();

    const manualSkinnedMesh = useMemo(() => {
        const bones = [];
        for (let i = 0; i <= PAGE_SEGMENTS; i++) {
            const bone = new Bone();
            bones.push(bone);
            bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH; // Position each bone
            if (i > 0) {
                bones[i - 1].add(bone); // Attach the new bone to the previous one
            }
        }
        const skeleton = new Skeleton(bones);

        // Create the skinned mesh with the geometry and materials
        const materials = pageMaterials
        const mesh = new SkinnedMesh(pageGeometry, pageMaterials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        mesh.add(skeleton.bones[0]); // Add the root bone
        mesh.bind(skeleton); // Bind the skeleton to the mesh
        
        return mesh;
    }, []);

    // Use SkeletonHelper to visualize bones in red
    useHelper(skinnedMeshRef, SkeletonHelper, "red");

    // Animation loop
    useFrame(() => {
        if (!skinnedMeshRef.current) {
            return;
        };

        const bones = skinnedMeshRef.current.skeleton.bones;

        // Rotate the third bone (index 2) around the Y-axis
        bones[2].rotation.y = degToRad(20);
    });

    return (
        <group {...props} ref={group}>
            <primitive object={manualSkinnedMesh} ref={skinnedMeshRef} />
        </group>
    );
};

// Book component to render the collection of pages
export const Book = ({ ...props }) => {
    return (
        <group {...props}>
            {[...pages].map((pagesData, index) => (
                <Page
                    position-x={index * 0.15} 
                    key={index} 
                    number={index} 
                    {...pagesData} 
                />
            ))}
        </group>
    );
};
