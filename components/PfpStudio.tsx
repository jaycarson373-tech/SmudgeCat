"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Option = {
  id: string;
  label: string;
};

const BASES: Option[] = [
  { id: "studio", label: "Studio Timon" },
  { id: "comic", label: "Comic Timon" },
  { id: "pixel", label: "Pixel Timon" },
  { id: "clay", label: "Clay Timon" },
];

const BACKDROPS: Option[] = [
  { id: "white", label: "Clean white" },
  { id: "cream", label: "Warm sand" },
  { id: "lime", label: "Timon yellow" },
  { id: "purple", label: "Sunset orange" },
  { id: "coral", label: "Savanna rust" },
  { id: "checker", label: "Checkerboard" },
  { id: "gradient", label: "Golden hour" },
];

const HATS: Option[] = [
  { id: "none", label: "No hat" },
  { id: "yellow", label: "Timon's yellow hat" },
  { id: "crown", label: "Lookout king" },
  { id: "party", label: "Party hat" },
  { id: "cowboy", label: "Cowboy" },
  { id: "halo", label: "Angel halo" },
  { id: "cap", label: "Timeline cap" },
];

const EYEWEAR: Option[] = [
  { id: "none", label: "No eyewear" },
  { id: "sunnies", label: "Iconic black shades" },
  { id: "hearts", label: "Heart eyes" },
  { id: "sport", label: "Speed shades" },
];

const NECKWEAR: Option[] = [
  { id: "none", label: "No neckwear" },
  { id: "bow", label: "Bow tie" },
  { id: "tie", label: "Power tie" },
  { id: "bandana", label: "Bandana" },
  { id: "pearls", label: "Pearls" },
];

const FRAMES: Option[] = [
  { id: "clean", label: "Clean" },
  { id: "ring", label: "Timon ring" },
  { id: "stamp", label: "Lookout stamp" },
];

const palette = {
  ink: "#17130c",
  cream: "#fff6dc",
  lime: "#ffd323",
  orange: "#f38b12",
  violet: "#c86413",
  pink: "#f7ddb0",
};

function drawBackdrop(
  context: CanvasRenderingContext2D,
  backdrop: string,
) {
  if (backdrop === "checker") {
    const size = 128;
    for (let y = 0; y < 1024; y += size) {
      for (let x = 0; x < 1024; x += size) {
        context.fillStyle =
          (x / size + y / size) % 2 === 0 ? palette.cream : palette.violet;
        context.fillRect(x, y, size, size);
      }
    }
    return;
  }

  if (backdrop === "gradient") {
    const gradient = context.createLinearGradient(70, 40, 950, 970);
    gradient.addColorStop(0, palette.violet);
    gradient.addColorStop(0.5, palette.orange);
    gradient.addColorStop(1, palette.lime);
    context.fillStyle = gradient;
  } else {
    context.fillStyle =
      {
        white: "#ffffff",
        cream: palette.cream,
        lime: palette.lime,
        purple: palette.violet,
        coral: palette.orange,
      }[backdrop] ?? "#ffffff";
  }

  context.fillRect(0, 0, 1024, 1024);
}

function strokeShape(context: CanvasRenderingContext2D) {
  context.strokeStyle = palette.ink;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = 15;
  context.stroke();
}

function drawHat(context: CanvasRenderingContext2D, hat: string) {
  if (hat === "yellow") {
    context.fillStyle = palette.lime;
    context.beginPath();
    context.ellipse(512, 242, 290, 70, -0.02, 0, Math.PI * 2);
    context.fill();
    strokeShape(context);
    context.beginPath();
    context.moveTo(350, 218);
    context.quadraticCurveTo(368, 60, 512, 58);
    context.quadraticCurveTo(662, 63, 677, 219);
    context.quadraticCurveTo(512, 260, 350, 218);
    context.closePath();
    context.fill();
    strokeShape(context);
    context.strokeStyle = palette.orange;
    context.lineWidth = 20;
    context.beginPath();
    context.moveTo(365, 202);
    context.quadraticCurveTo(512, 237, 665, 202);
    context.stroke();
  }

  if (hat === "crown") {
    context.beginPath();
    context.moveTo(306, 276);
    context.lineTo(280, 92);
    context.lineTo(414, 190);
    context.lineTo(512, 58);
    context.lineTo(612, 190);
    context.lineTo(746, 92);
    context.lineTo(716, 276);
    context.closePath();
    context.fillStyle = palette.lime;
    context.fill();
    strokeShape(context);
    context.fillStyle = palette.orange;
    [376, 512, 648].forEach((x, index) => {
      context.beginPath();
      context.arc(x, 224 - (index % 2) * 13, 17, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
  }

  if (hat === "party") {
    context.beginPath();
    context.moveTo(348, 282);
    context.lineTo(525, 35);
    context.lineTo(674, 290);
    context.closePath();
    context.fillStyle = palette.orange;
    context.fill();
    strokeShape(context);
    context.strokeStyle = palette.cream;
    context.lineWidth = 28;
    context.beginPath();
    context.moveTo(441, 169);
    context.lineTo(590, 152);
    context.stroke();
    context.fillStyle = palette.lime;
    context.beginPath();
    context.arc(525, 41, 35, 0, Math.PI * 2);
    context.fill();
    strokeShape(context);
  }

  if (hat === "cowboy") {
    context.fillStyle = "#b67542";
    context.beginPath();
    context.moveTo(344, 215);
    context.bezierCurveTo(354, 73, 436, 42, 512, 82);
    context.bezierCurveTo(592, 38, 680, 78, 688, 218);
    context.bezierCurveTo(597, 259, 425, 257, 344, 215);
    context.closePath();
    context.fill();
    strokeShape(context);
    context.fillStyle = "#cf8c50";
    context.beginPath();
    context.ellipse(512, 250, 310, 70, 0, 0, Math.PI * 2);
    context.fill();
    strokeShape(context);
    context.strokeStyle = palette.violet;
    context.lineWidth = 22;
    context.beginPath();
    context.moveTo(365, 206);
    context.quadraticCurveTo(512, 245, 663, 205);
    context.stroke();
  }

  if (hat === "halo") {
    context.strokeStyle = "#ffd92f";
    context.lineWidth = 30;
    context.beginPath();
    context.ellipse(512, 117, 226, 58, 0, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "#fff4a0";
    context.lineWidth = 9;
    context.stroke();
  }

  if (hat === "cap") {
    context.fillStyle = palette.violet;
    context.beginPath();
    context.moveTo(326, 229);
    context.quadraticCurveTo(354, 70, 520, 58);
    context.quadraticCurveTo(682, 84, 704, 246);
    context.quadraticCurveTo(502, 281, 326, 229);
    context.closePath();
    context.fill();
    strokeShape(context);
    context.fillStyle = palette.lime;
    context.beginPath();
    context.moveTo(509, 242);
    context.quadraticCurveTo(752, 212, 834, 304);
    context.quadraticCurveTo(671, 326, 499, 281);
    context.closePath();
    context.fill();
    strokeShape(context);
  }
}

function drawEyewear(context: CanvasRenderingContext2D, eyewear: string) {
  if (eyewear === "sunnies") {
    context.fillStyle = "#111111";
    context.strokeStyle = palette.ink;
    context.lineWidth = 18;
    context.beginPath();
    context.roundRect(250, 378, 226, 150, 68);
    context.roundRect(548, 378, 226, 150, 68);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(468, 423);
    context.quadraticCurveTo(512, 395, 556, 423);
    context.stroke();
    context.strokeStyle = "rgba(255,255,255,0.7)";
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(295, 412);
    context.lineTo(345, 395);
    context.moveTo(592, 412);
    context.lineTo(642, 395);
    context.stroke();
  }

  if (eyewear === "hearts") {
    context.fillStyle = "#ff5b87";
    context.strokeStyle = palette.ink;
    context.lineWidth = 14;
    [366, 658].forEach((x) => {
      context.beginPath();
      context.moveTo(x, 520);
      context.bezierCurveTo(x - 115, 445, x - 95, 350, x, 403);
      context.bezierCurveTo(x + 95, 350, x + 115, 445, x, 520);
      context.fill();
      context.stroke();
    });
    context.beginPath();
    context.moveTo(456, 421);
    context.quadraticCurveTo(512, 395, 568, 421);
    context.stroke();
  }

  if (eyewear === "sport") {
    const lens = context.createLinearGradient(270, 380, 750, 520);
    lens.addColorStop(0, palette.lime);
    lens.addColorStop(0.5, palette.orange);
    lens.addColorStop(1, "#ea3c1b");
    context.fillStyle = lens;
    context.strokeStyle = palette.ink;
    context.lineWidth = 18;
    context.beginPath();
    context.moveTo(230, 390);
    context.quadraticCurveTo(512, 335, 794, 390);
    context.lineTo(745, 514);
    context.quadraticCurveTo(512, 555, 279, 514);
    context.closePath();
    context.fill();
    context.stroke();
  }
}

function drawNeckwear(context: CanvasRenderingContext2D, neckwear: string) {
  if (neckwear === "bow") {
    context.fillStyle = palette.orange;
    context.beginPath();
    context.moveTo(512, 802);
    context.bezierCurveTo(430, 725, 309, 720, 322, 838);
    context.bezierCurveTo(347, 927, 454, 873, 512, 827);
    context.bezierCurveTo(572, 875, 679, 927, 703, 838);
    context.bezierCurveTo(718, 720, 596, 725, 512, 802);
    context.closePath();
    context.fill();
    strokeShape(context);
    context.fillStyle = palette.lime;
    context.beginPath();
    context.arc(512, 816, 49, 0, Math.PI * 2);
    context.fill();
    strokeShape(context);
  }

  if (neckwear === "tie") {
    context.fillStyle = palette.violet;
    context.beginPath();
    context.moveTo(448, 767);
    context.lineTo(576, 767);
    context.lineTo(605, 838);
    context.lineTo(512, 1012);
    context.lineTo(419, 838);
    context.closePath();
    context.fill();
    strokeShape(context);
    context.fillStyle = palette.lime;
    context.beginPath();
    context.moveTo(454, 766);
    context.lineTo(512, 823);
    context.lineTo(570, 766);
    context.closePath();
    context.fill();
    strokeShape(context);
  }

  if (neckwear === "bandana") {
    context.fillStyle = palette.orange;
    context.beginPath();
    context.moveTo(272, 765);
    context.quadraticCurveTo(510, 858, 752, 765);
    context.lineTo(512, 1009);
    context.closePath();
    context.fill();
    strokeShape(context);
    context.fillStyle = palette.cream;
    for (let x = 385; x <= 640; x += 85) {
      context.beginPath();
      context.arc(x, 842, 13, 0, Math.PI * 2);
      context.fill();
    }
  }

  if (neckwear === "pearls") {
    for (let index = 0; index < 11; index += 1) {
      const angle = Math.PI * 0.12 + (Math.PI * 0.76 * index) / 10;
      const x = 512 + Math.cos(angle) * 260;
      const y = 662 + Math.sin(angle) * 220;
      context.fillStyle = index % 2 ? "#ffffff" : palette.pink;
      context.beginPath();
      context.arc(x, y, 29, 0, Math.PI * 2);
      context.fill();
      strokeShape(context);
    }
  }
}

function drawFrame(context: CanvasRenderingContext2D, frame: string) {
  if (frame === "ring") {
    context.strokeStyle = palette.ink;
    context.lineWidth = 26;
    context.beginPath();
    context.arc(512, 512, 474, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = palette.lime;
    context.lineWidth = 12;
    context.beginPath();
    context.arc(512, 512, 450, 0, Math.PI * 2);
    context.stroke();
  }

  if (frame === "stamp") {
    context.save();
    context.translate(512, 512);
    context.rotate(-0.035);
    context.strokeStyle = palette.ink;
    context.lineWidth = 18;
    context.strokeRect(-470, -470, 940, 940);
    context.fillStyle = palette.ink;
    context.font = "900 54px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillRect(-318, 376, 636, 90);
    context.fillStyle = palette.cream;
    context.fillText("TIMON THE MEERKAT", 0, 423);
    context.restore();
  }
}

export function PfpStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState("studio");
  const [backdrop, setBackdrop] = useState("white");
  const [hat, setHat] = useState("yellow");
  const [eyewear, setEyewear] = useState("sunnies");
  const [neckwear, setNeckwear] = useState("none");
  const [frame, setFrame] = useState("ring");
  const [ready, setReady] = useState(false);

  const renderPfp = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new window.Image();
    image.decoding = "async";
    image.src = `/timon-pfp-${base}.png`;

    try {
      await image.decode();
    } catch {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not load Timon"));
      });
    }

    context.clearRect(0, 0, 1024, 1024);
    drawBackdrop(context, backdrop);

    context.save();
    context.shadowColor = "rgba(21, 24, 38, 0.28)";
    context.shadowBlur = 28;
    context.shadowOffsetY = 18;
    context.beginPath();
    context.arc(512, 512, 426, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, 86, 86, 852, 852);
    context.restore();

    context.strokeStyle = palette.ink;
    context.lineWidth = 14;
    context.beginPath();
    context.arc(512, 512, 426, 0, Math.PI * 2);
    context.stroke();

    drawHat(context, hat);
    drawEyewear(context, eyewear);
    drawNeckwear(context, neckwear);
    drawFrame(context, frame);
    setReady(true);
  }, [backdrop, base, eyewear, frame, hat, neckwear]);

  useEffect(() => {
    void renderPfp();
  }, [renderPfp]);

  function randomize() {
    const pick = (options: Option[]) =>
      options[Math.floor(Math.random() * options.length)].id;
    setBase(pick(BASES));
    setBackdrop(pick(BACKDROPS));
    setHat(pick(HATS));
    setEyewear(pick(EYEWEAR));
    setNeckwear(pick(NECKWEAR));
    setFrame(pick(FRAMES));
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const anchor = document.createElement("a");
    anchor.download = `timon-pfp-${Date.now()}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  return (
    <div className="pfp-studio">
      <div className="pfp-preview-panel">
        <div className="pfp-preview-copy">
          <span>LIVE PREVIEW</span>
          <b>1024 × 1024 PNG</b>
        </div>
        <div className="pfp-preview-wrap">
          <canvas
            ref={canvasRef}
            width={1024}
            height={1024}
            aria-label="Your customized Timon profile picture preview"
          />
          <span className="circle-safe-label">X CIRCLE SAFE</span>
        </div>
        <div className="pfp-preview-actions">
          <button type="button" onClick={randomize}>
            RANDOMIZE ↻
          </button>
          <button
            className="pfp-download"
            type="button"
            onClick={download}
            disabled={!ready}
          >
            DOWNLOAD PFP ↓
          </button>
        </div>
      </div>

      <div className="pfp-controls">
        <div className="pfp-control-group">
          <span>01</span>
          <label htmlFor="pfp-base">Choose your Timon</label>
          <select
            id="pfp-base"
            value={base}
            onChange={(event) => setBase(event.target.value)}
          >
            {BASES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pfp-control-group">
          <span>02</span>
          <label htmlFor="pfp-backdrop">Choose a backdrop</label>
          <select
            id="pfp-backdrop"
            value={backdrop}
            onChange={(event) => setBackdrop(event.target.value)}
          >
            {BACKDROPS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pfp-control-group">
          <span>03</span>
          <label htmlFor="pfp-hat">Put something on his head</label>
          <select
            id="pfp-hat"
            value={hat}
            onChange={(event) => setHat(event.target.value)}
          >
            {HATS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pfp-control-group">
          <span>04</span>
          <label htmlFor="pfp-eyewear">Add the shades</label>
          <select
            id="pfp-eyewear"
            value={eyewear}
            onChange={(event) => setEyewear(event.target.value)}
          >
            {EYEWEAR.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pfp-control-group">
          <span>05</span>
          <label htmlFor="pfp-neckwear">Dress the lookout</label>
          <select
            id="pfp-neckwear"
            value={neckwear}
            onChange={(event) => setNeckwear(event.target.value)}
          >
            {NECKWEAR.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pfp-control-group">
          <span>06</span>
          <label htmlFor="pfp-frame">Finish the frame</label>
          <select
            id="pfp-frame"
            value={frame}
            onChange={(event) => setFrame(event.target.value)}
          >
            {FRAMES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="pfp-privacy">
          No login. No wallet. Your PFP is built and downloaded on this device.
        </p>
      </div>
    </div>
  );
}
