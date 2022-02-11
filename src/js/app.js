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
} from 'three';
import fragment from '/src/shaders/fragment.glsl';
import vertex from '/src/shaders/vertex.glsl';
import debugTexture from '../images/texture.jpg';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import ASScroll from '@ashthornton/asscroll';
import barba from '@barba/core';
// import ScrollTrigger from 'gsap/ScrollTrigger';

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
    this.scrollOffset = window.innerWidth * 0.85;

    // this.setupSettings();
    this.init();
    this.setupResize();
    this.barba();
    this.addObjects();
    // this.homeObserver();
    this.addClickEvents();
    this.resize();
    this.render();
  }

  isGalleryIndex() {
    return !!document.querySelector('[data-current="gallery-index"]');
  }
  isGalleryPage() {
    return !!document.querySelector('[data-current="gallery-item"]');
  }

  galleryObserver() {
    if ('IntersectionObserver' in window) {
      console.log('Your browser supports IntersectionObserver');

      const options = {
        threshold: 0.7,
      };

      const targets = document.querySelectorAll('.gallery-item');

      const lazyLoad = (target) => {
        const io = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              console.log(img);
              img.classList.add('fade');
              observer.disconnect();
            }
          });
        }, options);

        io.observe(target);
      };
      targets.forEach(lazyLoad);
    } else {
      console.log('Your browser does not support IntersectionObserver');
    }
  }
  // homeObserver() {
  //   // TODO Full Brightness when at center point

  //   if ('IntersectionObserver' in window) {
  //     console.log('Your browser supports IntersectionObserver');

  //     const options = {
  //       root: null,
  //       threshold: 0.7,
  //     };

  //     // const targets = this.imageStore.map((i) => i.image);
  //     const centerPoint = window.innerWidth / 2;
  //     const lazyLoad = (target) => {
  //       const io = new IntersectionObserver((entries, observer) => {
  //         entries.forEach((entry, idx) => {
  //           console.log('entry', entry);
  //           if (entry.isIntersecting) {
  //             gsap
  //               .timeline()
  //               .to(
  //                 this.imageStore[idx].mesh.material.uniforms.uHovered.value,
  //                 { x: 1, duration: 0.6 }
  //               );
  //             const img = entry.target;
  //             // console.log(img);
  //             // img.classList.add('fade');
  //             // observer.disconnect();
  //           }
  //         });
  //       }, options);

  //       io.observe(target.image);
  //     };
  //     this.imageStore.forEach(lazyLoad);
  //   } else {
  //     console.log('Your browser does not support IntersectionObserver');
  //   }
  // }

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

    this.asscroll = new ASScroll({
      containerElement: document.querySelector('[asscroll-container]'),
      disableRaf: true,
    });

    this.asscroll.enable({
      horizontalScroll: this.isGalleryIndex(),
    });

    // if (isGalleryIndex()) {
    this.asscroll.currentPos = this.scrollOffset;
    // }

    this.materials = [];
    console.log('this.asscroll', this.asscroll);
    console.log('init', this);
  }

  barba() {
    let that = this;
    const log = true;
    barba.init({
      transitions: [
        // name: 'default-transition'
        {
          //   name: 'self',
          //   enter(data) {
          //     console.log('self');
          //     // create your self transition here
          //     that.asscroll = new ASScroll({
          //       disableRaf: true,
          //       containerElement: data.next.container.querySelector(
          //         '[asscroll-container]'
          //       ),
          //     });
          //     that.asscroll.enable({
          //       horizontalScroll: that.isGalleryIndex(),
          //       newScrollElements:
          //         data.next.container.querySelector('.scroll-wrap'),
          //     });
          //     return gsap
          //       .timeline()
          //       .to('.curtain', { duration: 0.3, y: '100%' })
          //       .to('.curtain', { duration: 0.3, y: '-100%' })
          //       .from(data.next.container, {
          //         opacity: 0,
          //       });
          //   },
        },
        // name: 'default-transition'
        {
          name: 'default-transition',
          leave(data) {
            log && console.log('default-leave', data);
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            log && console.log('default-enter', data);

            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: '-100%' })
              .from(data.next.container, {
                opacity: 0,
              });
          },
        },
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

            that.asscroll.currentPos = that.scrollOffset;

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
            return gsap
              .timeline()
              .to(data.current.container, { opacity: 0 })
              .to(document.querySelector('.content'), { opacity: 0 });
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

            if (that.isGalleryPage()) {
              that.parallax();
            }
            that.galleryObserver();
            //  BUG Momentary flash of black screen on *some* transitions (items 3, 7, 9)
            // Only happens on fresh page
            // Shows GLSL squares for a split second
            return gsap.timeline().from(data.current.container, {
              opacity: 0,
              onStart: () => {
                console.log(`beans`);
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

            that.asscroll.currentPos = that.scrollOffset;

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
        // name: 'inside-to-inside',
        {
          name: 'inside-to-inside',
          from: {
            namespace: 'inside',
          },
          to: {
            namespace: 'inside',
          },
          leave(data) {
            return gsap
              .timeline()
              .to('.curtain', { duration: 0.3, y: 0 })
              .to(data.current.container, { opacity: 0 });
          },
          enter(data) {
            log && console.log('inside-to-inside-enter', data);
            that.galleryObserver();
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
        uHovered: { value: new Vector2(0.3, 0) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.mesh = new Mesh(this.geometry, this.material);

    // Adding HTML Images to WebGL
    this.images = Array.from(document.querySelectorAll('.js-image'));
    this.imageStore = this.images.map((image, idx, arr) => {
      const bounds = image.getBoundingClientRect();
      const { width, height, top, left } = bounds;

      const m = this.material.clone();
      this.materials.push(m);

      // const tex = new Texture(image);
      // tex.needsUpdate = true;
      // https://github.com/mrdoob/three.js/issues/23164

      const tex = new TextureLoader().load(image.src);
      m.uniforms.uTexture.value = tex;

      // midpoint

      // const isEven = arr.length % 2 === 0;
      // const midpoint = isEven ? arr.length / 2 : Math.ceil(arr.length / 2);
      // m.uniforms.uHovered.value =
      //   idx + 2 == midpoint ? new Vector2(1, 1) : new Vector2(0, 0);

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
    const options = {
      root: null,
      threshold: 1,
    };
    this.imageStore.forEach((i) => {
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            i.isIntersecting = true;
            gsap.timeline().to(i.mesh.material.uniforms.uHovered.value, {
              x: 1,
              duration: 0.6,
            });
            // observer.disconnect();
          } else {
            i.isIntersecting = false;
            gsap.timeline().to(i.mesh.material.uniforms.uHovered.value, {
              x: 0.3,
              duration: 0.6,
            });
          }
        });
      }, options);

      io.observe(i.image);
      function highlight(e, inView) {
        if (inView) return;
        gsap
          .timeline()
          .to(i.mesh.material.uniforms.uHovered.value, { x: 1, duration: 0.3 });
      }
      function lowlight(e, inView) {
        if (inView) return;
        gsap.timeline().to(i.mesh.material.uniforms.uHovered.value, {
          x: 0.3,
          duration: 0.3,
        });
      }
      i.image.addEventListener('mouseenter', (e) =>
        highlight(e, i.isIntersecting)
      );
      i.image.addEventListener('mouseleave', (e) =>
        lowlight(e, i.isIntersecting)
      );

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

  parallax() {
    console.log(`parallax`);
    // https://codepen.io/ashthornton/pen/VwpWoeN/874833fdebc032bedd0cf61e9eac3ee9?editors=0010
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
    if (this.time % 2 === 0) console.log('running');
    this.material.uniforms.uTime.value = this.time;
    // this.material.uniforms.uProgress.value = this.settings.progress;

    this.asscroll.update();
    // console.log('this.asscroll.currentPos', this.asscroll.currentPos);
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
