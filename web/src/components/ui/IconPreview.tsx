"use client";

interface IconPreviewProps {
  base64?: string;
  url?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-64 h-64",
  lg: "w-80 h-80 sm:w-96 sm:h-96",
};

export default function IconPreview({ base64, url, size = "lg" }: IconPreviewProps) {
  const src = url ?? (base64 ? `data:image/png;base64,${base64}` : "");
  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl overflow-hidden shadow-lg`}
      style={{
        backgroundImage:
          "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), " +
          "linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), " +
          "linear-gradient(45deg, transparent 75%, #e5e7eb 75%), " +
          "linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
      }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Icon preview"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
