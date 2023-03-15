# three-projected-material

> Three.js Material which lets you do [Texture Projection](https://en.wikipedia.org/wiki/Projective_texture_mapping) on a 3d Model.

<p align="center">
  <a href="https://marcofugaro.github.io/three-projected-material/"><img src="screenshot.png" width="700"></a>
</p>

## Installation

After having installed three.js, install it from npm with:

```
npm install three-projected-material
```

or

```
yarn add three-projected-material
```

You can also use it from the CDN, just make sure to use the three.js import map:

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three/build/three.module.js"
    }
  }
</script>
<script type="module">
  import ProjectedMaterial from 'https://unpkg.com/three-projected-material/build/ProjectedMaterial.module.js'
  // ...
</script>
```

## Getting started

You can import it like this

```js
import ProjectedMaterial from 'three-projected-material'
```

or, if you're using CommonJS

```js
const ProjectedMaterial = require('three-projected-material').default
```

Then, you can use it like this:

```js
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new ProjectedMaterial({
  camera, // the camera that acts as a projector
  texture, // the texture being projected
  textureScale: 0.8, // scale down the texture a bit
  textureOffset: new THREE.Vector2(0.1, 0.1), // you can translate the texture if you want
  cover: true, // enable background-size: cover behaviour, by default it's like background-size: contain
  color: '#ccc', // the color of the object if it's not projected on
  roughness: 0.3, // you can pass any other option that belongs to MeshPhysicalMaterial
})
const box = new THREE.Mesh(geometry, material)
webgl.scene.add(box)

// move the mesh any way you want!
box.rotation.y = -Math.PI / 4

// and when you're ready project the texture on the box!
material.project(box)
```

ProjectedMaterial also supports **instanced meshes** via three.js' [InstancedMesh](https://threejs.org/docs/index.html#api/en/objects/InstancedMesh), and even **multiple projections**. Check out the examples below for a detailed guide!

## [Examples](https://marcofugaro.github.io/three-projected-material/)

<p align="center">
  <a href="https://marcofugaro.github.io/three-projected-material/basic"><img width="274" src="examples/screenshots/basic.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/same-camera"><img width="274" src="examples/screenshots/same-camera.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/3d-model"><img width="274" src="examples/screenshots/3d-model.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/orthographic-camera"><img width="274" src="examples/screenshots/orthographic-camera.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/transparency"><img width="274" src="examples/screenshots/transparency.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/envmap"><img width="274" src="examples/screenshots/envmap.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/multiple-projections"><img width="274" src="examples/screenshots/multiple-projections.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/instancing"><img width="274" src="examples/screenshots/instancing.png" /></a>
  <a href="https://marcofugaro.github.io/three-projected-material/multiple-projections-instancing"><img width="274" src="examples/screenshots/multiple-projections-instancing.png" /></a>
</p>

## API Reference

### new ProjectedMaterial({ camera, texture, ...others })

Create a new material to later use for a mesh.

| Option              | Default               | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `camera`            |                       | The [PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera) the texture will be projected from.                                                                                                                                                                                                                                                                         |
| `texture`           |                       | The [Texture](https://threejs.org/docs/#api/en/textures/Texture) being projected.                                                                                                                                                                                                                                                                                                               |
| `textureScale`      | 1                     | Make the texture bigger or smaller.                                                                                                                                                                                                                                                                                                                                                             |
| `textureOffset`     | `new THREE.Vector2()` | Offset the texture in a x or y direction. The unit system goes from 0 to 1, from the bottom left corner to the top right corner of the projector camera frustum.                                                                                                                                                                                                                                |
| `cover`             | false                 | Wheter the texture should act like [`background-size: cover`](https://css-tricks.com/almanac/properties/b/background-size/) on the projector frustum. By default it works like [`background-size: contain`](https://css-tricks.com/almanac/properties/b/background-size/).                                                                                                                      |
| `backgroundOpacity` | 1                     | The opacity of the part of the mesh which is not covered by the projected texture. You can set this to 0 if you don't want the non-projected part of the mesh to be shown.                                                                                                                                                                                                                      |
| `...options`        |                       | Other options you pass to any three.js material like `color`, `opacity`, `envMap` and so on. The material is built from a [MeshPhysicalMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshPhysicalMaterial), so you can pass any property of that material and of its parent [MeshStandardMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshStandardMaterial). |

These properties are exposed as properties of the material, so you can change them later.

For example, to update the material texture and change its scale:

```js
material.texture = newTexture
material.textureScale = 0.8
```

### material.project(mesh)

Project the texture from the camera on the mesh. With this method we "take a snaphot" of the current mesh and camera position in space. The
After calling this method, you can move the mesh or the camera freely.

| Option | Description                                          |
| ------ | ---------------------------------------------------- |
| `mesh` | The mesh that has a `ProjectedMaterial` as material. |

### allocateProjectionData(geometry, instancesCount)

Allocate the data that will be used when projecting on an [InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh). Use this on the geometry that will be used in pair with a `ProjectedMaterial` when initializing `InstancedMesh`.

This needs to be called before `.projectInstanceAt()`.

| Option           | Description                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| `geometry`       | The geometry that will be passed to the `InstancedMesh`.                      |
| `instancesCount` | The number of instances, the same that will be passed to the `InstancedMesh`. |

### material.projectInstanceAt(index, instancedMesh, matrix)

Do the projection for an [InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh). Don't forget to call `updateMatrix()` like you do before calling `InstancedMesh.setMatrixAt()`.

To do projection an an instanced mesh, the geometry needs to be prepared with `allocateProjectionData()` beforehand.

```js
dummy.updateMatrix()
projectInstanceAt(i, instancedMesh, dummy.matrix)
```

[Link to the full example about instancing](https://marcofugaro.github.io/three-projected-material/instancing).

| Option          | Description                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `index`         | The index of the instanced element to project.                                                                           |
| `instancedMesh` | The [InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh) with a projected material.                   |
| `matrix`        | The `matrix` of the dummy you used to position the instanced mesh element. Be sure to call `.updateMatrix()` beforehand. |
