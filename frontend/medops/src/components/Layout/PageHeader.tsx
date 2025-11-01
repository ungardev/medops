import { useEffect, useState } from "react";
import moment from "moment";
import "moment/locale/es"; // 👈 para mostrar en español

interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 60_000); // refresca cada minuto
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-6 border-b pb-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      <p className="text-sm text-gray-400">
        {now.format("dddd, DD [de] MMMM YYYY - HH:mm")}
      </p>
    </div>
  );
}
