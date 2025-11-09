import React from "react";
import { useBCVRate } from "@/hooks/dashboard/useBCVRate";

const BCVRateBadge: React.FC = () => {
  const { data, isLoading, isError } = useBCVRate();

  if (isLoading) {
    return <p className="text-xs text-gray-500">Consultando tasa BCV...</p>;
  }

  if (isError || !data) {
    return <p className="text-xs text-red-500">Error al consultar tasa BCV</p>;
  }

  const { value, is_fallback } = data;

  return (
    <div className="text-xs text-gray-600 mt-1">
      Tasa BCV del día:{" "}
      <strong>{value.toFixed(2)} Bs/USD</strong>{" "}
      {is_fallback && (
        <span className="text-yellow-600">(valor fallback)</span>
      )}
    </div>
  );
};

export default BCVRateBadge;
