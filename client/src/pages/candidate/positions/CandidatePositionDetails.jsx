import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    MapPin,
    Calendar,
    Tag,
    Clock,
    User,
    FileText,
    CalendarDays,
    Sparkles
} from "lucide-react";
import api from "../../../api/axios";

const CandidatePositionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPosition = async () => {
            try {
                const response = await api.get(`/positions/${id}`);
                setPosition(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load position details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPosition();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading position...</div>
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

    if (!position) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-slate-600 text-sm font-medium">Position not found</div>
                </div>
            </div>
        );
    }

    const fullName = position.user
        ? `${position.user.firstName} ${position.user.lastName}`
        : "Unknown";

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Position Details</h1>
                            <p className="text-slate-600 mt-1">
                                Explore the complete job opportunity and generate a tailored CV.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/candidate/positions")}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back To Positions
                        </button>
                    </div>
                </div>

                {/* Position Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Briefcase className="h-4 w-4" />
                                    <span>Position Title</span>
                                </div>
                                <p className="text-xl font-semibold text-slate-900">{position.title}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Building2 className="h-4 w-4" />
                                    <span>Company</span>
                                </div>
                                <p className="text-base text-slate-900">{position.company || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>Location</span>
                                </div>
                                <p className="text-base text-slate-900">{position.location || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Tag className="h-4 w-4" />
                                    <span>Department</span>
                                </div>
                                <p className="text-base text-slate-900">{position.department || "N/A"}</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Application Deadline</span>
                                </div>
                                <p className="text-base text-slate-900">{formatDate(position.deadline)}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Status</span>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    {position.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <User className="h-4 w-4" />
                                    <span>Posted By</span>
                                </div>
                                <p className="text-base text-slate-900">{fullName}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>Posted Date</span>
                                </div>
                                <p className="text-base text-slate-900">{formatDate(position.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Full Width: Description */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <FileText className="h-4 w-4" />
                            <span>Description</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {position.description || "No description provided."}
                        </p>
                    </div>
                </div>

                {/* Action Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Ready to apply?</h3>
                            <p className="text-slate-600 text-sm mt-1">
                                Generate a professional CV tailored specifically for this position.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/cvs/generate/${id}`)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Sparkles className="h-4 w-4" />
                            Generate CV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidatePositionDetails;