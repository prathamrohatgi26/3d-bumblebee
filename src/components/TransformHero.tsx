"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import {
  useScroll,
  useMotionValueEvent,
  motion,
  useTransform,
  MotionValue,
} from "framer-motion";
import * as THREE from "three";

type V3 = [number, number, number];

interface PieceDef {
  cp: V3; cs: V3; cr: V3;
  rp: V3; rs: V3; rr: V3;
  color: string;
  rColor?: string;
  geo: "box" | "cyl";
  emissive?: boolean;
  metal?: number;
  rough?: number;
}

const H = Math.PI / 2;

const PIECES: PieceDef[] = [
  // ── Body Shell ──
  // Lower body → Lower torso
  { cp:[0,0.2,0], cs:[4.0,0.55,1.6], cr:[0,0,0], rp:[0,0.2,0], rs:[0.9,0.55,0.55], rr:[0,0,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  // Belt line → Upper torso
  { cp:[0,0.52,0], cs:[3.6,0.1,1.65], cr:[0,0,0], rp:[0,0.7,0], rs:[1.0,0.6,0.6], rr:[0,0,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  // Roof → Head
  { cp:[0.15,0.93,0], cs:[1.2,0.07,1.3], cr:[0,0,0], rp:[0,1.65,0], rs:[0.5,0.55,0.5], rr:[0,0,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  // Hood → Chest plate
  { cp:[-1.1,0.56,0], cs:[1.2,0.05,1.5], cr:[0,0,0], rp:[0,0.85,0.28], rs:[0.7,0.4,0.05], rr:[0,0,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  // Hood scoop → Head crest
  { cp:[-1.0,0.6,0], cs:[0.35,0.04,0.25], cr:[0,0,0], rp:[0,1.97,0], rs:[0.12,0.1,0.2], rr:[0,0,0], color:"#E8B40E", geo:"box", metal:0.4, rough:0.35 },
  // Trunk → Back plate
  { cp:[1.5,0.5,0], cs:[0.8,0.05,1.4], cr:[0,0,0], rp:[0,0.5,-0.35], rs:[0.8,0.8,0.05], rr:[0,0,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  // Spoiler → Head antenna
  { cp:[1.78,0.58,0], cs:[0.12,0.04,1.2], cr:[0,0,0], rp:[0,1.95,-0.1], rs:[0.04,0.15,0.3], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.4, rough:0.4 },

  // ── Glass ──
  // Windshield → Chest window
  { cp:[-0.4,0.75,0], cs:[0.07,0.35,1.3], cr:[0,0,0.35], rp:[0,0.85,0.31], rs:[0.55,0.35,0.03], rr:[0,0,0], color:"#1a6fff", geo:"box", metal:0.3, rough:0.05 },
  // Rear window → Back upper detail
  { cp:[0.85,0.73,0], cs:[0.07,0.3,1.2], cr:[0,0,-0.25], rp:[0,1.0,-0.33], rs:[0.6,0.3,0.03], rr:[0,0,0], color:"#1a6fff", geo:"box", metal:0.3, rough:0.05 },
  // Side window L → Right shoulder armor
  { cp:[0.2,0.77,0.76], cs:[1.0,0.22,0.03], cr:[0,0,0], rp:[0.85,1.4,0], rs:[0.25,0.18,0.4], rr:[0,0,0], color:"#1a6fff", geo:"box", metal:0.3, rough:0.05 },
  // Side window R → Left shoulder armor
  { cp:[0.2,0.77,-0.76], cs:[1.0,0.22,0.03], cr:[0,0,0], rp:[-0.85,1.4,0], rs:[0.25,0.18,0.4], rr:[0,0,0], color:"#1a6fff", geo:"box", metal:0.3, rough:0.05 },

  // ── Doors → Wings ──
  { cp:[0.15,0.35,0.82], cs:[1.15,0.42,0.03], cr:[0,0,0], rp:[0.45,1.1,-0.35], rs:[0.45,0.6,0.03], rr:[0,0.3,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  { cp:[0.15,0.35,-0.82], cs:[1.15,0.42,0.03], cr:[0,0,0], rp:[-0.45,1.1,-0.35], rs:[0.45,0.6,0.03], rr:[0,-0.3,0], color:"#F5C518", geo:"box", metal:0.5, rough:0.3 },
  // Door window L
  { cp:[0.15,0.58,0.83], cs:[0.8,0.18,0.02], cr:[0,0,0], rp:[0.45,1.35,-0.36], rs:[0.3,0.25,0.02], rr:[0,0.3,0], color:"#1a6fff", geo:"box", metal:0.3, rough:0.05 },
  // Door window R
  { cp:[0.15,0.58,-0.83], cs:[0.8,0.18,0.02], cr:[0,0,0], rp:[-0.45,1.35,-0.36], rs:[0.3,0.25,0.02], rr:[0,-0.3,0], color:"#1a6fff", geo:"box", metal:0.3, rough:0.05 },
  // Door handle L
  { cp:[-0.1,0.38,0.84], cs:[0.15,0.03,0.02], cr:[0,0,0], rp:[0.46,1.05,-0.37], rs:[0.06,0.02,0.02], rr:[0,0.3,0], color:"#999", geo:"box", metal:0.9, rough:0.15 },
  // Door handle R
  { cp:[-0.1,0.38,-0.84], cs:[0.15,0.03,0.02], cr:[0,0,0], rp:[-0.46,1.05,-0.37], rs:[0.06,0.02,0.02], rr:[0,-0.3,0], color:"#999", geo:"box", metal:0.9, rough:0.15 },

  // ── Wheels ──
  // FL → Right shoulder
  { cp:[-1.15,-0.15,0.85], cs:[0.38,0.1,0.38], cr:[H,0,0], rp:[0.72,1.3,0], rs:[0.28,0.22,0.28], rr:[0,0,0], color:"#1a1a1a", geo:"cyl", metal:0.1, rough:0.9 },
  // FR → Right hand
  { cp:[-1.15,-0.15,-0.85], cs:[0.38,0.1,0.38], cr:[H,0,0], rp:[0.9,-0.15,0.05], rs:[0.14,0.14,0.14], rr:[0,0,0], color:"#1a1a1a", geo:"cyl", metal:0.1, rough:0.9 },
  // RL → Left shoulder
  { cp:[1.15,-0.15,0.85], cs:[0.38,0.1,0.38], cr:[H,0,0], rp:[-0.72,1.3,0], rs:[0.28,0.22,0.28], rr:[0,0,0], color:"#1a1a1a", geo:"cyl", metal:0.1, rough:0.9 },
  // RR → Left hand
  { cp:[1.15,-0.15,-0.85], cs:[0.38,0.1,0.38], cr:[H,0,0], rp:[-0.9,-0.15,0.05], rs:[0.14,0.14,0.14], rr:[0,0,0], color:"#1a1a1a", geo:"cyl", metal:0.1, rough:0.9 },

  // ── Wheel Hubs (chrome) ──
  { cp:[-1.15,-0.15,0.92], cs:[0.18,0.04,0.18], cr:[H,0,0], rp:[0.72,1.3,0.13], rs:[0.12,0.06,0.12], rr:[0,0,0], color:"#999", geo:"cyl", metal:0.9, rough:0.2 },
  { cp:[1.15,-0.15,0.92], cs:[0.18,0.04,0.18], cr:[H,0,0], rp:[-0.72,1.3,0.13], rs:[0.12,0.06,0.12], rr:[0,0,0], color:"#999", geo:"cyl", metal:0.9, rough:0.2 },

  // ── Fenders → Arms ──
  // Front fender L → Right forearm
  { cp:[-1.15,0.1,0.78], cs:[0.6,0.28,0.06], cr:[0,0,0], rp:[0.88,0.15,0], rs:[0.22,0.55,0.22], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.45, rough:0.35 },
  // Front fender R → Left forearm
  { cp:[-1.15,0.1,-0.78], cs:[0.6,0.28,0.06], cr:[0,0,0], rp:[-0.88,0.15,0], rs:[0.22,0.55,0.22], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.45, rough:0.35 },
  // Rear fender L → Right upper arm
  { cp:[1.15,0.1,0.78], cs:[0.6,0.28,0.06], cr:[0,0,0], rp:[0.88,0.8,0], rs:[0.25,0.65,0.25], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.45, rough:0.35 },
  // Rear fender R → Left upper arm
  { cp:[1.15,0.1,-0.78], cs:[0.6,0.28,0.06], cr:[0,0,0], rp:[-0.88,0.8,0], rs:[0.25,0.65,0.25], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.45, rough:0.35 },

  // ── Bumpers → Pelvis + Feet ──
  // Front bumper → Pelvis front
  { cp:[-1.95,0.15,0], cs:[0.2,0.34,1.55], cr:[0,0,0], rp:[0,0,0.12], rs:[0.8,0.18,0.25], rr:[0,0,0], color:"#111", geo:"box", metal:0.4, rough:0.4 },
  // Front bumper lip → Right foot
  { cp:[-2.02,0,0], cs:[0.12,0.1,1.6], cr:[0,0,0], rp:[0.25,-1.82,0.1], rs:[0.22,0.12,0.38], rr:[0,0,0], color:"#111", geo:"box", metal:0.4, rough:0.4 },
  // Rear bumper → Pelvis rear
  { cp:[1.95,0.18,0], cs:[0.2,0.3,1.55], cr:[0,0,0], rp:[0,0,-0.12], rs:[0.75,0.18,0.2], rr:[0,0,0], color:"#111", geo:"box", metal:0.4, rough:0.4 },
  // Rear bumper lip → Left foot
  { cp:[2.02,0.02,0], cs:[0.12,0.1,1.6], cr:[0,0,0], rp:[-0.25,-1.82,0.1], rs:[0.22,0.12,0.38], rr:[0,0,0], color:"#111", geo:"box", metal:0.4, rough:0.4 },

  // ── Grille → Ab plate ──
  { cp:[-1.98,0.32,0], cs:[0.04,0.16,0.9], cr:[0,0,0], rp:[0,0.15,0.28], rs:[0.35,0.12,0.03], rr:[0,0,0], color:"#222", geo:"box", metal:0.2, rough:0.6 },

  // ── Headlights → Eyes ──
  { cp:[-1.92,0.35,0.52], cs:[0.08,0.14,0.3], cr:[0,0,0], rp:[0.12,1.72,0.26], rs:[0.08,0.04,0.03], rr:[0,0,0], color:"#ffffcc", rColor:"#4FC3F7", geo:"box", emissive:true, metal:0, rough:0.1 },
  { cp:[-1.92,0.35,-0.52], cs:[0.08,0.14,0.3], cr:[0,0,0], rp:[-0.12,1.72,0.26], rs:[0.08,0.04,0.03], rr:[0,0,0], color:"#ffffcc", rColor:"#4FC3F7", geo:"box", emissive:true, metal:0, rough:0.1 },
  // Headlight housing L
  { cp:[-1.90,0.35,0.52], cs:[0.12,0.18,0.34], cr:[0,0,0], rp:[0.15,1.72,0.24], rs:[0.1,0.06,0.04], rr:[0,0,0], color:"#222", geo:"box", metal:0.6, rough:0.3 },
  // Headlight housing R
  { cp:[-1.90,0.35,-0.52], cs:[0.12,0.18,0.34], cr:[0,0,0], rp:[-0.15,1.72,0.24], rs:[0.1,0.06,0.04], rr:[0,0,0], color:"#222", geo:"box", metal:0.6, rough:0.3 },

  // ── Taillights → Calf accents ──
  { cp:[1.94,0.32,0.48], cs:[0.06,0.1,0.35], cr:[0,0,0], rp:[0.3,-1.35,0.16], rs:[0.08,0.15,0.03], rr:[0,0,0], color:"#ff2222", rColor:"#D4A017", geo:"box", emissive:true, metal:0, rough:0.15 },
  { cp:[1.94,0.32,-0.48], cs:[0.06,0.1,0.35], cr:[0,0,0], rp:[-0.3,-1.35,0.16], rs:[0.08,0.15,0.03], rr:[0,0,0], color:"#ff2222", rColor:"#D4A017", geo:"box", emissive:true, metal:0, rough:0.15 },
  // Taillight housing L
  { cp:[1.92,0.32,0.48], cs:[0.1,0.14,0.38], cr:[0,0,0], rp:[0.32,-1.35,0.14], rs:[0.1,0.17,0.04], rr:[0,0,0], color:"#1a1a1a", geo:"box", metal:0.5, rough:0.3 },
  // Taillight housing R
  { cp:[1.92,0.32,-0.48], cs:[0.1,0.14,0.38], cr:[0,0,0], rp:[-0.32,-1.35,0.14], rs:[0.1,0.17,0.04], rr:[0,0,0], color:"#1a1a1a", geo:"box", metal:0.5, rough:0.3 },

  // ── Racing Stripes → Chest stripes ──
  { cp:[-0.5,0.6,0.12], cs:[2.0,0.015,0.06], cr:[0,0,0], rp:[0.1,0.85,0.33], rs:[0.04,0.3,0.015], rr:[0,0,0], color:"#111", geo:"box", metal:0.2, rough:0.4 },
  { cp:[-0.5,0.6,-0.12], cs:[2.0,0.015,0.06], cr:[0,0,0], rp:[-0.1,0.85,0.33], rs:[0.04,0.3,0.015], rr:[0,0,0], color:"#111", geo:"box", metal:0.2, rough:0.4 },

  // ── Undercarriage → Thighs ──
  { cp:[-0.8,-0.15,0], cs:[1.5,0.05,1.2], cr:[0,0,0], rp:[0.25,-0.55,0], rs:[0.32,0.7,0.35], rr:[0,0,0], color:"#444", geo:"box", metal:0.3, rough:0.5 },
  { cp:[0.8,-0.15,0], cs:[1.5,0.05,1.2], cr:[0,0,0], rp:[-0.25,-0.55,0], rs:[0.32,0.7,0.35], rr:[0,0,0], color:"#444", geo:"box", metal:0.3, rough:0.5 },

  // ── Side Skirts → Shins ──
  { cp:[0,-0.03,0.82], cs:[2.0,0.06,0.03], cr:[0,0,0], rp:[0.25,-1.35,0], rs:[0.26,0.7,0.28], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.45, rough:0.35 },
  { cp:[0,-0.03,-0.82], cs:[2.0,0.06,0.03], cr:[0,0,0], rp:[-0.25,-1.35,0], rs:[0.26,0.7,0.28], rr:[0,0,0], color:"#D4A017", geo:"box", metal:0.45, rough:0.35 },
];

/* ─── Helpers ─── */

function smoothstep(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerpV(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function getScatter(i: number): { p: V3; r: V3 } {
  const n = PIECES.length;
  const a = i * 2.399963;
  const y = (i / (n - 1)) * 6 - 3;
  const r = 3.5 + Math.sin(i * 1.7) * 1;
  return {
    p: [Math.cos(a) * r, y + Math.sin(i * 0.8) * 0.5, Math.sin(a) * r],
    r: [Math.sin(i * 2.1) * 0.8, Math.cos(i * 1.3) * 0.6, Math.sin(i * 3.7) * 0.5],
  };
}

/* ─── Animated Piece ─── */

function Piece({ def, index, progressRef }: { def: PieceDef; index: number; progressRef: { current: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const scatter = useMemo(() => getScatter(index), [index]);
  const baseColor = useMemo(() => new THREE.Color(def.color), [def.color]);
  const targetColor = useMemo(() => new THREE.Color(def.rColor ?? def.color), [def.rColor, def.color]);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const scroll = progressRef.current;
    let phase: number;
    if (scroll < 0.15) phase = 0;
    else if (scroll < 0.45) phase = smoothstep((scroll - 0.15) / 0.3) * 0.5;
    else if (scroll < 0.75) phase = 0.5 + smoothstep((scroll - 0.45) / 0.3) * 0.5;
    else phase = 1;

    const ss = lerpV(def.cs, def.rs, 0.5);
    let pos: V3, scl: V3, rot: V3;
    if (phase <= 0.5) {
      const t = phase * 2;
      pos = lerpV(def.cp, scatter.p, t);
      scl = lerpV(def.cs, ss, t);
      rot = lerpV(def.cr, scatter.r, t);
    } else {
      const t = (phase - 0.5) * 2;
      pos = lerpV(scatter.p, def.rp, t);
      scl = lerpV(ss, def.rs, t);
      rot = lerpV(scatter.r, def.rr, t);
    }

    mesh.position.set(...pos);
    mesh.scale.set(...scl);
    mesh.rotation.set(...rot);

    // Color transition for pieces with robot color
    if (def.rColor) {
      const ct = Math.max(0, Math.min(1, (phase - 0.7) / 0.3));
      mat.color.copy(baseColor).lerp(targetColor, ct);
      if (def.emissive) {
        mat.emissive.copy(baseColor).lerp(targetColor, ct);
        mat.emissiveIntensity = 1 + ct * 3;
      }
    }

    // Subtle yellow glow on all pieces during scatter
    if (!def.emissive) {
      const glow = Math.sin(Math.max(0, Math.min(1, phase)) * Math.PI) * 0.12;
      mat.emissive.setRGB(glow, glow * 0.8, glow * 0.1);
    }
  });

  return (
    <mesh ref={meshRef}>
      {def.geo === "cyl" ? (
        <cylinderGeometry args={[1, 1, 1, 16]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial
        ref={matRef}
        color={def.color}
        metalness={def.metal ?? 0.3}
        roughness={def.rough ?? 0.4}
        emissive={def.emissive ? def.color : "#000"}
        emissiveIntensity={def.emissive ? 1 : 0}
      />
    </mesh>
  );
}

/* ─── Sword ─── */

function Sword({ progressRef }: { progressRef: { current: number } }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const scroll = progressRef.current;
    let phase: number;
    if (scroll < 0.15) phase = 0;
    else if (scroll < 0.45) phase = smoothstep((scroll - 0.15) / 0.3) * 0.5;
    else if (scroll < 0.75) phase = 0.5 + smoothstep((scroll - 0.45) / 0.3) * 0.5;
    else phase = 1;

    // Sword materializes during robot assembly (phase 0.7 → 1.0)
    const appear = smoothstep((phase - 0.7) / 0.25);
    group.scale.setScalar(appear);

    // Hilt at the right hand, flat side facing body, pushed forward
    group.position.set(0.9, -0.15, 0.3);
    group.rotation.set(Math.PI * 0.4, Math.PI / 2 + 0.15, -0.2);
  });

  return (
    <group ref={groupRef}>
      {/* Blade - tapered segments from base to tip */}
      {/* Base section (widest) */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.028]} />
        <meshStandardMaterial color="#5599dd" emissive="#4FC3F7" emissiveIntensity={1.5} metalness={0.5} roughness={0.1} />
      </mesh>
      {/* Mid section */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.11, 0.4, 0.025]} />
        <meshStandardMaterial color="#5599dd" emissive="#4FC3F7" emissiveIntensity={1.5} metalness={0.5} roughness={0.1} />
      </mesh>
      {/* Upper section */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.08, 0.35, 0.022]} />
        <meshStandardMaterial color="#66aaee" emissive="#4FC3F7" emissiveIntensity={1.8} metalness={0.4} roughness={0.1} />
      </mesh>
      {/* Near-tip section */}
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.05, 0.25, 0.018]} />
        <meshStandardMaterial color="#77bbff" emissive="#80DEEA" emissiveIntensity={2} metalness={0.3} roughness={0.08} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.025, 0.15, 0.014]} />
        <meshStandardMaterial color="#ccf0ff" emissive="#E0F7FA" emissiveIntensity={3} metalness={0} roughness={0.05} />
      </mesh>
      {/* Core glow running through blade */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.4, 0.035]} />
        <meshStandardMaterial color="#aaeeff" emissive="#B2EBF2" emissiveIntensity={3} metalness={0} roughness={0.05} transparent opacity={0.7} />
      </mesh>
      {/* Crossguard */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.08]} />
        <meshStandardMaterial color="#555" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Crossguard gems */}
      <mesh position={[0.18, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.045, 0.045]} />
        <meshStandardMaterial color="#4FC3F7" emissive="#4FC3F7" emissiveIntensity={2} metalness={0} roughness={0.1} />
      </mesh>
      <mesh position={[-0.18, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.045, 0.045]} />
        <meshStandardMaterial color="#4FC3F7" emissive="#4FC3F7" emissiveIntensity={2} metalness={0} roughness={0.1} />
      </mesh>
      {/* Grip */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.07, 0.28, 0.07]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Grip wraps */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.08, 0.035, 0.08]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.08, 0.035, 0.08]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.08, 0.035, 0.08]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Pommel */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.1, 0.07, 0.1]} />
        <meshStandardMaterial color="#F5C518" metalness={0.75} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ─── Floating Particles ─── */

function Particles({ count = 120 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 12 - 2,
        z: (Math.random() - 0.5) * 20,
        speed: 0.002 + Math.random() * 0.006,
        offset: Math.random() * Math.PI * 2,
        scale: 0.01 + Math.random() * 0.03,
      });
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed * 50 + p.offset) * 0.3,
        p.y + Math.sin(t * 0.3 + p.offset) * 0.5,
        p.z + Math.cos(t * p.speed * 50 + p.offset) * 0.3
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#F5C518" transparent opacity={0.4} />
    </instancedMesh>
  );
}

/* ─── Moon Surface Ground ─── */

function MoonGround() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[50, 50, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vWorldPos;

          // Hash functions for procedural noise
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          float hash2(vec2 p) {
            return fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453);
          }

          // Smooth noise
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          // FBM for terrain roughness
          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p *= 2.1;
              a *= 0.48;
            }
            return v;
          }

          // Crater function
          float crater(vec2 p, vec2 center, float radius) {
            float d = length(p - center) / radius;
            if (d > 1.3) return 0.0;
            // Rim
            float rim = smoothstep(0.85, 1.0, d) * (1.0 - smoothstep(1.0, 1.2, d));
            // Bowl
            float bowl = smoothstep(0.0, 0.85, d);
            return rim * 0.35 - (1.0 - bowl) * 0.2;
          }

          void main() {
            vec2 pos = vWorldPos.xz;
            float dist = length(pos);

            // Base moon color - grey with slight warm tint
            vec3 moonLight = vec3(0.28, 0.27, 0.25);
            vec3 moonDark = vec3(0.10, 0.10, 0.09);

            // Terrain noise
            float terrain = fbm(pos * 0.8);
            float detail = fbm(pos * 3.0) * 0.3;
            float fine = fbm(pos * 8.0) * 0.1;

            vec3 baseColor = mix(moonDark, moonLight, terrain + detail + fine);

            // Add craters
            float craterEffect = 0.0;
            // Large craters
            craterEffect += crater(pos, vec2(2.5, 3.0), 1.8);
            craterEffect += crater(pos, vec2(-4.0, -2.0), 2.2);
            craterEffect += crater(pos, vec2(6.0, -5.0), 1.5);
            craterEffect += crater(pos, vec2(-7.0, 4.0), 2.5);
            craterEffect += crater(pos, vec2(0.0, -7.0), 1.2);
            // Medium craters
            craterEffect += crater(pos, vec2(1.0, -3.5), 0.7);
            craterEffect += crater(pos, vec2(-2.5, 1.5), 0.5);
            craterEffect += crater(pos, vec2(4.5, 1.0), 0.6);
            craterEffect += crater(pos, vec2(-5.5, -5.5), 0.8);
            craterEffect += crater(pos, vec2(3.0, -1.5), 0.4);
            craterEffect += crater(pos, vec2(-1.0, 5.0), 0.55);
            // Small craters from noise
            for (int i = 0; i < 8; i++) {
              vec2 cp = vec2(hash(vec2(float(i) * 7.3, 1.0)) - 0.5, hash(vec2(1.0, float(i) * 5.7)) - 0.5) * 18.0;
              float cr = 0.2 + hash(vec2(float(i) * 3.1, float(i))) * 0.4;
              craterEffect += crater(pos, cp, cr);
            }

            baseColor += craterEffect * vec3(0.25, 0.24, 0.22);

            // Dust specks - bright highlights
            float dust = smoothstep(0.72, 0.74, noise(pos * 15.0));
            baseColor += dust * vec3(0.15, 0.14, 0.12);

            // Subtle blue tint from "earth light"
            float earthLight = max(0.0, 1.0 - dist / 12.0);
            baseColor += vec3(0.02, 0.03, 0.06) * earthLight;

            // Spotlight under the model
            float spot = exp(-dist * dist * 0.04);
            baseColor += vec3(0.06, 0.05, 0.03) * spot;

            // Fade to darkness at edges
            float edgeFade = 1.0 - smoothstep(10.0, 22.0, dist);
            baseColor *= edgeFade;

            gl_FragColor = vec4(baseColor, 1.0);
          }
        `}
      />
    </mesh>
  );
}

/* ─── 3D Scene ─── */

function Scene({ progressRef }: { progressRef: { current: number } }) {
  return (
    <>
      <fog attach="fog" args={["#060612", 12, 30]} />

      {/* Stars background */}
      <Stars radius={50} depth={40} count={1500} factor={3} saturation={0.2} fade speed={1.5} />

      {/* Ambient + key lights */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#fff5e0" />
      <directionalLight position={[-4, 5, -3]} intensity={0.5} color="#aaccff" />
      <directionalLight position={[0, 3, -5]} intensity={0.3} color="#8888ff" />

      {/* Warm accent on model */}
      <pointLight position={[0, 2, 3]} intensity={0.8} color="#F5C518" distance={10} />
      {/* Cool rim lights */}
      <pointLight position={[-5, 1, -3]} intensity={0.6} color="#4488ff" distance={15} />
      <pointLight position={[5, 1, -3]} intensity={0.4} color="#6644cc" distance={15} />
      {/* Under-glow */}
      <pointLight position={[0, -1.5, 0]} intensity={0.3} color="#2244aa" distance={8} />

      <Particles />

      {PIECES.map((def, i) => (
        <Piece key={i} def={def} index={i} progressRef={progressRef} />
      ))}

      <Sword progressRef={progressRef} />

      <MoonGround />

      <OrbitControls
        target={[0, 0.3, 0]}
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
      />
    </>
  );
}

/* ─── Text Overlays ─── */

function TextOverlays({ progress }: { progress: MotionValue<number> }) {
  const carOpacity = useTransform(progress, [0, 0.08, 0.18], [1, 1, 0]);
  const carY = useTransform(progress, [0, 0.18], [0, -30]);
  const transOpacity = useTransform(progress, [0.3, 0.38, 0.55, 0.63], [0, 1, 1, 0]);
  const robotOpacity = useTransform(progress, [0.78, 0.88], [0, 1]);
  const robotY = useTransform(progress, [0.78, 0.88], [30, 0]);
  const hintOpacity = useTransform(progress, [0, 0.03, 0.1], [1, 1, 0]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <motion.div
        className="absolute top-16 w-full text-center"
        style={{ opacity: carOpacity, y: carY }}
      >
        <h1 className="text-5xl font-extrabold tracking-wider text-yellow-400 drop-shadow-lg sm:text-7xl">
          BUMBLEBEE
        </h1>
        <p className="mt-3 text-lg font-medium text-yellow-200/80 drop-shadow-md">More than meets the eye</p>
      </motion.div>

      <motion.div
        className="absolute top-1/2 w-full -translate-y-1/2 text-center"
        style={{ opacity: transOpacity }}
      >
        <p className="text-2xl font-bold tracking-[0.3em] text-yellow-400 drop-shadow-lg sm:text-3xl">
          TRANSFORMING
        </p>
      </motion.div>

      <motion.div
        className="absolute bottom-20 w-full text-center"
        style={{ opacity: robotOpacity, y: robotY }}
      >
        <h2 className="text-4xl font-extrabold tracking-wider text-yellow-400 drop-shadow-lg sm:text-6xl">
          RISE
        </h2>
        <p className="mt-2 text-lg font-medium text-yellow-200/80 drop-shadow-md">Autobots, roll out</p>
      </motion.div>

      <motion.div
        className="absolute bottom-8 flex w-full flex-col items-center"
        style={{ opacity: hintOpacity }}
      >
        <p className="mb-2 text-sm text-gray-500">Scroll to transform</p>
        <div className="flex h-8 w-5 justify-center rounded-full border-2 border-gray-500 pt-1.5">
          <motion.div
            className="h-1.5 w-1 rounded-full bg-gray-400"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function TransformHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
  });

  return (
    <div ref={containerRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen" style={{ background: "radial-gradient(ellipse at 50% 40%, #0f1535 0%, #060612 60%, #020208 100%)" }}>
        <Canvas
          camera={{ position: [4, 2.5, 6.5], fov: 45 }}
          style={{ background: "transparent", touchAction: "pan-y" }}
          onCreated={({ gl }) => {
            gl.domElement.style.touchAction = "pan-y";
            gl.setClearColor(new THREE.Color("#000000"), 0);
          }}
        >
          <Scene progressRef={progressRef} />
        </Canvas>
        <TextOverlays progress={scrollYProgress} />
      </div>
    </div>
  );
}
