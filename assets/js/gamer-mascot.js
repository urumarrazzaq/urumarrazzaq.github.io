/* Gamer Theme — "Blip" the 3D mascot guide (Three.js) */
(function () {
  "use strict";

  if (typeof THREE === "undefined") return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GUIDE_MESSAGES = {
    hero: "Hey! I'm Blip \u2014 I'll show you around! \uD83D\uDC4B",
    about: "This is Umar \u2014 an Unreal Engine wizard! \u2728",
    skills: "Check out these skills \u2014 XP bars don't lie! \uD83D\uDCAA",
    resume: "Check out these skills \u2014 XP bars don't lie! \uD83D\uDCAA",
    portfolio: "My favorite part \u2014 the projects! Take a look \uD83C\uDFAE",
    services: "Need something built? Here's how I can help \uD83D\uDEE0\uFE0F",
    testimonials: "People really enjoy working with him \u2014 see for yourself \u2B50",
    contact: "Let's team up \u2014 say hi down here! \uD83D\uDCEC"
  };

  /* Each section gets its own color palette + idle behavior, so Blip
     visibly reacts as you scroll through the site. */
  var SECTION_THEMES = {
    hero: {
      body: 0x5b4de0, rim: 0xff6f91, dome: 0x8fe9ff,
      flame: 0xffb347, flameEmissive: 0xff6a2e,
      antenna: 0x8effa0, antennaEmissive: 0x3fbf5c,
      behavior: "wave"
    },
    about: {
      body: 0x8b5cf6, rim: 0xd8ccff, dome: 0xf0e9ff,
      flame: 0xb39dff, flameEmissive: 0x5b3fc4,
      antenna: 0xc9b8ff, antennaEmissive: 0x8b5cf6,
      behavior: "curious"
    },
    skills: {
      body: 0x2e6fe0, rim: 0x7fd8ff, dome: 0xbdf1ff,
      flame: 0x8fe9ff, flameEmissive: 0x2ee6ff,
      antenna: 0x9fdcff, antennaEmissive: 0x2e9dff,
      behavior: "powerup"
    },
    resume: {
      body: 0x2e6fe0, rim: 0x7fd8ff, dome: 0xbdf1ff,
      flame: 0x8fe9ff, flameEmissive: 0x2ee6ff,
      antenna: 0x9fdcff, antennaEmissive: 0x2e9dff,
      behavior: "powerup"
    },
    portfolio: {
      body: 0x3fbf5c, rim: 0xbfff5c, dome: 0xd9ffe0,
      flame: 0xdcff5c, flameEmissive: 0x8fbf2e,
      antenna: 0xbfff8f, antennaEmissive: 0x5cbf3f,
      behavior: "showcase"
    },
    services: {
      body: 0xdb6a2e, rim: 0xff4d4d, dome: 0xffd9a8,
      flame: 0xff8a4d, flameEmissive: 0xff3d2e,
      antenna: 0xffb04d, antennaEmissive: 0xff6a2e,
      behavior: "tool"
    },
    testimonials: {
      body: 0xe0508f, rim: 0xff8fc0, dome: 0xffd9ec,
      flame: 0xff8fa8, flameEmissive: 0xe0507a,
      antenna: 0xffaacf, antennaEmissive: 0xe0508f,
      behavior: "bounce"
    },
    contact: {
      body: 0x2ea9a0, rim: 0x5cd0ff, dome: 0xc8f5ff,
      flame: 0x5ce0e0, flameEmissive: 0x2ea9a0,
      antenna: 0x8ff5ff, antennaEmissive: 0x2ee6d0,
      behavior: "signal"
    }
  };

  var CLICK_MESSAGES = [
    "Beep boop! \uD83D\uDE04",
    "Systems nominal, captain! \uD83D\uDE80",
    "Scroll around, I'll keep up!",
    "Poke me again, I don't mind \uD83D\uDC9B"
  ];

  function buildWidgetDOM() {
    var wrap = document.createElement("div");
    wrap.className = "mascot-widget";
    wrap.innerHTML =
      '<div class="mascot-bubble" role="status" aria-live="polite"></div>' +
      '<canvas class="mascot-canvas" aria-hidden="true"></canvas>';
    document.body.appendChild(wrap);
    return wrap;
  }

  function initMascot() {
    var wrap = buildWidgetDOM();
    var canvas = wrap.querySelector(".mascot-canvas");
    var bubble = wrap.querySelector(".mascot-bubble");

    var size = window.innerWidth < 576 ? 84 : 116;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.15, 4.4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    var key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 3, 4);
    scene.add(key);
    var rim = new THREE.PointLight(0xff9a5a, 0.9, 6);
    rim.position.set(0, -1.2, 1.5);
    scene.add(rim);

    var ship = new THREE.Group();
    scene.add(ship);

    /* Saucer body */
    var saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.15, 0.38, 28),
      new THREE.MeshStandardMaterial({ color: 0x5b4de0, roughness: 0.4, metalness: 0.35 })
    );
    ship.add(saucer);

    var rimRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.06, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xff6f91, roughness: 0.35, metalness: 0.4 })
    );
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.02;
    ship.add(rimRing);

    /* Cockpit dome (glassy cyan) */
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.7),
      new THREE.MeshPhysicalMaterial({
        color: 0x8fe9ff,
        transparent: true,
        opacity: 0.55,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 0.6
      })
    );
    dome.position.y = 0.32;
    ship.add(dome);

    /* Googly eye peeking through the dome */
    var eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    eyeWhite.position.set(0, 0.36, 0.28);
    ship.add(eyeWhite);

    var pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x14101a, roughness: 0.3 })
    );
    pupil.position.set(0.03, 0.36, 0.46);
    ship.add(pupil);

    /* Little fins around the rim */
    var finMat = new THREE.MeshStandardMaterial({ color: 0xffb04d, roughness: 0.4, metalness: 0.3 });
    var finPositions = [
      { a: 0, r: 1.05 },
      { a: (Math.PI * 2) / 3, r: 1.05 },
      { a: (Math.PI * 4) / 3, r: 1.05 }
    ];
    finPositions.forEach(function (p) {
      var fin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), finMat);
      fin.position.set(Math.cos(p.a) * p.r, -0.08, Math.sin(p.a) * p.r);
      fin.rotation.x = Math.PI / 2;
      fin.rotation.z = p.a;
      ship.add(fin);
    });

    /* Antenna */
    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xd8d8e0 })
    );
    antenna.position.set(0, 0.72, 0);
    ship.add(antenna);
    var antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x8effa0, emissive: 0x3fbf5c, emissiveIntensity: 0.6 })
    );
    antennaTip.position.set(0, 0.94, 0);
    ship.add(antennaTip);

    /* Thruster flame */
    var flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.5, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffb347,
        emissive: 0xff6a2e,
        emissiveIntensity: 0.9,
        roughness: 0.4
      })
    );
    flame.position.y = -0.55;
    flame.rotation.x = Math.PI;
    ship.add(flame);

    ship.scale.setScalar(1.05);

    /* Material refs for smooth color transitions between section themes */
    var mats = {
      body: saucer.material,
      rim: rimRing.material,
      dome: dome.material,
      flame: flame.material,
      antenna: antennaTip.material
    };
    var targets = {
      body: new THREE.Color(0x5b4de0),
      rim: new THREE.Color(0xff6f91),
      dome: new THREE.Color(0x8fe9ff),
      flame: new THREE.Color(0xffb347),
      flameEmissive: new THREE.Color(0xff6a2e),
      antenna: new THREE.Color(0x8effa0),
      antennaEmissive: new THREE.Color(0x3fbf5c)
    };
    var currentBehavior = "wave";

    function applyTheme(themeKey) {
      var theme = SECTION_THEMES[themeKey];
      if (!theme) return;
      targets.body.setHex(theme.body);
      targets.rim.setHex(theme.rim);
      targets.dome.setHex(theme.dome);
      targets.flame.setHex(theme.flame);
      targets.flameEmissive.setHex(theme.flameEmissive);
      targets.antenna.setHex(theme.antenna);
      targets.antennaEmissive.setHex(theme.antennaEmissive);
      currentBehavior = theme.behavior;
    }

    function resize() {
      size = window.innerWidth < 576 ? 84 : 116;
      renderer.setSize(size, size);
    }
    window.addEventListener("resize", resize);

    /* Speech bubble handling */
    var bubbleTimer = null;
    function showBubble(text) {
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () {
        bubble.classList.remove("show");
      }, 4200);
    }

    applyTheme("hero");

    setTimeout(function () {
      showBubble(GUIDE_MESSAGES.hero);
    }, 1200);

    var sectionIds = Object.keys(GUIDE_MESSAGES);
    var lastSection = "hero";
    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.target.id !== lastSection && GUIDE_MESSAGES[entry.target.id]) {
              lastSection = entry.target.id;
              showBubble(GUIDE_MESSAGES[entry.target.id]);
              applyTheme(entry.target.id);
            }
          });
        },
        { threshold: 0.45 }
      );
      sections.forEach(function (s) { observer.observe(s); });
    }

    /* Click interaction: little spin + hop + a fun line */
    var spinT = 0;
    var spinning = false;
    var hopT = 0;
    var hopping = false;
    canvas.addEventListener("click", function () {
      spinning = true;
      spinT = 0;
      hopping = true;
      hopT = 0;
      var msg = CLICK_MESSAGES[Math.floor(Math.random() * CLICK_MESSAGES.length)];
      showBubble(msg);
    });

    /* Animation loop */
    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var dt = clock.getDelta();
      var t = clock.elapsedTime;

      /* Smoothly ease every material toward the active section's palette */
      var lerpAmt = Math.min(dt * 2.2, 1);
      mats.body.color.lerp(targets.body, lerpAmt);
      mats.rim.color.lerp(targets.rim, lerpAmt);
      mats.dome.color.lerp(targets.dome, lerpAmt);
      mats.flame.color.lerp(targets.flame, lerpAmt);
      mats.flame.emissive.lerp(targets.flameEmissive, lerpAmt);
      mats.antenna.color.lerp(targets.antenna, lerpAmt);
      mats.antenna.emissive.lerp(targets.antennaEmissive, lerpAmt);

      if (!reducedMotion) {
        /* Base idle drift, then each behavior adds its own personality on top */
        var posY = Math.sin(t * 1.6) * 0.08;
        var rotY = Math.sin(t * 0.6) * 0.28;
        var rotZ = Math.sin(t * 0.9) * 0.05;
        var rotX = 0;
        var flameScale = 1 + Math.sin(t * 12) * 0.25 + Math.random() * 0.05;
        var pupilX = 0.03 + Math.sin(t * 0.4) * 0.06;
        var antIntensity = 0.6;

        switch (currentBehavior) {
          case "curious": // about — slow inquisitive tilt, looking side to side
            rotZ = Math.sin(t * 0.7) * 0.16;
            rotY = Math.sin(t * 0.45) * 0.4;
            posY = Math.sin(t * 1.1) * 0.06;
            break;
          case "powerup": // skills — energetic bursts of spin, revving flame
            rotY += Math.sin(t * 2.4) * 0.12;
            flameScale = 1 + Math.abs(Math.sin(t * 9)) * 0.6;
            antIntensity = 1 + Math.abs(Math.sin(t * 6)) * 0.8;
            posY = Math.sin(t * 2.2) * 0.05;
            break;
          case "showcase": // portfolio — slow continuous barrel roll, proud pose
            rotX = (t * 0.6) % (Math.PI * 2);
            rotY = Math.sin(t * 0.5) * 0.15;
            posY = Math.sin(t * 1.2) * 0.1;
            break;
          case "tool": // services — mechanical nodding, like getting to work
            rotZ = Math.sin(t * 3.2) * 0.09;
            rotX = Math.sin(t * 3.2) * 0.06;
            posY = Math.abs(Math.sin(t * 3.2)) * 0.05;
            break;
          case "bounce": // testimonials — happy, excitable bouncing
            posY = Math.abs(Math.sin(t * 3.4)) * 0.22 - 0.05;
            rotZ = Math.sin(t * 3.4) * 0.1;
            break;
          case "signal": // contact — calm hover, pulsing antenna like it's listening
            posY = Math.sin(t * 1.0) * 0.05;
            rotY = Math.sin(t * 0.35) * 0.2;
            antIntensity = 1.2 + Math.sin(t * 3) * 0.9;
            break;
          case "wave": // hero — default friendly greeting bob
          default:
            break;
        }

        ship.position.y = posY;
        ship.rotation.y = rotY;
        ship.rotation.z = rotZ;
        ship.rotation.x = rotX;
        flame.scale.y = flameScale;
        pupil.position.x = pupilX;
        mats.antenna.emissiveIntensity = antIntensity;

        if (spinning) {
          spinT += dt;
          ship.rotation.y += dt * 10 * Math.max(0, 1 - spinT / 0.6);
          if (spinT > 0.6) spinning = false;
        }
        if (hopping) {
          hopT += dt;
          var progress = Math.min(hopT / 0.5, 1);
          ship.position.y += Math.sin(progress * Math.PI) * 0.3;
          if (hopT > 0.5) hopping = false;
        }
      }

      renderer.render(scene, camera);
    }
    animate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMascot);
  } else {
    initMascot();
  }
})();
