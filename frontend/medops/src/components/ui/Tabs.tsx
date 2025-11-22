import { ReactNode, useState } from "react";

interface TabProps {
  id: string;
  label: string;
  children: ReactNode;
}

interface TabsProps {
  children: ReactNode[];
  defaultTab?: string;
  className?: string;
  layout?: "vertical" | "horizontal"; // 🔹 nueva prop
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({ children, defaultTab, className, layout = "vertical" }: TabsProps) {
  const tabs = (children as any[]).filter((c) => c.type === Tab);
  const [active, setActive] = useState(defaultTab ?? tabs[0].props.id);

  return (
    <div className={className ?? "space-y-4"}>
      {/* Header de pestañas */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.props.id}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              active === tab.props.id
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
            onClick={() => setActive(tab.props.id)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {layout === "vertical" ? (
        <div>
          {tabs.map((tab) =>
            tab.props.id === active ? (
              <div
                key={tab.props.id}
                className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800"
              >
                {tab.props.children}
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tabs.map((tab) =>
            tab.props.id === active ? (
              <div
                key={tab.props.id}
                className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800"
              >
                {tab.props.children}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
