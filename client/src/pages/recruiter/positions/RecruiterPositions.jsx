import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    Eye,
    Pencil,
    Calendar,
    Building2,
    MapPin,
    Tag
} from "lucide-react";
import api from "../../../api/axios";

const RecruiterPositions = () => {
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Position Management</h1>
                            <p className="text-slate-600 mt-1">Manage all job positions created in the system.</p>
                        </div>
                        <button
                            onClick={() => navigate("/positions/create")}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Position
                        </button>
                    </div>
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

                {/* Positions Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Deadline
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-right py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPositions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center">
                                            <div className="text-slate-500 text-sm font-medium">
                                                No positions found
                                            </div>
                                            <p className="text-slate-400 text-xs mt-1">
                                                Try adjusting your search or create a new position.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPositions.map((position) => (
                                        <tr
                                            key={position.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                                                        <Tag className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {position.title}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {position.description?.substring(0, 60)}
                                                            {position.description?.length > 60 ? "..." : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                    {position.company || "N/A"}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    {position.location || "N/A"}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                {position.department || "N/A"}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatDate(position.deadline)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.isActive
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-50 text-slate-700"
                                                        }`}
                                                >
                                                    {position.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/positions/${position.id}`)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Position"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/positions/edit/${position.id}`)}
                                                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit Position"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
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

export default RecruiterPositions;