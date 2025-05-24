module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/src/app/shoots/page.jsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ShootsPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function ShootsPage() {
    const [shoots, setShoots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [hovered, setHovered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showFilters, setShowFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filters, setFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        edited: true,
        notEdited: true,
        paid: true,
        notPaid: true,
        categories: []
    });
    const [categoryInput, setCategoryInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [categoryDropdown, setCategoryDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const filterRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    // Get all unique categories from shoots
    const allCategories = Array.from(new Set(shoots.map((s)=>s.genre).filter(Boolean)));
    // Filtered categories for autocomplete
    const filteredCategories = allCategories.filter((c)=>c && c.toLowerCase().includes(categoryInput.toLowerCase()) && !filters.categories.includes(c));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchShoots = async ()=>{
            const res = await fetch('/api/shoots/get-shoots');
            const { data, error } = await res.json();
            if (error) setError(error);
            else setShoots(data || []);
        };
        fetchShoots();
    }, []);
    // Close dropdown when clicking outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        function handleClickOutside(e) {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilters(false);
                setCategoryDropdown(false);
            }
        }
        if (showFilters || categoryDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return ()=>document.removeEventListener("mousedown", handleClickOutside);
    }, [
        showFilters,
        categoryDropdown
    ]);
    // Filtering logic
    const filteredShoots = shoots.filter((shoot)=>{
        const isEdited = !!shoot.edited_and_returned;
        const isPaid = !!shoot.paid;
        const matchesCategory = filters.categories.length === 0 || shoot.genre && filters.categories.includes(shoot.genre);
        return (isEdited && filters.edited || !isEdited && filters.notEdited) && (isPaid && filters.paid || !isPaid && filters.notPaid) && matchesCategory;
    });
    // Add category to filter
    const addCategory = (cat)=>{
        setFilters((f)=>({
                ...f,
                categories: [
                    ...f.categories,
                    cat
                ]
            }));
        setCategoryInput("");
        setCategoryDropdown(false);
    };
    // Remove category from filter
    const removeCategory = (cat)=>{
        setFilters((f)=>({
                ...f,
                categories: f.categories.filter((c)=>c !== cat)
            }));
    };
    // Delete shoot handler
    const handleDelete = async (shootId)=>{
        if (!window.confirm("Are you sure you want to delete this shoot?")) return;
        const res = await fetch(`/api/shoots/delete-shoots?id=${shootId}`, {
            method: "DELETE"
        });
        const { error } = await res.json();
        if (!error) {
            setShoots((shoots)=>shoots.filter((s)=>s.id !== shootId));
        } else {
            alert("Failed to delete shoot: " + error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: "40px 0",
            minHeight: "100vh",
            background: "#f8fafc",
            position: "relative"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>router.push("/"),
                style: {
                    position: "absolute",
                    top: 32,
                    left: 32,
                    background: hovered === "home" ? "#005bb5" : "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 24px",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    transition: "background 0.2s",
                    zIndex: 10
                },
                onMouseOver: ()=>setHovered("home"),
                onMouseOut: ()=>setHovered(null),
                children: "← Back to Home"
            }, void 0, false, {
                fileName: "[project]/src/app/shoots/page.jsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "absolute",
                    top: 32,
                    right: 32,
                    display: "flex",
                    gap: 16,
                    zIndex: 20
                },
                ref: filterRef,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>router.push("/shoots/add"),
                        style: {
                            background: "#fff",
                            color: "#0070f3",
                            border: "2px solid #0070f3",
                            borderRadius: 8,
                            padding: "10px 24px",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                            transition: "background 0.2s, color 0.2s"
                        },
                        onMouseOver: ()=>setHovered("add"),
                        onMouseOut: ()=>setHovered(null),
                        children: "+ Add Shoot"
                    }, void 0, false, {
                        fileName: "[project]/src/app/shoots/page.jsx",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowFilters((v)=>!v),
                        style: {
                            background: "#fff",
                            color: "#0070f3",
                            border: "2px solid #0070f3",
                            borderRadius: 8,
                            padding: "10px 24px",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                            transition: "background 0.2s, color 0.2s"
                        },
                        children: "Filters ▼"
                    }, void 0, false, {
                        fileName: "[project]/src/app/shoots/page.jsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this),
                    showFilters && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            top: "110%",
                            right: 0,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                            padding: "20px 24px",
                            minWidth: 240,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            zIndex: 30
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: filters.edited,
                                        onChange: ()=>setFilters((f)=>({
                                                    ...f,
                                                    edited: !f.edited
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 199,
                                        columnNumber: 15
                                    }, this),
                                    "Edited"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 198,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: filters.notEdited,
                                        onChange: ()=>setFilters((f)=>({
                                                    ...f,
                                                    notEdited: !f.notEdited
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 207,
                                        columnNumber: 15
                                    }, this),
                                    "Not Edited"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 206,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: filters.paid,
                                        onChange: ()=>setFilters((f)=>({
                                                    ...f,
                                                    paid: !f.paid
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 215,
                                        columnNumber: 15
                                    }, this),
                                    "Paid"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 214,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: filters.notPaid,
                                        onChange: ()=>setFilters((f)=>({
                                                    ...f,
                                                    notPaid: !f.notPaid
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this),
                                    "Not Paid"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 222,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: "bold",
                                            marginBottom: 4
                                        },
                                        children: "Category"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 232,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 6,
                                            marginBottom: 6
                                        },
                                        children: filters.categories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    background: "#e6f0fa",
                                                    color: "#0070f3",
                                                    borderRadius: 12,
                                                    padding: "2px 10px",
                                                    fontSize: "0.95em",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4
                                                },
                                                children: [
                                                    cat,
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>removeCategory(cat),
                                                        style: {
                                                            background: "none",
                                                            border: "none",
                                                            color: "#0070f3",
                                                            fontWeight: "bold",
                                                            cursor: "pointer",
                                                            marginLeft: 2,
                                                            fontSize: "1em",
                                                            lineHeight: 1
                                                        },
                                                        "aria-label": `Remove ${cat}`,
                                                        children: "×"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/shoots/page.jsx",
                                                        lineNumber: 246,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, cat, true, {
                                                fileName: "[project]/src/app/shoots/page.jsx",
                                                lineNumber: 235,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 233,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: "Add category",
                                        value: categoryInput,
                                        onChange: (e)=>{
                                            setCategoryInput(e.target.value);
                                            setCategoryDropdown(true);
                                        },
                                        onFocus: ()=>setCategoryDropdown(true),
                                        style: {
                                            width: "100%",
                                            padding: "6px 10px",
                                            borderRadius: 8,
                                            border: "1px solid #ccc",
                                            fontSize: "1em",
                                            marginBottom: 0
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 264,
                                        columnNumber: 15
                                    }, this),
                                    categoryDropdown && filteredCategories.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: "absolute",
                                            background: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 8,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                            marginTop: 2,
                                            zIndex: 40,
                                            width: "calc(100% - 2px)",
                                            maxHeight: 120,
                                            overflowY: "auto"
                                        },
                                        children: filteredCategories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                onClick: ()=>addCategory(cat),
                                                style: {
                                                    padding: "6px 10px",
                                                    cursor: "pointer",
                                                    color: "#0070f3",
                                                    background: "#fff",
                                                    borderBottom: "1px solid #f0f0f0",
                                                    fontSize: "1em"
                                                },
                                                onMouseDown: (e)=>e.preventDefault(),
                                                children: cat
                                            }, cat, false, {
                                                fileName: "[project]/src/app/shoots/page.jsx",
                                                lineNumber: 296,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 283,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 231,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/shoots/page.jsx",
                        lineNumber: 183,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/shoots/page.jsx",
                lineNumber: 133,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                style: {
                    marginBottom: "32px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    style: {
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: "#0070f3",
                        margin: 0
                    },
                    children: "Shoots"
                }, void 0, false, {
                    fileName: "[project]/src/app/shoots/page.jsx",
                    lineNumber: 327,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/shoots/page.jsx",
                lineNumber: 320,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    color: "red"
                },
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/shoots/page.jsx",
                lineNumber: 330,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                    alignItems: "center",
                    padding: "0 40px"
                },
                children: filteredShoots && filteredShoots.length > 0 ? filteredShoots.map((shoot, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "100%",
                            minHeight: "64px",
                            borderRadius: "24px",
                            background: hovered === idx ? "#e6f0fa" : "#fff",
                            boxShadow: hovered === idx ? "0 4px 16px rgba(0,112,243,0.15)" : "0 2px 12px rgba(0,0,0,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 40,
                            padding: "0 32px",
                            border: hovered === idx ? "2px solid #005bb5" : "2px solid #0070f3",
                            transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                            color: "#222",
                            cursor: "pointer",
                            boxSizing: "border-box",
                            position: "relative"
                        },
                        onMouseOver: ()=>setHovered(idx),
                        onMouseOut: ()=>setHovered(null),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: `/shoots/${shoot.id}`,
                                style: {
                                    display: "flex",
                                    flex: 1,
                                    alignItems: "center",
                                    gap: 40,
                                    textDecoration: "none",
                                    color: "inherit"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            flex: 1,
                                            fontWeight: "bold",
                                            color: "#0070f3",
                                            fontSize: "1.1rem",
                                            textAlign: "left"
                                        },
                                        children: shoot.client || "No Client"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 377,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            flex: 1,
                                            color: "#333",
                                            fontSize: "1rem",
                                            textAlign: "left"
                                        },
                                        children: shoot.date ? new Date(shoot.date).toLocaleDateString() + " " + new Date(shoot.date).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }) : "No Date"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 380,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            flex: 1,
                                            color: "#555",
                                            fontSize: "1rem",
                                            textAlign: "left"
                                        },
                                        children: shoot.genre || "No Genre"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 387,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            flex: 1,
                                            color: "#555",
                                            fontSize: "1rem",
                                            textAlign: "left"
                                        },
                                        children: shoot.paid ? "Paid" : "Not Paid"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 390,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            flex: 1,
                                            color: shoot.edited_and_returned ? "#4eb300" : "#b91c1c",
                                            fontWeight: "bold",
                                            fontSize: "1rem",
                                            textAlign: "left"
                                        },
                                        children: shoot.edited_and_returned ? "Edited" : "Not Edited"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/shoots/page.jsx",
                                        lineNumber: 393,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 366,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: async (e)=>{
                                    e.stopPropagation();
                                    e.preventDefault();
                                    await handleDelete(shoot.id);
                                },
                                style: {
                                    background: "none",
                                    border: "none",
                                    color: "#b91c1c",
                                    fontWeight: "bold",
                                    fontSize: "1.5rem",
                                    cursor: "pointer",
                                    marginLeft: 16,
                                    lineHeight: 1
                                },
                                title: "Delete shoot",
                                "aria-label": "Delete shoot",
                                children: "×"
                            }, void 0, false, {
                                fileName: "[project]/src/app/shoots/page.jsx",
                                lineNumber: 403,
                                columnNumber: 15
                            }, this)
                        ]
                    }, shoot.id || idx, true, {
                        fileName: "[project]/src/app/shoots/page.jsx",
                        lineNumber: 341,
                        columnNumber: 13
                    }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "No shoots found."
                }, void 0, false, {
                    fileName: "[project]/src/app/shoots/page.jsx",
                    lineNumber: 427,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/shoots/page.jsx",
                lineNumber: 332,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/shoots/page.jsx",
        lineNumber: 105,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__f39b430d._.js.map