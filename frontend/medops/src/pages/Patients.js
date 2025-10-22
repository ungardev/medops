import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { getPatients } from "api/patients";
export default function Patients() {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["patients"],
        queryFn: getPatients,
    });
    console.log("React Query test:", { data, isLoading, isError, error });
    if (isLoading)
        return _jsx("p", { children: "Cargando..." });
    if (isError)
        return _jsxs("p", { children: ["Error: ", error.message] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Pacientes" }), _jsx("ul", { children: data?.map((p) => (_jsx("li", { children: p.name }, p.id))) })] }));
}
