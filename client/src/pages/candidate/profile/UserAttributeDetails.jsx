import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Tag,
    Folder,
    FileCode,
    Calendar,
    Clock,
    CheckCircle
} from "lucide-react";
import api from "../../../api/axios";

const UserAttributeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [attribute, setAttribute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUserAttribute = async () => {
            try {
                const response = await api.get(`/user-attributes/${id}`);
                setAttribute(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load attribute details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUserAttribute();
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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this attribute value?"
        );
        if (!confirmed) return;

        try {
            await api.delete(`/user-attributes/${id}`);
            navigate("/profile/attributes");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete attribute. Please try again."
            );
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading attribute details...</div>
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

    if (!attribute) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-slate-600 text-sm font-medium">Attribute not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header / Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Attribute Details</h1>
                            <p className="text-slate-600 mt-1">
                                View detailed information about your profile attribute value.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/profile/attributes")}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <button
                                onClick={() => navigate(`/profile/attributes/edit/${id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Attribute Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Tag className="h-4 w-4" />
                                    <span>Attribute Name</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-900">
                                    {attribute.attribute?.name || "N/A"}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Folder className="h-4 w-4" />
                                    <span>Category</span>
                                </div>
                                <p className="text-base text-slate-900">
                                    {attribute.attribute?.category || "N/A"}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Value</span>
                                </div>
                                <p className="text-lg font-semibold text-blue-600">
                                    {attribute.value || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <FileCode className="h-4 w-4" />
                                    <span>Type</span>
                                </div>
                                <div className="pt-1">
                                    {getTypeBadge(attribute.attribute?.type)}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created Date</span>
                                </div>
                                <p className="text-base text-slate-900">
                                    {formatDate(attribute.createdAt)}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Last Updated</span>
                                </div>
                                <p className="text-base text-slate-900">
                                    {formatDate(attribute.updatedAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAttributeDetails;