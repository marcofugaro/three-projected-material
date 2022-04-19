import { MeshPhysicalMaterial } from 'three/src/materials/MeshPhysicalMaterial.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { Texture } from 'three/src/textures/Texture.js';
import { Vector2 } from 'three/src/math/Vector2.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import type { BufferGeometry, Camera, InstancedMesh, Material, MeshPhysicalMaterialParameters, OrthographicCamera, Mesh } from 'three';
interface ProjectedMaterialParameters extends MeshPhysicalMaterialParameters {
    camera?: PerspectiveCamera | OrthographicCamera;
    texture?: Texture;
    textureScale?: number;
    textureOffset?: Vector2;
    cover?: boolean;
}
export declare class ProjectedMaterial extends MeshPhysicalMaterial {
    #private;
    get camera(): PerspectiveCamera | OrthographicCamera;
    set camera(camera: PerspectiveCamera | OrthographicCamera);
    get texture(): Texture;
    set texture(texture: Texture);
    get textureScale(): number;
    set textureScale(textureScale: number);
    get textureOffset(): Vector2;
    set textureOffset(textureOffset: Vector2);
    get cover(): boolean;
    set cover(cover: boolean);
    projectedTexelToLinear: string;
    uniforms: {
        projectedTexture: {
            value: Texture;
        };
        isTextureLoaded: {
            value: boolean;
        };
        isTextureProjected: {
            value: boolean;
        };
        backgroundOpacity: {
            value: number;
        };
        viewMatrixCamera: {
            value: Matrix4;
        };
        projectionMatrixCamera: {
            value: Matrix4;
        };
        projPosition: {
            value: Vector3;
        };
        projDirection: {
            value: Vector3;
        };
        savedModelMatrix: {
            value: Matrix4;
        };
        widthScaled: {
            value: number;
        };
        heightScaled: {
            value: number;
        };
        textureOffset: {
            value: Vector2;
        };
    };
    readonly isProjectedMaterial = true;
    constructor({ camera, texture, textureScale, textureOffset, cover, ...options }?: ProjectedMaterialParameters);
    saveDimensions(): void;
    saveCameraMatrices(): void;
    project(mesh: Mesh): void;
    projectInstanceAt(index: number, instancedMesh: InstancedMesh, matrixWorld: Matrix4, { forceCameraSave }?: {
        forceCameraSave?: boolean | undefined;
    }): void;
    copy(source: this): this;
}
export declare function allocateProjectionData(geometry: BufferGeometry, instancesCount: number): void;
export declare function isOrthographicCamera(cam: Camera): cam is OrthographicCamera;
export declare function isPerspectiveCamera(cam: Camera): cam is PerspectiveCamera;
export declare function isProjectedMaterial(mat: Material | Material[]): mat is ProjectedMaterial;
export {};
