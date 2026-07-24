import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import {
    Search,
    CheckCircle2,
    Heart,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Users,
    BriefcaseBusiness
} from "lucide-react";

const RecruiterCVs = () => {
    const navigate = useNavigate();
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCVId, setSelectedCVId] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [likeUpdating, setLikeUpdating] = useState(false);
    const [likeError, setLikeError] = useState("");
    const [likeMessage, setLikeMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        api
            .get("/cvs")
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                const publishedCVs = Array.isArray(data)
                    ? data.filter(
                        (cv) =>
                            cv.status === "PUBLISHED" &&
                            cv.position?.isActive === true
                    )
                    : [];

                setCvs(publishedCVs);
                setSelectedCVId("");
                setError("");
                setLikeError("");
                setLikeMessage("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setCvs([]);
                setSelectedCVId("");
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load Published CVs. Please try again."
                );
                console.error("Failed to load Recruiter CVs:", requestError.message);
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
        setLikeError("");
        setLikeMessage("");
    };

    const getCandidateName = (cv) => {
        const profileName = [cv.user?.firstName, cv.user?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
        return profileName || cv.fullName || "Unnamed Candidate";
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

    const handleSelectCV = (cvId) => {
        setSelectedCVId((currentId) => (currentId === cvId ? "" : cvId));
        setLikeError("");
        setLikeMessage("");
    };

    const selectedCV = cvs.find((cv) => cv.id === selectedCVId) || null;

    const handleViewSelected = () => {
        if (!selectedCV) return;
        navigate(`/recruiter/cvs/${selectedCV.id}`);
    };

    const handleLikeToggle = async () => {
        if (!selectedCV || likeUpdating || selectedCV.status !== "PUBLISHED" || selectedCV.position?.isActive !== true) {
            return;
        }

        try {
            setLikeUpdating(true);
            setLikeError("");
            setLikeMessage("");

            const response = selectedCV.likedByCurrentUser
                ? await api.delete(`/likes/cvs/${selectedCV.id}`)
                : await api.post(`/likes/cvs/${selectedCV.id}`);

            const data = response.data?.data;

            if (
                !data ||
                data.cvId !== selectedCV.id ||
                typeof data.likedByCurrentUser !== "boolean" ||
                typeof data.likesCount !== "number"
            ) {
                throw new Error("Like update returned invalid data.");
            }

            setCvs((currentCVs) =>
                currentCVs.map((cv) => {
                    if (cv.id !== data.cvId) {
                        return cv;
                    }

                    return {
                        ...cv,
                        likedByCurrentUser: data.likedByCurrentUser,
                        _count: {
                            ...cv._count,
                            likes: Math.max(0, data.likesCount),
                        },
                    };
                })
            );

            setLikeMessage(
                response.data?.message ||
                (data.likedByCurrentUser
                    ? "CV liked successfully."
                    : "CV unliked successfully.")
            );
        } catch (requestError) {
            setLikeError(
                requestError.response?.data?.message ||
                "Failed to update CV Like. Please try again."
            );
            console.error("Failed to update selected CV Like:", requestError.message);
        } finally {
            setLikeUpdating(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setSelectedCVId("");
        setLikeError("");
        setLikeMessage("");
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setSelectedCVId("");
        setLikeError("");
        setLikeMessage("");
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredCVs = cvs.filter((cv) => {
        if (!normalizedSearchTerm) return true;

        const candidateName = getCandidateName(cv).toLowerCase();

        return (
            candidateName.includes(normalizedSearchTerm) ||
            cv.fullName?.toLowerCase().includes(normalizedSearchTerm) ||
            cv.email?.toLowerCase().includes(normalizedSearchTerm) ||
            cv.position?.title?.toLowerCase().includes(normalizedSearchTerm) ||
            cv.position?.company?.toLowerCase().includes(normalizedSearchTerm) ||
            cv.position?.location?.toLowerCase().includes(normalizedSearchTerm) ||
            cv.position?.department?.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return (
            <div className="min-h-[320px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span className="text-sm font-medium">Loading Published CVs...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6" role="alert">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Published CVs</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Review Candidate CVs published for active Positions.
                    </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Error Loading CVs</h2>
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{error}</p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (cvs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Published CVs</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Review Candidate CVs published for active Positions.
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-12 text-center">
                    <Users className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Published CVs available</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                        Published Candidate CVs for active Positions will appear here.
                    </p>
                </div>
            </div>
        );
    }

    if (filteredCVs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Published CVs</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Review Candidate CVs published for active Positions.
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                aria-label="Search Published CVs"
                                placeholder="Search by Candidate, Position, company, or location..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {cvs.length} CV{cvs.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
                        <Search className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No matching CVs found</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-400">Try a different search term.</p>
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                        >
                            Clear Search
                        </button>
                    </div>
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
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Published CVs</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Review Candidate CVs published for active Positions.
                        </p>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {cvs.length} CV{cvs.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Search Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="relative max-w-md">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        aria-label="Search Published CVs"
                        placeholder="Search by Candidate, Position, company, or location..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Page-level Toolbar */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        {selectedCV ? (
                            <span>
                                Selected: <span className="font-medium text-slate-900 dark:text-white">
                                    {getCandidateName(selectedCV)}
                                </span>{" "}
                                — <span className="text-slate-900 dark:text-white">
                                    {selectedCV.position?.title || "Untitled Position"}
                                </span>
                            </span>
                        ) : (
                            <span>Select a CV to view it.</span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={handleLikeToggle}
                            disabled={!selectedCV || likeUpdating}
                            aria-pressed={Boolean(selectedCV?.likedByCurrentUser)}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedCV?.likedByCurrentUser
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 focus:ring-red-500"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 focus:ring-blue-500"
                                } ${(!selectedCV || likeUpdating) ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            {likeUpdating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Heart
                                        className="h-4 w-4"
                                        fill={selectedCV?.likedByCurrentUser ? "currentColor" : "none"}
                                        aria-hidden="true"
                                    />
                                    {selectedCV?.likedByCurrentUser ? "Unlike CV" : "Like CV"}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleViewSelected}
                            disabled={!selectedCV || likeUpdating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            View CV
                        </button>
                    </div>
                </div>
            </div>

            {/* Like Feedback Panels */}
            {likeError && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4 flex items-start gap-3" role="alert">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                    <p className="text-red-700 dark:text-red-400 text-sm">{likeError}</p>
                </div>
            )}
            {likeMessage && !likeError && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-4 flex items-start gap-3" role="status">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden="true" />
                    <p className="text-emerald-700 dark:text-emerald-400 text-sm">{likeMessage}</p>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <th scope="col" className="px-4 py-3 w-10 text-left">
                                    <span className="sr-only">Select</span>
                                </th>
                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                    Candidate
                                </th>
                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                    Position
                                </th>
                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                    Company
                                </th>
                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                    Status
                                </th>
                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                    Likes
                                </th>
                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                    Updated
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredCVs.map((cv) => {
                                const candidateName = getCandidateName(cv);
                                return (
                                    <tr
                                        key={cv.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedCVId === cv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedCVId === cv.id}
                                                onChange={() => handleSelectCV(cv.id)}
                                                aria-label={`Select CV for ${candidateName}`}
                                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 dark:focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/recruiter/cvs/${cv.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:underline"
                                            >
                                                {candidateName}
                                            </Link>
                                            {cv.email && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cv.email}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <BriefcaseBusiness className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                <span className="text-slate-900 dark:text-white">
                                                    {cv.position?.title || "Untitled Position"}
                                                </span>
                                            </div>
                                            {cv.position?.location && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {cv.position.location}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-900 dark:text-white">
                                            {cv.position?.company || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                                Published
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                <Heart
                                                    className={cv.likedByCurrentUser ? "h-4 w-4 text-red-600 dark:text-red-400" : "h-4 w-4"}
                                                    fill={cv.likedByCurrentUser ? "currentColor" : "none"}
                                                    aria-hidden="true"
                                                />
                                                {cv._count?.likes ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {formatDate(cv.updatedAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RecruiterCVs;