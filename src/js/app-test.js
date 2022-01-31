import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  PlaneBufferGeometry,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector4,
  Mesh,
  Texture,
} from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import fragment from '/src/shaders/fragment.glsl';
import vertex from '/src/shaders/vertex.glsl';
import debugTexture from '../images/texture.jpg';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import ASScroll from '@ashthornton/asscroll';
import barba from '@barba/core';

function rToDeg(radians) {
  return (radians * 180) / Math.PI;
}
function fixDimensions({ height, distance, camera }) {
  const planeSize = height;
  const planeSize2 = planeSize / 2;

  camera.position.z = distance;

  // Returns Angle in Radians
  const fovRadian = Math.atan(planeSize2 / distance);
  // Double to calc full FOV
  camera.fov = rToDeg(fovRadian) * 2;
}

export default class Sketch {
  constructor(options) {
    this.container = options.domElement;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.time = 0;
    this.scrollOffset = 300;
    this.camera;
    this.controls;
    this.scene;
    this.mesh;
    this.renderer;
    this.geometry;
    this.material;
    this.asscroll;
    this.images;
    this.imageStore;
    this.materials;

    this.isGalleryIndex = !!document.querySelector(
      '[data-current="gallery-index"]'
    );
    this.isGalleryPage = !!document.querySelector('[data-current="gallery"]');

    // this.setupSettings();
    this.init();
    this.setupResize();
    this.barba();
    this.addObjects();
    this.addClickEvents();
    this.resize();
    this.render();
  }

  barba() {
    let that = this;
    barba.init({
      transitions: [
        {
          name: 'default-transition',
          from: {
            namespace: ['default', 'home', 'inside'],
          },
          to: {
            namespace: ['default'],
          },
          leave(data) {
            console.log('data', data);
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, {
                opacity: 0,
                onComplete: () => {
                  that.container.style.visibility = 'hidden';
                  that.animationRunning = false;
                },
              });
          },
          enter(data) {
            that.asscroll.disable();
            return gsap.timeline().to('.curtain', {
              duration: 0.3,
              y: '100%',
            });
            // .to(data.current.container, { opacity: 0 });
          },
        },
        {
          name: 'from-home-transition',
          from: {
            namespace: ['home', 'default'],
          },
          leave(data) {
            that.asscroll.disable();
            return gsap.timeline().to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            // if (!!data.next.container.querySelector('[asscroll-container]')) {
            // that.asscroll = new ASScroll({
            //   disableRaf: true,
            //   containerElement: data.next.container.querySelector(
            //     '[asscroll-container]'
            //   ),
            // })

            that.asscroll.enable({
              newScrollElements:
                data.next.container.querySelector('.scroll-wrap'),
            });
            // that.asscroll.currentPos = this.scrollOffset;
            // }
            return gsap.timeline().from(data.current.container, {
              opacity: 0,
              onComplete: () => {
                that.container.style.visibility = 'hidden';
                that.animationRunning = false;
              },
            });
          },
        },
        {
          name: 'from-inside-transition',
          from: {
            namespace: ['inside', 'default'],
          },
          leave(data) {
            that.asscroll.disable();
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });

            that.asscroll.currentPos = this.scrollOffset;
            that.asscroll.enable({
              horizontalScroll: true,
              newScrollElements:
                data.next.container.querySelector('.scroll-wrap'),
            });

            // cleaning old arrays
            that.imageStore.forEach((m) => {
              that.scene.remove(m.mesh);
            });
            that.imageStore = [];
            that.materials = [];
            that.addObjects();
            that.resize();
            that.addClickEvents();
            that.container.style.visibility = 'visible';
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: '-100%' })
              .from(data.next.container, {
                opacity: 0,
              });
          },
        },
      ],
    });
  }

  setupSettings() {
    this.settings = {
      progress: 0,
    };

    this.gui = new dat.GUI();

    this.gui.add(this.settings, 'progress', 0, 1, 0.001);
  }

  init() {
    console.log(`init`);
    this.camera = new PerspectiveCamera(30, this.width / this.height, 10, 1000);

    fixDimensions({ height: this.height, distance: 600, camera: this.camera });

    this.scene = new Scene();

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    if (this.isGalleryIndex && this.asscroll === undefined) {
      this.asscroll = new ASScroll({
        containerElement: document.querySelector('[asscroll-container]'),
        disableRaf: true,
      });
      this.asscroll.currentPos = this.scrollOffset;
      this.asscroll.enable({
        horizontalScroll: this.isGalleryIndex,
      });
    }

    this.materials = [];

    console.log('this', this);
  }

  addObjects() {
    this.geometry = new PlaneBufferGeometry(1, 1, 100, 100);

    this.material = new ShaderMaterial({
      uniforms: {
        uTime: { value: this.time },
        uProgress: { value: 0 }, //this.settings.progress },
        uTexture: { value: new TextureLoader().load(debugTexture) },
        uTextureSize: { value: new Vector2(100, 100) },
        uCorners: { value: new Vector4(0, 0, 0, 0) },
        uResolution: { value: new Vector2(this.width, this.height) },
        uQuadSize: { value: new Vector2(300, 300) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.tl = gsap
      .timeline()
      .to(this.material.uniforms.uCorners.value, {
        x: 1,
        duration: 1,
      })
      .to(
        this.material.uniforms.uCorners.value,
        {
          y: 1,
          duration: 1,
        },
        0.2
      )
      .to(
        this.material.uniforms.uCorners.value,
        {
          z: 1,
          duration: 1,
        },
        0.4
      )
      .to(
        this.material.uniforms.uCorners.value,
        {
          w: 1,
          duration: 1,
        },
        0.6
      );

    this.mesh = new Mesh(this.geometry, this.material);

    // Adding HTML Images to WebGL
    this.images = Array.from(document.querySelectorAll('.js-image'));
    this.imageStore = this.images.map((image, idx) => {
      const bounds = image.getBoundingClientRect();
      const { width, height, top, left } = bounds;

      const m = this.material.clone();
      this.materials.push(m);

      // const tex = new Texture(image);
      // tex.needsUpdate = true;
      // https://github.com/mrdoob/three.js/issues/23164

      const tex = new TextureLoader().load(image.src);
      m.uniforms.uTexture.value = tex;

      const mesh = new Mesh(this.geometry, m);
      mesh.scale.set(width, height, 1);
      this.scene.add(mesh);

      return {
        image,
        mesh,
        width,
        height,
        top,
        left,
      };
    });
  }

  addClickEvents() {
    this.imageStore.forEach((i) => {
      i.image.addEventListener('click', () => {
        let tl = gsap
          .timeline()
          .to(i.mesh.material.uniforms.uCorners.value, {
            x: 1,
            duration: 0.4,
          })
          .to(
            i.mesh.material.uniforms.uCorners.value,
            {
              y: 1,
              duration: 0.4,
            },
            0.1
          )
          .to(
            i.mesh.material.uniforms.uCorners.value,
            {
              z: 1,
              duration: 0.4,
            },
            0.2
          )
          .to(
            i.mesh.material.uniforms.uCorners.value,
            {
              w: 1,
              duration: 0.4,
            },
            0.3
          );
      });
    });
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    fixDimensions({ height: this.height, distance: 600, camera: this.camera });

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.materials.forEach((m) => {
      m.uniforms.uResolution.value.x = this.width;
      m.uniforms.uResolution.value.y = this.height;
    });

    this.imageStore.forEach((i) => {
      const bounds = i.image.getBoundingClientRect();
      i.mesh.scale.set(bounds.width, bounds.height, 1);
      i.top = bounds.top;
      i.left = bounds.left + this.asscroll.currentPos;
      i.width = bounds.width;
      i.height = bounds.height;

      i.mesh.material.uniforms.uQuadSize.value.x = bounds.width;
      i.mesh.material.uniforms.uQuadSize.value.y = bounds.height;

      i.mesh.material.uniforms.uTextureSize.value.x = bounds.width;
      i.mesh.material.uniforms.uTextureSize.value.y = bounds.height;
    });
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  setPositions() {
    this.imageStore.forEach((o) => {
      o.mesh.position.x =
        -this.asscroll.currentPos -
        this.scrollOffset +
        o.left -
        this.width / 2 +
        o.width / 2;
      o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
    });
  }

  render() {
    this.time += 0.05;
    this.material.uniforms.uTime.value = this.time;
    // this.material.uniforms.uProgress.value = this.settings.progress;
    if (this.isGalleryIndex) {
      this.asscroll.update();
    }
    this.setPositions();
    // this.tl.progress(this.settings.progress);

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }
}

// export default Sketch;

// new Sketch({
//   domElement: document.querySelector("#container"),
// });
