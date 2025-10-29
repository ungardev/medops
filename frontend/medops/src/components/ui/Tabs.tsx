// src/components/ui/Tabs.tsx
import { ReactNode, useState } from "react";

interface TabProps {
  id: string;
  label: string;
  children: ReactNode;
}

interface TabsProps {
  children: ReactNode[];
  defaultTab?: string;
  className?: string; // 🔹 agregado
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({ children, defaultTab, className }: TabsProps) {
  const tabs = (children as any[]).filter((c) => c.type === Tab);
  const [active, setActive] = useState(defaultTab ?? tabs[0].props.id);

  return (
    <div className={className ?? "tabs-container"}>
      <div className="tabs-header flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.props.id}
            className={`btn ${
              active === tab.props.id ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setActive(tab.props.id)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      <div className="tabs-content">
        {tabs.map((tab) =>
          tab.props.id === active ? (
            <div key={tab.props.id}>{tab.props.children}</div>
          ) : null
        )}
      </div>
    </div>
  );
}
