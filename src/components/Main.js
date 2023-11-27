/**
 * The above code is a React component that sets up a 3D scene using the Three.js library and manages
 * windows within the scene.
 * @returns The Main component is returning a div element with the id "scene".
 */
import React, { useEffect } from "react";
import * as THREE from "three";
import WindowManager from "./WindowManager";

const Main = () => {
  const t = THREE;
  let camera, scene, renderer, world;
  let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
  let spheres = [];
  let sceneOffsetTarget = { x: 0, y: 0 };
  let sceneOffset = { x: 0, y: 0 };

  let today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);
  today = today.getTime();

  let windowManager;
  let initialized = false;

  /**
   * The getTime function returns the current time in seconds since a specific date.
   * @returns the current time in seconds since a specific reference point (represented by the variable
   * "today").
   */
  function getTime() {
    return (new Date().getTime() - today) / 1000.0;
  }

  if (new URLSearchParams(window.location.search).get("clear")) {
    localStorage.clear();
  } else {
    // this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "hidden" && !initialized) {
        init();
      }
    });

    window.onload = () => {
      if (document.visibilityState !== "hidden") {
        init();
      }
    };

    function init() {
      initialized = true;

      // add a short timeout because window.offsetX reports wrong values before a short period
      setTimeout(() => {
        setupScene();
        setupWindowManager();
        resize();
        updateWindowShape(false);
        render();
        window.addEventListener("resize", resize);
      }, 500);
    }

    /**
     * The function sets up a scene in JavaScript for rendering using Three.js, including creating a
     * camera, scene, renderer, and adding them to the document.
     */
    function setupScene() {
      camera = new t.OrthographicCamera(
        0,
        0,
        window.innerWidth,
        window.innerHeight,
        -10000,
        10000
      );

      camera.position.z = 2.5;

      scene = new t.Scene();
      scene.background = new t.Color(0.0);
      scene.add(camera);

      renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
      renderer.setPixelRatio(pixR);

      world = new t.Object3D();
      scene.add(world);

      renderer.domElement.setAttribute("id", "scene");
      document.body.appendChild(renderer.domElement);
    }

    /**
     * The function `setupWindowManager` initializes a window manager, sets callbacks for window shape
     * changes and window updates, adds custom metadata to each window, and updates the windows
     * initially.
     */
    function setupWindowManager() {
      windowManager = new WindowManager();
      windowManager.setWinShapeChangeCallback(updateWindowShape);
      windowManager.setWinChangeCallback(windowsUpdated);

      // here you can add your custom metadata to each windows instance
      let metaData = { ritik: "coding" };

      // this will init the windowmanager and add this window to the centralised pool of windows
      windowManager.init(metaData);

      // call update windows initially (it will later be called by the win change callback)
      windowsUpdated();
    }

    /**
     * The function "windowsUpdated" calls another function called "updateNumberOfSpheres".
     */
    function windowsUpdated() {
      updateNumberOfSpheres();
    }

    /**
     * The function updates the number of spheres in a 3D world based on the current window setup.
     */
    function updateNumberOfSpheres() {
      let wins = windowManager.getWindows();

      // remove all spheres
      spheres.forEach((c) => {
        world.remove(c);
      });

      spheres = [];

      // add new spheres based on the current window setup
      for (let i = 0; i < wins.length; i++) {
        let win = wins[i];

        let c = new t.Color();
        c.setHSL(i * 0.4, 1.0, 0.5);

        let s = 100 + i * 100;
        let sphere = new t.Mesh(
          new t.SphereGeometry(s / 2, 8, 8),
          new t.MeshBasicMaterial({ color: c, wireframe: true })
        );
        sphere.position.x = win.shape.x + win.shape.w * 0.5;
        sphere.position.y = win.shape.y + win.shape.h * 0.5;

        world.add(sphere);
        spheres.push(sphere);
      }
    }

    /**
     * The function updates the window shape by storing the offset and updating it against a target
     * offset.
     * @param [easing=true] - The `easing` parameter is a boolean value that determines whether or not
     * to use easing when updating the window shape. If `easing` is set to `true`, the window shape will
     * be updated with easing. If `easing` is set to `false`, the window shape will be
     */
    function updateWindowShape(easing = true) {
      // storing the actual offset in a proxy that we update against in the render function
      sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
      if (!easing) sceneOffset = sceneOffsetTarget;
    }

    /* The `render()` function is responsible for updating the positions and rotations of the spheres in
    the 3D scene based on the current window positions. */
    function render() {
      let t = getTime();

      windowManager.update();

      // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
      let falloff = 0.05;
      sceneOffset.x =
        sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
      sceneOffset.y =
        sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

      // set the world position to the offset
      world.position.x = sceneOffset.x;
      world.position.y = sceneOffset.y;

      let wins = windowManager.getWindows();

      // loop through all our spheres and update their positions based on current window positions
      for (let i = 0; i < spheres.length; i++) {
        let sphere = spheres[i];
        let win = wins[i];
        let _t = t; // + i * .2;

        let posTarget = {
          x: win.shape.x + win.shape.w * 0.5,
          y: win.shape.y + win.shape.h * 0.5,
        };

        sphere.position.x =
          sphere.position.x + (posTarget.x - sphere.position.x) * falloff;
        sphere.position.y =
          sphere.position.y + (posTarget.y - sphere.position.y) * falloff;
        sphere.rotation.x = _t * 0.5;
        sphere.rotation.y = _t * 0.3;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    // resize the renderer to fit the window size
    /**
     * The resize function adjusts the camera and renderer size based on the window's inner width and
     * height.
     */
    function resize() {
      let width = window.innerWidth;
      let height = window.innerHeight;

      camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }

  useEffect(() => {
    // Initialization code
    return () => {
      // Cleanup code
    };
  }, []);

  return <div id="scene" />;
};

export default Main;
