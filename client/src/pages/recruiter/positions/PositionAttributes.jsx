import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Tag, Folder, FileCode } from "lucide-react";
import api from "../../../api/axios";

const PositionAttributes = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [allAttributes, setAllAttributes] = useState([]);
    const [positionAttributes, setPositionAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [attributesRes, positionAttrsRes] = await Promise.all([
                    api.get("/attributes"),
                    api.get("/position-attributes"),
                ]);
                setAllAttributes(attributesRes.data.data);

                // Filter attributes belonging to this position
                const filtered = positionAttrsRes.data.data.filter(
                    (pa) => pa.positionId === id
                );
                setPositionAttributes(filtered);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load attributes. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const getTypeBadge = (type) => {
        const badgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
        switch (type) {
            case "STRING":
                return <span className={`${badgeClasses} bg-blue-50 text-blue-700`}>STRING</span>;
            case "TEXT":
                return <span className={`${badgeClasses} bg-indigo-50 text-indigo-700`}>TEXT</span>;
            case "NUMERIC":
                return <span className={`${badgeClasses} bg-purple-50 text-purple-700`}>NUMERIC</span>;
            case "BOOLEAN":
                return <span className={`${badgeClasses} bg-green-50 text-green-700`}>BOOLEAN</span>;
            case "DATE":
                return <span className={`${badgeClasses} bg-orange-50 text-orange-700`}>DATE</span>;
            case "PERIOD":
                return <span className={`${badgeClasses} bg-yellow-50 text-yellow-700`}>PERIOD</span>;
            case "DROPDOWN":
                return <span className={`${badgeClasses} bg-pink-50 text-pink-700`}>DROPDOWN</span>;
            case "IMAGE":
                return <span className={`${badgeClasses} bg-cyan-50 text-cyan-700`}>IMAGE</span>;
            default:
                return <span className={`${badgeClasses} bg-slate-50 text-slate-700`}>{type}</span>;
        }
    };

    const handleAdd = async (attributeId) => {
        try {
            const response = await api.post("/position-attributes", {
                positionId: id,
                attributeId,
            });
            // Add the new position-attribute to the right panel
            setPositionAttributes((prev) => [...prev, response.data.data]);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to add attribute. Please try again."
            );
        }
    };

    const handleRemove = async (positionAttributeId) => {
        try {
            await api.delete(`/position-attributes/${positionAttributeId}`);
            setPositionAttributes((prev) =>
                prev.filter((pa) => pa.id !== positionAttributeId)
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to remove attribute. Please try again."
            );
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading attributes...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-red-600 text-sm font-medium mb-2">Error</div>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    // Get IDs of already attached attributes
    const attachedAttributeIds = positionAttributes.map((pa) => pa.attributeId);

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Position Attributes</h1>
                            <p className="text-slate-600 mt-1">
                                Manage attributes required for this position.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/positions/${id}`)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Position
                        </button>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Panel: Available Attributes */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Available Attributes</h2>
                        </div>

                        {allAttributes.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No attributes available
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allAttributes.map((attr) => {
                                    const isAttached = attachedAttributeIds.includes(attr.id);
                                    return (
                                        <div
                                            key={attr.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="h-4 w-4 text-slate-400" />
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {attr.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span>{attr.category || "N/A"}</span>
                                                    <span>•</span>
                                                    {getTypeBadge(attr.type)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAdd(attr.id)}
                                                disabled={isAttached}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isAttached
                                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                    }`}
                                            >
                                                <Plus className="h-3 w-3" />
                                                {isAttached ? "Added" : "Add"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Selected Position Attributes */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileCode className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Selected Position Attributes</h2>
                        </div>

                        {positionAttributes.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No attributes attached
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {positionAttributes.map((pa) => (
                                    <div
                                        key={pa.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-emerald-50/30 hover:bg-emerald-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-slate-400" />
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {pa.attribute?.name || "N/A"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span>{pa.attribute?.category || "N/A"}</span>
                                                <span>•</span>
                                                {getTypeBadge(pa.attribute?.type)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(pa.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PositionAttributes;