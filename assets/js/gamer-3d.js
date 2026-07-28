/* Gamer Theme — 3D layer (Three.js hero core + tilt cards) */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  var isNarrow = window.innerWidth < 768;

  /* =========================================================
     1. HERO 3D CORE (Three.js)
  ========================================================= */
  function initHero3D() {
    var heroSection = document.getElementById("hero");
    if (!heroSection || typeof THREE === "undefined") return;
    if (reducedMotion) return; // respect reduced motion — skip the animated scene

    var canvas = document.createElement("canvas");
    canvas.className = "gamer-3d-canvas";
    canvas.setAttribute("aria-hidden", "true");

    var bgEl = heroSection.querySelector(".background-elements");
    if (bgEl && bgEl.parentNode) {
      bgEl.parentNode.insertBefore(canvas, bgEl.nextSibling);
    } else {
      heroSection.insertBefore(canvas, heroSection.firstChild);
    }

    var width = heroSection.clientWidth;
    var height = heroSection.clientHeight;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isNarrow ? 1.5 : 2));
    renderer.setSize(width, height);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    var rootGroup = new THREE.Group();
    // Position the core toward the visual (right) side on wide screens, centered on narrow
    rootGroup.position.x = width > 992 ? 2.4 : 0;
    scene.add(rootGroup);

    var neonGreen = 0x8b5cf6;  // electric violet
    var neonCyan = 0x22e5ff;   // cyan
    var neonPurple = 0x5b3fc4; // deep violet

    /* --- Core: nested wireframe icosahedra --- */
    var coreOuter = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.7, 0)),
      new THREE.LineBasicMaterial({ color: neonGreen, transparent: true, opacity: 0.85 })
    );
    rootGroup.add(coreOuter);

    var coreInner = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, 0)),
      new THREE.LineBasicMaterial({ color: neonCyan, transparent: true, opacity: 0.7 })
    );
    rootGroup.add(coreInner);

    var coreGlow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.65, 1),
      new THREE.MeshBasicMaterial({ color: neonGreen, transparent: true, opacity: 0.12 })
    );
    rootGroup.add(coreGlow);

    /* --- Orbiting loot shapes --- */
    var orbiters = [];
    var orbiterGeos = [
      new THREE.OctahedronGeometry(0.22),
      new THREE.TetrahedronGeometry(0.22),
      new THREE.BoxGeometry(0.28, 0.28, 0.28)
    ];
    var orbiterColors = [neonCyan, neonPurple, neonGreen];
    var orbiterCount = isNarrow ? 3 : 6;
    for (var i = 0; i < orbiterCount; i++) {
      var geo = orbiterGeos[i % orbiterGeos.length];
      var mat = new THREE.MeshBasicMaterial({
        color: orbiterColors[i % orbiterColors.length],
        wireframe: true,
        transparent: true,
        opacity: 0.9
      });
      var mesh = new THREE.Mesh(geo, mat);
      var radius = 2.6 + (i % 3) * 0.45;
      var speed = 0.25 + Math.random() * 0.3;
      var offset = Math.random() * Math.PI * 2;
      var tilt = (Math.random() - 0.5) * 1.4;
      orbiters.push({ mesh: mesh, radius: radius, speed: speed, offset: offset, tilt: tilt });
      rootGroup.add(mesh);
    }

    /* --- Particle field (data motes) --- */
    var particleCount = isNarrow ? 60 : 160;
    var positions = new Float32Array(particleCount * 3);
    for (var p = 0; p < particleCount; p++) {
      var r = 3.2 + Math.random() * 3.5;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(Math.random() * 2 - 1);
      positions[p * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[p * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[p * 3 + 2] = r * Math.cos(phi);
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var particleMat = new THREE.PointsMaterial({
      color: neonCyan,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true
    });
    var particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    /* --- Parallax on pointer move --- */
    var targetRotX = 0;
    var targetRotY = 0;
    if (!isCoarsePointer) {
      heroSection.addEventListener("mousemove", function (e) {
        var rect = heroSection.getBoundingClientRect();
        var nx = (e.clientX - rect.left) / rect.width - 0.5;
        var ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotY = nx * 0.5;
        targetRotX = ny * 0.35;
      });
    }

    /* --- Resize handling --- */
    window.addEventListener("resize", function () {
      width = heroSection.clientWidth;
      height = heroSection.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      rootGroup.position.x = width > 992 ? 2.4 : 0;
    });

    /* --- Animation loop --- */
    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      coreOuter.rotation.y = t * 0.22;
      coreOuter.rotation.x = t * 0.12;
      coreInner.rotation.y = -t * 0.3;
      coreInner.rotation.x = -t * 0.18;
      coreGlow.rotation.y = t * 0.15;
      coreGlow.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08);

      orbiters.forEach(function (o) {
        var angle = t * o.speed + o.offset;
        o.mesh.position.set(
          Math.cos(angle) * o.radius,
          Math.sin(angle) * o.radius * 0.4 + Math.sin(t + o.offset) * 0.2,
          Math.sin(angle) * o.radius * o.tilt
        );
        o.mesh.rotation.x += 0.02;
        o.mesh.rotation.y += 0.03;
      });

      particles.rotation.y = t * 0.03;

      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.04;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.04;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* =========================================================
     2. 3D TILT CARDS (vanilla JS, CSS transforms)
  ========================================================= */
  function initTiltCards() {
    if (isCoarsePointer || reducedMotion) return;

    var selectors = [
      ".portfolio-wrap",
      ".about .profile-card",
      ".testimonials .testimonial-content",
      ".stat-item",
      ".skills-category"
    ];
    var cards = document.querySelectorAll(selectors.join(","));

    cards.forEach(function (card) {
      card.classList.add("tilt-card");

      var bounds;

      function onEnter() {
        bounds = card.getBoundingClientRect();
        card.classList.add("tilt-active");
      }

      function onMove(e) {
        if (!bounds) bounds = card.getBoundingClientRect();
        var px = (e.clientX - bounds.left) / bounds.width;
        var py = (e.clientY - bounds.top) / bounds.height;
        var rotateY = (px - 0.5) * 10;
        var rotateX = (0.5 - py) * 10;
        card.style.transform =
          "perspective(900px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateZ(6px)";
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      }

      function onLeave() {
        card.classList.remove("tilt-active");
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
      }

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHero3D();
    initTiltCards();
  });
})();
