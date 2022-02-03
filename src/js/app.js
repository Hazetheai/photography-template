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
    this.camera;
    this.controls;
    this.scene;
    this.mesh;
    this.renderer;
    this.geometry;
    this.material;
    this.asscroll;
    this.asscrollRAF;
    this.images;
    this.imageStore;
    this.materials;

    this.isGalleryIndex = !!document.querySelector(
      '[data-current="gallery-index"]'
    );
    this.isGalleryPage = !!document.querySelector(
      '[data-current="gallery-item"]'
    );

    // this.setupSettings();
    this.init();
    this.setupResize();
    this.barba();
    this.addObjects();
    this.addClickEvents();
    this.resize();
    this.render();
  }

  setupSettings() {
    this.settings = {
      progress: 0,
    };

    this.gui = new dat.GUI();

    this.gui.add(this.settings, 'progress', 0, 1, 0.001);
  }

  init() {
    this.camera = new PerspectiveCamera(30, this.width / this.height, 10, 1000);

    fixDimensions({ height: this.height, distance: 600, camera: this.camera });

    this.scene = new Scene();

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.asscroll = new ASScroll({
      containerElement: document.querySelector('[asscroll-container]'),
      disableRaf: true,
    });

    this.asscroll.enable({
      horizontalScroll: this.isGalleryIndex,
    });

    this.materials = [];
    console.log('this.asscroll', this.asscroll);
    console.log('init', this);
  }

  barba() {
    let that = this;
    const log = true;
    barba.init({
      transitions: [
        // name: 'default-to-default',
        {
          name: 'default-to-default',
          from: {
            namespace: 'default',
          },
          to: {
            namespace: 'default',
          },
          leave(data) {
            that.asscroll.disable();
            log && console.log('default-to-default-leave', data);
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, {
                opacity: 0,
              });
          },
          enter(data) {
            log && console.log('default-to-default-enter', data);
            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });

            that.asscroll.enable({
              newScrollElements:
                data.next.container.querySelector('.scroll-wrap'),
            });

            return gsap.timeline().to('.curtain', {
              duration: 0.3,
              y: '100%',
            });
          },
        },
        // name: 'default-to-home',
        {
          name: 'default-to-home',
          from: {
            namespace: 'default',
          },
          to: {
            namespace: 'home',
          },
          leave(data) {
            log && console.log('default-to-home-leave', data);
            that.asscroll.disable();
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            log && console.log('default-to-home-enter', data);
            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });
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
            // Re-init Scene
            that.addObjects();
            that.resize();
            that.addClickEvents();
            that.container.style.visibility = 'visible';
            that.animationRunning = true;
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: '-100%' })
              .from(data.next.container, {
                opacity: 0,
              });
          },
        },
        // name: 'home-to-default',
        {
          name: 'home-to-default',
          from: {
            namespace: 'home',
          },
          to: { namespace: 'default' },
          leave(data) {
            log && console.log('home-to-default-leave', data);
            that.asscroll.disable();
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
            log && console.log('home-to-default-enter', data);
            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });

            that.asscroll.enable({
              newScrollElements:
                data.next.container.querySelector('.scroll-wrap'),
            });

            return gsap.timeline().to('.curtain', {
              duration: 0.3,
              y: '100%',
            });
          },
        },
        // name: 'home-to-inside',
        {
          name: 'home-to-inside',
          from: {
            namespace: 'home',
          },
          to: { namespace: 'inside' },
          leave(data) {
            log && console.log('home-to-inside-leave', data);
            that.asscroll.disable();
            return gsap.timeline().to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            log && console.log('home-to-inside-enter', data);
            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });

            that.asscroll.enable({
              newScrollElements:
                data.next.container.querySelector('.scroll-wrap'),
            });
            return gsap.timeline().from(data.current.container, {
              opacity: 0,
              onComplete: () => {
                that.container.style.visibility = 'hidden';
                that.animationRunning = false;
              },
            });
          },
        },
        // name: 'inside-to-home',
        {
          name: 'inside-to-home',
          from: {
            namespace: 'inside',
          },
          to: {
            namespace: 'home',
          },
          leave(data) {
            log && console.log('inside-to-home-leave', data);
            that.asscroll.disable();
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            log && console.log('inside-to-home-enter', data);
            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });

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
        // name: 'inside-to-default',
        {
          name: 'inside-to-default',
          from: {
            namespace: 'inside',
          },
          to: {
            namespace: 'default',
          },
          leave(data) {
            log && console.log('inside-to-default-leave', data);
            that.asscroll.disable();
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            log && console.log('inside-to-default-enter', data);

            that.asscroll = new ASScroll({
              disableRaf: true,
              containerElement: data.next.container.querySelector(
                '[asscroll-container]'
              ),
            });

            that.asscroll.enable({
              newScrollElements:
                data.next.container.querySelector('.scroll-wrap'),
            });
            // cleaning old arrays
            that.imageStore.forEach((m) => {
              that.scene.remove(m.mesh);
            });
            that.imageStore = [];
            that.materials = [];
            // Disable THREE
            that.container.style.visibility = 'hidden';
            that.animationRunning = false;
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
        -this.asscroll.currentPos + o.left - this.width / 2 + o.width / 2;
      o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
    });
  }

  render() {
    this.time += 0.05;
    if (this.time % 2 === 0) console.log('running');
    this.material.uniforms.uTime.value = this.time;
    // this.material.uniforms.uProgress.value = this.settings.progress;

    this.asscroll.update();

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
