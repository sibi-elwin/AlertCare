"use client";

import Image from "next/image";

export function AlertCareLogo({ size = "md", variant = "default" }) {
  const sizes = {
    sm: { wrapper: "w-8 h-8", image: 32 },
    md: { wrapper: "w-10 h-10", image: 40 },
    lg: { wrapper: "w-14 h-14", image: 56 },
    xl: { wrapper: "w-20 h-20", image: 80 },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div
      className={`${currentSize.wrapper} rounded-lg overflow-hidden flex items-center justify-center ${
        variant === "light" ? "bg-white/20" : ""
      }`}
    >
      <Image
        src="/alertcare-logo.jpg"
        alt="AlertCare Logo"
        width={currentSize.image}
        height={currentSize.image}
        className="object-cover"
        priority
      />
    </div>
  );
}
