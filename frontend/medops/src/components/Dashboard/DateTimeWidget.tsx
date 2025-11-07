// src/components/Dashboard/DateTimeWidget.tsx
import React from "react";

export function DateTimeWidget() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return (
    <section className="card">
      <h3 className="card-title">Fecha y hora</h3>
      <p className="text-lg font-semibold">
        {now.toLocaleDateString("es-ES", options)}
      </p>
    </section>
  );
}
