import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Search,
    Calendar,
    Building2,
    MapPin,
    AlertCircle,
    RefreshCw,
    BriefcaseBusiness,
    FileText,
    Clock,
} from "lucide-react";
import api from "../../api/axios";

// --- Helpers ---

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

const safeMaxProjects = (value) => {
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 10) {
        return value;
    }
    return 4;
};

const extractTagNames = (position) => {
    if (
        !position ||
        typeof position !== "object" ||
        !Array.isArray(position.positionTags)
    ) {
        return [];
    }

    const tags = [];
    const seen = new Set();

    for (const positionTag of position.positionTags) {
        const rawName = positionTag?.tag?.name;

        if (typeof rawName !== "string") {
            continue;
        }

        const name = rawName.trim();

        if (!name) {
            continue;
        }

        const normalizedName = name.toLowerCase();

        if (seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);
        tags.push(name);
    }

    return tags;
};

const safeCvsCount = (position) => {
    const count = position._count?.cvs;
    if (typeof count === "number" && Number.isSafeInteger(count) && count >= 0) {
        return count;
    }
    return 0;
};

const renderTagChips = (position) => {
    const tagNames = extractTagNames(position);

    if (tagNames.length === 0) {
        return <span className="text-xs text-slate-400 dark:text-slate-500">No Tags</span>;
    }

    const displayTags = tagNames.slice(0, 3);
    const remaining = tagNames.length - 3;

    return (
        <div className="flex flex-wrap gap-1.5">
            {displayTags.map((name) => (
                <span
                    key={`${position.id}-tag-${name.toLowerCase()}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                    {name}
                </span>
            ))}
            {remaining > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    +{remaining} more
                </span>
            )}
        </div>
    );
};

const renderDescriptionPreview = (description) => {
    if (typeof description !== "string" || !description.trim()) {
        return (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                No description provided.
            </p>
        );
    }

    const trimmed = description.trim();
    const maxLength = 70;
    const preview = trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;

    return (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {preview}
        </p>
    );
};

// --- Component ---

const PublicPositions = () => {
    const [searchParams] = useSearchParams();
    const searchInputRef = useRef(null);

    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    // Initialize searchTerm from URL query
    const queryFromUrl = searchParams.get("query");
    const normalizedQueryFromUrl =
        typeof queryFromUrl === "string"
            ? queryFromUrl.trim().slice(0, 100)
            : "";

    const [searchTerm, setSearchTerm] = useState(() => normalizedQueryFromUrl);

    // Fetch positions
    useEffect(() => {
        let cancelled = false;

        const fetchPositions = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/positions/public");
                const data = response.data?.data;

                if (!cancelled) {
                    setPositions(Array.isArray(data) ? data : []);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setPositions([]);
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load available Positions. Please try again."
                    );
                    console.error(requestError.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchPositions();

        return () => {
            cancelled = true;
        };
    }, [retryCounter]);

    // Focus search input when ?focus=search is present
    useEffect(() => {
        const shouldFocusSearch = searchParams.get("focus") === "search";
        if (shouldFocusSearch && !loading && !error) {
            searchInputRef.current?.focus();
            searchInputRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [searchParams, loading, error]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((prev) => prev + 1);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredPositions = positions.filter((position) => {
        if (!normalizedSearchTerm) return true;

        const tagNames = extractTagNames(position);

        const searchableFields = [
            position.title,
            position.description,
            position.company,
            position.location,
            position.department,
            ...tagNames,
        ];

        return searchableFields.some(
            (field) =>
                typeof field === "string" &&
                field.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span className="text-sm font-medium">Loading available Positions...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md text-center"
                    role="alert"
                >
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                        Error loading Positions
                    </h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <BriefcaseBusiness className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        No available Positions found
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        There are currently no active public Positions available.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Available Positions
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Browse active public Positions in read-only mode. Sign in to check Candidate eligibility and generate a tailored CV.
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {filteredPositions.length === 1
                                ? "1 Position"
                                : `${filteredPositions.length} Positions`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Sign in to apply
                        </Link>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative" id="public-position-search">
                <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                />
                <input
                    ref={searchInputRef}
                    type="text"
                    aria-label="Search available Positions"
                    placeholder="Search by title, company, location, department, description, or Technology Tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
            </div>

            {/* Search results count / empty state */}
            {filteredPositions.length === 0 && normalizedSearchTerm && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                    <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        No matching Positions found
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Try a different search term.
                    </p>
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        Clear Search
                    </button>
                </div>
            )}

            {/* Table - only render when there are filtered results */}
            {filteredPositions.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        Position
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4" aria-hidden="true" />
                                            Company
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" aria-hidden="true" />
                                            Location
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        Department
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        Technology Tags
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        Max Projects
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" aria-hidden="true" />
                                            Deadline
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" aria-hidden="true" />
                                            CVs
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" aria-hidden="true" />
                                            Updated
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredPositions.map((position) => (
                                    <tr
                                        key={position.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/public/positions/${position.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
                                            >
                                                {position.title}
                                            </Link>
                                            {renderDescriptionPreview(position.description)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {position.company || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {position.location || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {position.department || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderTagChips(position)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {safeMaxProjects(position.maxProjects)} Projects
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {formatDate(position.deadline)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {safeCvsCount(position)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {formatDate(position.updatedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicPositions;