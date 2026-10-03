import { useState } from "react";

interface ProductImageProps {
  icon: string;
  image?: string;
  alt?: string;
  className?: string;
  iconClassName?: string;
}

export default function ProductImage({
  icon,
  image,
  alt = "",
  className = "",
  iconClassName = "text-6xl",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <div className={`w-full h-full bg-surface-container-low ${className}`}>
        <img
          src={image}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-surface-container-low ${className}`}
    >
      <span className={`material-symbols-outlined text-primary ${iconClassName}`}>
        {icon}
      </span>
    </div>
  );
}
