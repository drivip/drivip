import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function DrivipLogo({ size = "md", variant = "full" }) {
    const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14" };
    const textSizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
    const showLabel = variant !== "icon";
    const isWhite = variant === "white";
    return (_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: `${sizes[size]} rounded-xl ${isWhite ? "bg-white/15 backdrop-blur-sm border border-white/20" : "bg-gradient-to-br from-purple-600 to-indigo-700 shadow-md"} flex items-center justify-center`, children: _jsx("img", { src: "/logo.png", alt: "Drivip", className: `${size === "sm" ? "w-5 h-5" : size === "md" ? "w-6 h-6" : "w-8 h-8"} rounded-lg object-cover` }) }), showLabel && _jsx("span", { className: `${textSizes[size]} font-black ${isWhite ? "text-white" : "text-slate-900"} tracking-tight`, children: "Drivip" })] }));
}
