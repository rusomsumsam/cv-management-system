import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Eye,
    Pencil,
    Trash2,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";
import api from "../../../api/axios";

const CandidateCVs = () => {
    const navigate = useNavigate();

    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCVs = async () => {
            try {
                const response = await api.get("/cvs");
                setCvs(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load your CVs. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCVs();
    }, []);

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this CV?"
        );
        if (!confirmed) return;

        try {
            await api.delete(`/cvs/${id}`);
            setCvs((prev) => prev.filter((cv) => cv.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete CV. Please try again.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Published":
                return "bg-emerald-50 text-emerald-700";
            case "Draft":
                return "bg-slate-50 text-slate-700";
            case "Hidden":
                return "bg-red-50 text-red-700";
            default:
                return "bg-slate-50 text-slate-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Published":
                return CheckCircle;
            case "Draft":
                return Clock;
            case "Hidden":
                return XCircle;
            default:
                return Clock;
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

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading your CVs...</div>
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
                    <h1 className="text-2xl font-bold text-slate-900">My CVs</h1>
                    <p className="text-slate-600 mt-1">
                        Manage all your generated CVs and track their status.
                    </p>
                </div>

                {/* CVs Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Full Name
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Created Date
                                    </th>
                                    <th className="text-right py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {cvs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="h-12 w-12 text-slate-300 mb-3" />
                                                <div className="text-slate-500 text-sm font-medium">
                                                    No CVs found
                                                </div>
                                                <p className="text-slate-400 text-xs mt-1">
                                                    Generate your first CV from a position page.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cvs.map((cv) => {
                                        const StatusIcon = getStatusIcon(cv.status);
                                        return (
                                            <tr
                                                key={cv.id}
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {cv.fullName || "N/A"}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                {cv.email || ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-600">
                                                    {cv.position?.title || "N/A"}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            cv.status
                                                        )}`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {cv.status || "Draft"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        {formatDate(cv.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                navigate(`/cvs/${cv.id}`)
                                                            }
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View CV"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                navigate(`/cvs/edit/${cv.id}`)
                                                            }
                                                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit CV"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(cv.id)
                                                            }
                                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete CV"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateCVs;