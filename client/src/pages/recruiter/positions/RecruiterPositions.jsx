import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Building2,
    MapPin,
    Tag,
    AlertCircle,
    RefreshCw,
    BriefcaseBusiness
} from "lucide-react";
import api from "../../../api/axios";

const RecruiterPositions = () => {
    const navigate = useNavigate();

    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPositionId, setSelectedPositionId] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        api.get("/positions")
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                setPositions(Array.isArray(data) ? data : []);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setPositions([]);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load positions. Please try again."
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((previous) => previous + 1);
    };

    const handleSelectPosition = (positionId) => {
        setSelectedPositionId((currentId) =>
            currentId === positionId ? "" : positionId
        );
        setDeleteError("");
    };

    const selectedPosition =
        positions.find((position) => position.id === selectedPositionId) || null;

    const handleEditSelected = () => {
        if (!selectedPosition) return;
        navigate(`/positions/edit/${selectedPosition.id}`);
    };

    const handleOpenDeleteDialog = () => {
        if (!selectedPosition) return;
        setDeleteError("");
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSelected = async () => {
        if (!selectedPosition || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(`/positions/${selectedPosition.id}`);

            setPositions((currentPositions) =>
                currentPositions.filter(
                    (position) => position.id !== selectedPosition.id
                )
            );
            setSelectedPositionId("");
            setIsDeleteDialogOpen(false);
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to delete position. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        if (deleting) return;
        setDeleteError("");
        setIsDeleteDialogOpen(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "N/A";

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredPositions = positions.filter((position) => {
        if (!normalizedSearchTerm) return true;

        return (
            position.title?.toLowerCase().includes(normalizedSearchTerm) ||
            position.company?.toLowerCase().includes(normalizedSearchTerm) ||
            position.location?.toLowerCase().includes(normalizedSearchTerm) ||
            position.department?.toLowerCase().includes(normalizedSearchTerm) ||
            position.description?.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-80">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading positions...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800/30 dark:bg-red-900/10"
                role="alert"
            >
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error loading positions</h3>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-800/30 dark:text-red-300 dark:hover:bg-red-800/50 dark:focus:ring-offset-slate-900"
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Position Management</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage the shared pool of job positions.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {positions.length === 1 ? "1 position" : `${positions.length} positions`}
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate("/positions/create")}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create Position
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        aria-label="Search recruiter positions"
                        placeholder="Search by title, company, location, department, or description..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedPosition ? (
                        <span>
                            Selected:{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {selectedPosition.title || "Untitled Position"}
                            </span>
                        </span>
                    ) : (
                        "Select a position to manage it."
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEditSelected}
                        disabled={!selectedPosition}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenDeleteDialog}
                        disabled={!selectedPosition}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Positions Table */}
            {positions.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <BriefcaseBusiness className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-white">No positions found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Create a position to start building CV templates.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/positions/create")}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create Position
                    </button>
                </div>
            ) : filteredPositions.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">No matching positions found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different search term.</p>
                    <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 w-12">
                                        <span className="sr-only">Select</span>
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Position
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Company
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Location
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Department
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Deadline
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredPositions.map((position) => {
                                    const isSelected = selectedPositionId === position.id;

                                    return (
                                        <tr
                                            key={position.id}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected
                                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                                    : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select position ${position.title || "Untitled Position"}`}
                                                    checked={isSelected}
                                                    onChange={() => handleSelectPosition(position.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Tag className="h-4 w-4" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            to={`/positions/${position.id}`}
                                                            className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                        >
                                                            {position.title || "Untitled Position"}
                                                        </Link>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {position.description?.length > 60
                                                                ? `${position.description.slice(0, 60)}...`
                                                                : position.description || "No description provided."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {position.company || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {position.location || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                {position.department || "N/A"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {formatDate(position.deadline)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.isActive === true
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {position.isActive === true ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                {formatDate(position.updatedAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && selectedPosition && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-position-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <h2 id="delete-position-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                            Delete Position?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            This will permanently delete{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                “{selectedPosition.title || "Untitled Position"}”
                            </span>
                            {" "}and may remove related data according to the database cascade rules. This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div className="mt-3 rounded-md bg-red-50 p-3 dark:bg-red-900/20" role="alert">
                                <p className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                            >
                                {deleting && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                )}
                                Delete Position
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterPositions;