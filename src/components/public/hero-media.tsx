"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BrandMark } from "@/components/shared/brand-mark";

/**
 * Foto de portada con paralaje sutil ligado al scroll (40 px como máximo) y
 * marco ámbar desplazado. Sin foto, se muestra el "85" en contorno.
 */
export function HeroMedia({ image, alt }: { image: string; alt: string }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 40]);
  const frameY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -24]);

  return (
    <div className="relative">
      <motion.div
        aria-hidden="true"
        style={{ y: frameY }}
        className="border-primary pointer-events-none absolute inset-0 translate-x-4 translate-y-4 border"
      />
      <div className="relative aspect-[4/5] overflow-hidden">
        <motion.div style={{ y, scale: 1.08 }} className="absolute inset-0">
          {image ? (
            <Image src={image} alt={alt} fill priority sizes="(min-width: 1024px) 34vw, 90vw" className="object-cover" />
          ) : (
            <BrandMark />
          )}
        </motion.div>
      </div>
    </div>
  );
}
