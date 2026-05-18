// src/components/ui/Skeleton.tsx
import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
}) => {
  const baseClasses = "animate-pulse bg-white/5";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Sidebar skeleton for InstitutionalLayout
export const SidebarSkeleton: React.FC = () => (
  <div className="p-4 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={36} height={36} />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height={12} />
        <Skeleton width="40%" height={10} />
      </div>
    </div>
    <div className="pt-4 border-t border-white/10 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width="60%" height={10} />
        </div>
      ))}
    </div>
  </div>
);

// Header skeleton
export const HeaderSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 px-4">
    <Skeleton variant="circular" width={32} height={32} />
    <div className="flex-1" />
    <Skeleton variant="circular" width={32} height={32} />
    <Skeleton variant="circular" width={32} height={32} />
  </div>
);

// Table skeleton for lists
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 pb-3 border-b border-white/10">
      <Skeleton width="20%" height={12} />
      <Skeleton width="25%" height={12} />
      <Skeleton width="15%" height={12} />
      <Skeleton width="15%" height={12} />
      <Skeleton width="10%" height={12} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3">
        <Skeleton width="20%" height={14} />
        <Skeleton width="25%" height={14} />
        <Skeleton width="15%" height={14} />
        <Skeleton width="15%" height={14} />
        <Skeleton width="10%" height={14} />
      </div>
    ))}
  </div>
);

// Card skeleton for dashboard/stats
export const CardSkeleton: React.FC = () => (
  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-lg space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton width={100} height={12} />
      <Skeleton variant="circular" width={24} height={24} />
    </div>
    <Skeleton width="50%" height={32} />
    <Skeleton width="70%" height={10} />
  </div>
);

// Stat card skeleton with animated pulse
export const StatCardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width={80} height={12} className="bg-white/5" />
        <Skeleton variant="circular" width={40} height={40} className="bg-white/5" />
      </div>
      <Skeleton width="60%" height={28} className="bg-white/5" />
      <div className="flex items-center gap-2">
        <Skeleton width={60} height={10} className="bg-white/5" />
        <Skeleton width={40} height={10} className="bg-white/5" />
      </div>
    </div>
  </div>
);