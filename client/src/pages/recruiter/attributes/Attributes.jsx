import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    Calendar,
    Tag
} from "lucide-react";
import api from "../../../api/axios";

const Attributes = () => {
    const navigate = useNavigate();

    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const response = await api.get("/attributes");
                setAttributes(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load attributes. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAttributes();
    }, []);

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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const filteredAttributes = attributes.filter((attribute) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            attribute.name?.toLowerCase().includes(searchLower) ||
            attribute.category?.toLowerCase().includes(searchLower) ||
            attribute.type?.toLowerCase().includes(searchLower)
        );
    });

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

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Attribute Library</h1>
                            <p className="text-slate-600 mt-1">
                                Manage reusable attributes for positions, profiles and CV generation.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/attributes/create")}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Attribute
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, category, or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div>
                </div>

                {/* Attributes Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Created Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttributes.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Tag className="h-12 w-12 text-slate-300 mb-3" />
                                                <div className="text-slate-500 text-sm font-medium">
                                                    No attributes found
                                                </div>
                                                <p className="text-slate-400 text-xs mt-1">
                                                    Try adjusting your search or create a new attribute.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttributes.map((attribute) => (
                                        <tr
                                            key={attribute.id}
                                            onClick={() => navigate(`/attributes/${attribute.id}`)}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                                                        <Tag className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {attribute.name || "N/A"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                {attribute.category || "N/A"}
                                            </td>
                                            <td className="py-4 px-6">
                                                {getTypeBadge(attribute.type)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatDate(attribute.createdAt)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attributes;