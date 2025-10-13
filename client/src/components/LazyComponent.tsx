import React, { Suspense } from "react";

interface LazyComponentProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  component: Component,
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
}) => {
  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
};

export default LazyComponent;
