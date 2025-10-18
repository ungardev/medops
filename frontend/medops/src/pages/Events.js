import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function Events() {
    const [events, setEvents] = useState([]);
    useEffect(() => {
        fetch("/api/events/")
            .then(res => res.json())
            .then(data => setEvents(data));
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { children: "Eventos" }), _jsx("ul", { children: events.map((ev, idx) => (_jsx("li", { children: ev.descripcion }, idx))) })] }));
}
