import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Briefcase,
    Building2,
    MapPin,
    Tag,
    Calendar,
    Eye
} from "lucide-react";
import api from "../../../api/axios";

const CandidatePositions = () => {
    const navigate = useNavigate();

    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await api.get("/positions");
                setPositions(response.data.data);
            } catch (error) {
                console.error("Error fetching positions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPositions();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const truncateDescription = (text, limit = 100) => {
        if (!text) return "No description provided.";
        return text.length > limit ? text.substring(0, limit) + "..." : text;
    };

    const filteredPositions = positions.filter((position) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            position.title?.toLowerCase().includes(searchLower) ||
            position.company?.toLowerCase().includes(searchLower) ||
            position.location?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading positions...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900">Available Positions</h1>
                    <p className="text-slate-600 mt-1">Browse available job opportunities and generate tailored CVs.</p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title, company, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div>
                </div>

                {/* Positions Grid */}
                {filteredPositions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                        <div className="text-slate-500 text-sm font-medium">No positions available</div>
                        <p className="text-slate-400 text-xs mt-1">
                            Check back later for new opportunities.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPositions.map((position) => (
                            <div
                                key={position.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
                                            {position.title}
                                        </h3>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${position.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-50 text-slate-700"
                                            }`}
                                    >
                                        {position.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Description Preview */}
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                                    {truncateDescription(position.description)}
                                </p>

                                {/* Details Grid */}
                                <div className="space-y-2.5 mb-4 border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{position.company || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{position.location || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                        <Tag className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{position.department || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span>Deadline: {formatDate(position.deadline)}</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => navigate(`/candidate/positions/${position.id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors mt-auto"
                                >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidatePositions;