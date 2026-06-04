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
    rectangular: "rounded-xl",
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
  <div className="p-5 space-y-5">
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-3">
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <div className="pt-5 border-t border-white/10 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={22} height={22} />
          <Skeleton width="60%" height={12} />
        </div>
      ))}
    </div>
  </div>
);

// Header skeleton
export const HeaderSkeleton: React.FC = () => (
  <div className="flex items-center gap-5 px-5">
    <Skeleton variant="circular" width={36} height={36} />
    <div className="flex-1" />
    <Skeleton variant="circular" width={36} height={36} />
    <Skeleton variant="circular" width={36} height={36} />
  </div>
);

// Table skeleton for lists
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-4">
    <div className="flex gap-5 pb-4 border-b border-white/10">
      <Skeleton width="20%" height={14} />
      <Skeleton width="25%" height={14} />
      <Skeleton width="15%" height={14} />
      <Skeleton width="15%" height={14} />
      <Skeleton width="10%" height={14} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-5 py-4">
        <Skeleton width="20%" height={16} />
        <Skeleton width="25%" height={16} />
        <Skeleton width="15%" height={16} />
        <Skeleton width="15%" height={16} />
        <Skeleton width="10%" height={16} />
      </div>
    ))}
  </div>
);

// Card skeleton for dashboard/stats
export const CardSkeleton: React.FC = () => (
  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-xl space-y-5">
    <div className="flex items-center justify-between">
      <Skeleton width={120} height={14} />
      <Skeleton variant="circular" width={28} height={28} />
    </div>
    <Skeleton width="50%" height={36} />
    <Skeleton width="70%" height={12} />
  </div>
);

// Stat card skeleton with animated pulse
export const StatCardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-xl space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton width={100} height={14} />
        <Skeleton variant="circular" width={44} height={44} />
      </div>
      <Skeleton width="60%" height={32} />
      <div className="flex items-center gap-3">
        <Skeleton width={70} height={12} />
        <Skeleton width={50} height={12} />
      </div>
    </div>
  </div>
);