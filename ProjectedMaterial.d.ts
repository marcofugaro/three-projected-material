declare module 'three-projected-material' {
  import {
    MeshPhysicalMaterial,
    PerspectiveCamera,
    Texture,
    Vector2,
    Matrix4,
    Vector3,
    BufferGeometry,
    InstancedMesh,
    MeshPhysicalMaterialParameters,
    OrthographicCamera,
    Mesh,
  } from 'three'

  interface ProjectedMaterialParameters extends MeshPhysicalMaterialParameters {
    camera?: PerspectiveCamera | OrthographicCamera
    texture?: Texture
    textureScale?: number
    textureOffset?: Vector2
    cover?: boolean
  }

  export default class ProjectedMaterial extends MeshPhysicalMaterial {
    camera: PerspectiveCamera | OrthographicCamera
    texture: Texture
    textureScale: number
    textureOffset: Vector2
    cover: boolean

    uniforms: {
      projectedTexture: {
        value: Texture
      }
      isTextureLoaded: {
        value: boolean
      }
      isTextureProjected: {
        value: boolean
      }
      backgroundOpacity: {
        value: number
      }
      viewMatrixCamera: {
        value: Matrix4
      }
      projectionMatrixCamera: {
        value: Matrix4
      }
      projPosition: {
        value: Vector3
      }
      projDirection: {
        value: Vector3
      }
      savedModelMatrix: {
        value: Matrix4
      }
      widthScaled: {
        value: number
      }
      heightScaled: {
        value: number
      }
      textureOffset: {
        value: Vector2
      }
    }

    readonly isProjectedMaterial = true

    constructor({
      camera,
      texture,
      textureScale,
      textureOffset,
      cover,
      ...options
    }?: ProjectedMaterialParameters)

    project(mesh: Mesh): void

    projectInstanceAt(
      index: number,
      instancedMesh: InstancedMesh,
      matrixWorld: Matrix4,
      {
        forceCameraSave,
      }?: {
        forceCameraSave?: boolean | undefined
      }
    ): void
  }

  export function allocateProjectionData(geometry: BufferGeometry, instancesCount: number): void
}
