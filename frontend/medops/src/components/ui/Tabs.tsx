import { ReactNode, useState, useEffect } from "react";

interface TabProps {
  id: string;
  label: string;
  children: ReactNode;
}

interface TabsProps {
  children: ReactNode[];
  defaultTab?: string;
  className?: string;
  layout?: "vertical" | "horizontal";
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({ children, defaultTab, className, layout = "vertical" }: TabsProps) {
  const tabs = (children as any[]).filter((c) => c.type === Tab);

  // 🔹 Normalización de ids para tolerar inglés/español
  const normalize = (id: string | undefined): string | undefined => {
    if (!id) return undefined;
    const map: Record<string, string> = {
      info: "info",
      consultas: "consultas",
      documents: "documentos",   // 👈 mapea inglés a español
      documentos: "documentos",
      pagos: "pagos",
      citas: "citas",
      events: "eventos",
      eventos: "eventos",
    };
    return map[id.toLowerCase()] ?? id;
  };

  const initial = normalize(defaultTab) ?? tabs[0].props.id;
  const [active, setActive] = useState(initial);

  // 🔹 Si cambia el defaultTab (ej. por query param), actualiza el estado
  useEffect(() => {
    const normalized = normalize(defaultTab);
    if (normalized && normalized !== active) {
      setActive(normalized);
    }
  }, [defaultTab]);

  return (
    <div className={className ?? "space-y-4"}>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.props.id}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              active === tab.props.id
                ? "bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444]"
                : "bg-gray-100 text-[#0d2c53] hover:bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            }`}
            onClick={() => setActive(tab.props.id)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

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
