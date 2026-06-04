import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import maplibregl from 'maplibre-gl';
import type { TreePoint } from './greenAreaTreesLayer';

const TREE_HEIGHT_METERS = 2.5;
const ROT_X = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

interface GltfPart {
  geom: THREE.BufferGeometry;
  mat: THREE.Material | THREE.Material[];
  gltfWorldMatrix: THREE.Matrix4;
}

export function createGreenTreesThreeLayer(initialPoints: TreePoint[] = []) {
  let camera: THREE.Camera | null = null;
  let scene: THREE.Scene | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const gltfParts: GltfPart[] = [];

  // partBaseMatrices[partIdx][treeIdx] = treeMercatorMatrix * gltfMeshLocalMatrix
  // Bu matrisler sabit kalır — render'da sadece mainMatrix ile çarpılır
  const partBaseMatrices: THREE.Matrix4[][] = [];

  let currentPoints: TreePoint[] = initialPoints;
  let mapRef: maplibregl.Map | null = null;
  let modelReady = false;

  // Render döngüsünde GC baskısını azaltmak için önceden tahsis edilmiş matrisler
  const _mainMat = new THREE.Matrix4();
  const _combined = new THREE.Matrix4();
  const _identity = new THREE.Matrix4();

  function buildBaseMatrices() {
    partBaseMatrices.length = 0;
    const treeMat = new THREE.Matrix4();
    const instanceMat = new THREE.Matrix4();

    for (const { gltfWorldMatrix } of gltfParts) {
      const list: THREE.Matrix4[] = [];
      for (const { position: [lng, lat] } of currentPoints) {
        const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        const s = mc.meterInMercatorCoordinateUnits() * TREE_HEIGHT_METERS;
        treeMat
          .makeTranslation(mc.x, mc.y, mc.z)
          .scale(new THREE.Vector3(s, -s, s))
          .multiply(ROT_X);
        instanceMat.multiplyMatrices(treeMat, gltfWorldMatrix);
        list.push(instanceMat.clone());
      }
      partBaseMatrices.push(list);
    }
  }

  function buildInstances() {
    if (!modelReady || !scene) return;
    instancedMeshes.forEach(m => scene!.remove(m));
    instancedMeshes.length = 0;
    if (currentPoints.length === 0) { mapRef?.triggerRepaint(); return; }

    buildBaseMatrices();

    for (const { geom, mat } of gltfParts) {
      const mesh = new THREE.InstancedMesh(geom, mat, currentPoints.length);
      mesh.frustumCulled = false;
      // Instance matrisler render'da her frame güncellenir
      for (let i = 0; i < currentPoints.length; i++) {
        mesh.setMatrixAt(i, _identity);
      }
      mesh.instanceMatrix.needsUpdate = true;
      scene!.add(mesh);
      instancedMeshes.push(mesh);
    }

    console.log(`[GreenTrees] ${currentPoints.length} ağaç, ${gltfParts.length} GLTF mesh parçası`);
    mapRef?.triggerRepaint();
  }

  return {
    id: 'green-area-trees-three',
    type: 'custom' as const,
    renderingMode: '3d' as const,

    onAdd(map: maplibregl.Map, gl: WebGLRenderingContext) {
      mapRef = map;
      camera = new THREE.Camera();
      camera.matrixAutoUpdate = false;

      scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(1, -1, 2).normalize();
      scene.add(sun);

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;

      new GLTFLoader().load('/models/agac.gltf', (gltf) => {
        gltf.scene.updateWorldMatrix(true, true);
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            gltfParts.push({
              geom: child.geometry,
              mat: child.material,
              gltfWorldMatrix: child.matrixWorld.clone(),
            });
          }
        });
        modelReady = true;
        buildInstances();
      });
    },

    render(gl: WebGLRenderingContext, args: { defaultProjectionData: { mainMatrix: number[] } }) {
      if (!camera || !scene || !renderer || !modelReady || instancedMeshes.length === 0) return;

      const savedFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;

      // mainMatrix: MapLibre'nin Mercator → clip-space VP matrisi
      _mainMat.fromArray(args.defaultProjectionData.mainMatrix);

      // Her instance için: MVP = mainMatrix * (treeMercator * gltfLocal)
      // Kamera identity olarak tutulur — tüm transform instance matrix'e gömülür
      for (let pi = 0; pi < instancedMeshes.length; pi++) {
        const mesh = instancedMeshes[pi];
        const baseList = partBaseMatrices[pi];
        if (!baseList) continue;
        for (let i = 0; i < baseList.length; i++) {
          _combined.multiplyMatrices(_mainMat, baseList[i]);
          mesh.setMatrixAt(i, _combined);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }

      // Kamera tamamen identity — tüm transform instance matrix içinde
      camera.projectionMatrix.identity();
      camera.matrixWorldInverse.identity();

      renderer.resetState();
      renderer.render(scene, camera);

      // MapLibre WebGL state'ini geri yükle
      gl.bindFramebuffer(gl.FRAMEBUFFER, savedFBO);
      (gl as WebGL2RenderingContext).bindVertexArray?.(null);
    },

    onRemove() {
      renderer?.dispose();
      renderer = null;
      scene = null;
      camera = null;
    },

    setPoints(points: TreePoint[]) {
      currentPoints = points;
      buildInstances();
    },
  };
}
