import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    User,
    Mail,
    Phone,
    FileText,
    Briefcase,
    GraduationCap,
    Code,
    FolderKanban,
    CheckCircle,
    Clock,
    XCircle,
    Heart
} from "lucide-react";
import api from "../../../api/axios";

const CVDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [likesCount, setLikesCount] = useState(0);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        const fetchCV = async () => {
            try {
                const response = await api.get(`/cvs/${id}`);
                setCv(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load CV details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        const fetchLikes = async () => {
            try {
                const response = await api.get("/likes");
                const likes = response.data.data || [];
                const cvLikes = likes.filter(like => like.cvId === id);
                setLikesCount(cvLikes.length);
            } catch (err) {
                console.error("Error fetching likes:", err);
            }
        };

        fetchCV();
        fetchLikes();
    }, [id]);

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
                return <CheckCircle className="h-3 w-3" />;
            case "Draft":
                return <Clock className="h-3 w-3" />;
            case "Hidden":
                return <XCircle className="h-3 w-3" />;
            default:
                return <Clock className="h-3 w-3" />;
        }
    };

    const handleLike = async () => {
        if (liking) return;

        try {
            setLiking(true);
            await api.post("/likes", { cvId: id });

            // Refresh likes count
            const response = await api.get("/likes");
            const likes = response.data.data || [];
            const cvLikes = likes.filter(like => like.cvId === id);
            setLikesCount(cvLikes.length);
        } catch (err) {
            console.error("Error liking CV:", err);
            // You could show a toast/notification here
        } finally {
            setLiking(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading CV details...</div>
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

    if (!cv) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-slate-600 text-sm font-medium">CV not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">CV Details</h1>
                            <p className="text-slate-600 mt-1">View complete information about your CV.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/my-cvs")}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <button
                                onClick={() => navigate(`/cvs/edit/${id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit CV
                            </button>
                            <button
                                onClick={() => navigate(`/generated-cv/${id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <FileText className="h-4 w-4" />
                                View Generated CV
                            </button>
                            <button
                                onClick={handleLike}
                                disabled={liking}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Heart className={`h-4 w-4 ${liking ? 'animate-pulse' : ''}`} />
                                {liking ? 'Liking...' : `Like CV (${likesCount})`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* CV Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Personal Info */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <User className="h-4 w-4" />
                                    <span>Full Name</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-900">{cv.fullName || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Mail className="h-4 w-4" />
                                    <span>Email</span>
                                </div>
                                <p className="text-base text-slate-900">{cv.email || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Phone className="h-4 w-4" />
                                    <span>Phone</span>
                                </div>
                                <p className="text-base text-slate-900">{cv.phone || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Briefcase className="h-4 w-4" />
                                    <span>Position</span>
                                </div>
                                <p className="text-base text-slate-900">
                                    {cv.position?.title || "N/A"}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <FileText className="h-4 w-4" />
                                    <span>Status</span>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                        cv.status
                                    )}`}
                                >
                                    {getStatusIcon(cv.status)}
                                    {cv.status || "Draft"}
                                </span>
                            </div>
                        </div>

                        {/* Right Column - Professional Info */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <FileText className="h-4 w-4" />
                                    <span>Professional Summary</span>
                                </div>
                                <p className="text-base text-slate-700 leading-relaxed">
                                    {cv.summary || "No summary provided."}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Code className="h-4 w-4" />
                                    <span>Skills</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cv.skills ? (
                                        cv.skills.split(",").map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                                            >
                                                {skill.trim()}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-base text-slate-600">No skills provided.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <GraduationCap className="h-4 w-4" />
                                    <span>Education</span>
                                </div>
                                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {cv.education || "No education provided."}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Briefcase className="h-4 w-4" />
                                    <span>Experience</span>
                                </div>
                                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {cv.experience || "No experience provided."}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <FolderKanban className="h-4 w-4" />
                                    <span>Projects</span>
                                </div>
                                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {cv.projects || "No projects provided."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVDetails;