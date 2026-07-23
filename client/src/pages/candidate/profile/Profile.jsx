import { useState, useEffect } from "react";
import {
    Mail,
    MapPin,
    Briefcase,
    FolderKanban,
    FileText,
    Award
} from "lucide-react";
import api from "../../../api/axios";

const Profile = () => {
    

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/profile");
                setProfile(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load profile. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

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
                <div className="text-slate-600 text-sm font-medium">Loading profile...</div>
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

    if (!profile) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-slate-600 text-sm font-medium">Profile not found</div>
                </div>
            </div>
        );
    }

    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "N/A";
    const profilePhoto = profile.profilePhoto || null;

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-600 mt-1">Manage your profile, attributes, projects and CVs.</p>
                </div>

                {/* SECTION 1: ME */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-start gap-6 flex-wrap">
                        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shrink-0">
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto}
                                    alt={fullName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                profile.firstName?.charAt(0) || "U"
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span>{profile.email || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <span>{profile.location || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                    <span className="capitalize">{profile.role || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: INFO ATTRIBUTES */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Attributes</h2>
                    </div>
                    {profile.userAttributes && profile.userAttributes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Attribute</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.userAttributes.map((attr, index) => (
                                        <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900">{attr.attributeName || "N/A"}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{attr.category || "N/A"}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{attr.type || "N/A"}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{attr.value || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">No attributes found</div>
                    )}
                </div>

                {/* SECTION 3: PROJECTS */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FolderKanban className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
                    </div>
                    {profile.projects && profile.projects.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.projects.map((project) => (
                                        <tr key={project.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900">{project.title || "N/A"}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 truncate max-w-xs">{project.description || "N/A"}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{formatDate(project.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">No projects found</div>
                    )}
                </div>

                {/* SECTION 4: CVS */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">CVs</h2>
                    </div>
                    {profile.cvs && profile.cvs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Full Name</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.cvs.map((cv) => (
                                        <tr key={cv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900">{cv.fullName || "N/A"}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{cv.position?.title || "N/A"}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cv.status)}`}>
                                                    {cv.status || "Draft"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{formatDate(cv.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">No CVs found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;