import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import {
    Search,
    SearchX,
    BriefcaseBusiness,
    ListChecks,
    FolderKanban,
    FileText,
    MessageSquare,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const SearchResults = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    const role = user?.role?.toLowerCase() || "";

    const searchTypes = [
        { value: "all", label: "All" },
        { value: "positions", label: "Positions" },
        { value: "attributes", label: "Attributes" },
        { value: "projects", label: "Projects" },
        { value: "cvs", label: "CVs" },
        { value: "discussions", label: "Discussions" },
    ];

    const getPageNumber = (value) => {
        const parsedValue = Number(value);
        if (!Number.isInteger(parsedValue) || parsedValue < 1) {
            return 1;
        }
        return parsedValue;
    };

    const query = searchParams.get("q")?.trim() || "";
    const requestedType = searchParams.get("type")?.toLowerCase() || "all";
    const activeType = searchTypes.some((t) => t.value === requestedType)
        ? requestedType
        : "all";
    const page = getPageNumber(searchParams.get("page"));

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

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const getPositionPath = (positionId) => {
        if (role === "candidate") {
            return `/candidate/positions/${positionId}`;
        }
        if (role === "recruiter" || role === "admin") {
            return `/positions/${positionId}`;
        }
        return null;
    };

    const getAttributePath = (attributeId) => {
        if (role === "recruiter" || role === "admin") {
            return `/attributes/${attributeId}`;
        }
        return null;
    };

    const getProjectPath = (projectId) => {
        if (role === "candidate" || role === "admin") {
            return `/projects/${projectId}`;
        }
        return null;
    };

    const getCVPath = (cvId) => {
        if (role === "candidate" || role === "admin") {
            return `/generated-cv/${cvId}`;
        }
        return null;
    };

    const getDiscussionPath = (discussionId) => {
        return `/discussions/${discussionId}`;
    };

    useEffect(() => {
        let cancelled = false;

        if (query.length < 2) {
            return () => {
                cancelled = true;
            };
        }

        api
            .get("/search", {
                params: {
                    q: query,
                    type: activeType,
                    page,
                    limit: 10,
                },
            })
            .then((response) => {
                if (cancelled) return;
                const nextSearchData = response.data?.data;
                if (!nextSearchData) {
                    setSearchData(null);
                    setError("Search returned an invalid response.");
                    return;
                }
                setSearchData(nextSearchData);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;
                setSearchData(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load search results. Please try again."
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
    }, [query, activeType, page, retryCounter]);

    const handleTypeChange = (nextType) => {
        if (query.length < 2 || nextType === activeType) {
            return;
        }
        setLoading(true);
        setError("");
        setSearchParams({
            q: query,
            type: nextType,
            page: "1",
        });
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage === page) {
            return;
        }
        setLoading(true);
        setError("");
        setSearchParams({
            q: query,
            type: activeType,
            page: String(nextPage),
        });
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((prev) => prev + 1);
    };

    const renderPositionLink = (position) => {
        const path = getPositionPath(position.id);
        if (path) {
            return (
                <Link
                    to={path}
                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                    {position.title || "N/A"}
                </Link>
            );
        }
        return (
            <span className="text-slate-900 dark:text-white">
                {position.title || "N/A"}
            </span>
        );
    };

    const renderAttributeLink = (attribute) => {
        const path = getAttributePath(attribute.id);
        if (path) {
            return (
                <Link
                    to={path}
                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                    {attribute.name || "N/A"}
                </Link>
            );
        }
        return (
            <span className="text-slate-900 dark:text-white">
                {attribute.name || "N/A"}
            </span>
        );
    };

    const renderProjectLink = (project) => {
        const path = getProjectPath(project.id);
        if (path) {
            return (
                <Link
                    to={path}
                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                    {project.title || "N/A"}
                </Link>
            );
        }
        return (
            <span className="text-slate-900 dark:text-white">
                {project.title || "N/A"}
            </span>
        );
    };

    const renderCVLink = (cv) => {
        const path = getCVPath(cv.id);
        if (path) {
            return (
                <Link
                    to={path}
                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                    {cv.fullName || "N/A"}
                </Link>
            );
        }
        return (
            <span className="text-slate-900 dark:text-white">
                {cv.fullName || "N/A"}
            </span>
        );
    };

    const renderDiscussionLink = (discussion) => {
        return (
            <Link
                to={getDiscussionPath(discussion.id)}
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
                {discussion.content
                    ? discussion.content.substring(0, 60) +
                    (discussion.content.length > 60 ? "..." : "")
                    : "N/A"}
            </Link>
        );
    };

    const renderStatus = (isActive) => {
        if (isActive === true) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Active
                </span>
            );
        }
        if (isActive === false) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Inactive
                </span>
            );
        }
        return <span className="text-slate-500 dark:text-slate-400">N/A</span>;
    };

    const renderCVStatus = (status) => {
        if (!status) return "N/A";
        const formatted = status.charAt(0) + status.slice(1).toLowerCase();
        if (status === "PUBLISHED") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {formatted}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                {formatted}
            </span>
        );
    };

    const getAuthorFullName = (discussion) => {
        const firstName = discussion.authorFirstName || "";
        const lastName = discussion.authorLastName || "";
        if (firstName || lastName) {
            return `${firstName} ${lastName}`.trim();
        }
        return "Unknown author";
    };

    const renderTableSection = ({ title, icon: Icon, data, columns, keyField }) => {
        if (!data || data.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                        {data.length} result{data.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {data.map((row) => (
                                <tr
                                    key={row[keyField]}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {col.render ? col.render(row) : row[col.field] ?? "N/A"}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCategoryEmptyState = (label, Icon) => {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
                <p className="text-slate-600 dark:text-slate-400">
                    No matching {label.toLowerCase()} were found.
                </p>
            </div>
        );
    };

    if (query.length < 2) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Results</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Search across the CV Management System.
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                    <Search className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">Enter a search query</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Type at least 2 characters in the header search box to search positions, attributes, projects, CVs, and discussions.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Results</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Results for “{query}”</p>
                </div>
                <div className="flex min-h-80 items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Searching...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Results</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Results for “{query}”</p>
                </div>
                <div
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"
                    role="alert"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-700 dark:text-red-400">Error loading search results</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error}</p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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

    if (!searchData) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Results</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Results for “{query}”</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                    <SearchX className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">No results found</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">No matching records were found for “{query}”.</p>
                </div>
            </div>
        );
    }

    const { counts, results, limit } = searchData;
    const totalReturned = counts?.totalReturned || 0;

    const positionColumns = [
        {
            key: "title",
            label: "Title",
            render: (row) => renderPositionLink(row),
        },
        { key: "company", label: "Company", field: "company" },
        { key: "department", label: "Department", field: "department" },
        { key: "location", label: "Location", field: "location" },
        {
            key: "status",
            label: "Status",
            render: (row) => renderStatus(row.isActive),
        },
        {
            key: "updatedAt",
            label: "Updated",
            render: (row) => formatDate(row.updatedAt),
        },
    ];

    const attributeColumns = [
        {
            key: "name",
            label: "Name",
            render: (row) => renderAttributeLink(row),
        },
        { key: "category", label: "Category", field: "category" },
        {
            key: "type",
            label: "Type",
            render: (row) => formatAttributeType(row.type),
        },
        {
            key: "updatedAt",
            label: "Updated",
            render: (row) => formatDate(row.updatedAt),
        },
    ];

    const projectColumns = [
        {
            key: "title",
            label: "Title",
            render: (row) => renderProjectLink(row),
        },
        {
            key: "description",
            label: "Description",
            render: (row) => (
                <span className="line-clamp-2">{row.description || "N/A"}</span>
            ),
        },
        {
            key: "updatedAt",
            label: "Updated",
            render: (row) => formatDate(row.updatedAt),
        },
    ];

    const cvColumns = [
        {
            key: "candidate",
            label: "Candidate",
            render: (row) => renderCVLink(row),
        },
        { key: "position", label: "Position", field: "positionTitle" },
        {
            key: "status",
            label: "Status",
            render: (row) => renderCVStatus(row.status),
        },
        {
            key: "skills",
            label: "Skills",
            render: (row) => (
                <span className="line-clamp-1">{row.skills || "N/A"}</span>
            ),
        },
        {
            key: "updatedAt",
            label: "Updated",
            render: (row) => formatDate(row.updatedAt),
        },
    ];

    const discussionColumns = [
        {
            key: "content",
            label: "Content",
            render: (row) => renderDiscussionLink(row),
        },
        {
            key: "author",
            label: "Author",
            render: (row) => getAuthorFullName(row),
        },
        { key: "position", label: "Position", field: "positionTitle" },
        {
            key: "updatedAt",
            label: "Updated",
            render: (row) => formatDate(row.updatedAt),
        },
    ];

    const hasPositions = results.positions && results.positions.length > 0;
    const hasAttributes = results.attributes && results.attributes.length > 0;
    const hasProjects = results.projects && results.projects.length > 0;
    const hasCVs = results.cvs && results.cvs.length > 0;
    const hasDiscussions = results.discussions && results.discussions.length > 0;

    const hasAnyResults =
        hasPositions || hasAttributes || hasProjects || hasCVs || hasDiscussions;

    const shouldShowNext =
        activeType === "all"
            ? (hasPositions && results.positions.length === limit) ||
            (hasAttributes && results.attributes.length === limit) ||
            (hasProjects && results.projects.length === limit) ||
            (hasCVs && results.cvs.length === limit) ||
            (hasDiscussions && results.discussions.length === limit)
            : results[activeType]?.length === limit;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Results</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Results for “{query}”</p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap gap-2">
                {searchTypes.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeChange(type.value)}
                        disabled={activeType === type.value}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default ${activeType === type.value
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Counts Summary */}
            {hasAnyResults && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 text-sm">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                            Returned this page:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                            Total: <span className="font-medium text-slate-900 dark:text-white">{totalReturned}</span>
                        </span>
                        {counts.positions > 0 && (
                            <span className="text-slate-600 dark:text-slate-400">
                                Positions: <span className="font-medium text-slate-900 dark:text-white">{counts.positions}</span>
                            </span>
                        )}
                        {counts.attributes > 0 && (
                            <span className="text-slate-600 dark:text-slate-400">
                                Attributes: <span className="font-medium text-slate-900 dark:text-white">{counts.attributes}</span>
                            </span>
                        )}
                        {counts.projects > 0 && (
                            <span className="text-slate-600 dark:text-slate-400">
                                Projects: <span className="font-medium text-slate-900 dark:text-white">{counts.projects}</span>
                            </span>
                        )}
                        {counts.cvs > 0 && (
                            <span className="text-slate-600 dark:text-slate-400">
                                CVs: <span className="font-medium text-slate-900 dark:text-white">{counts.cvs}</span>
                            </span>
                        )}
                        {counts.discussions > 0 && (
                            <span className="text-slate-600 dark:text-slate-400">
                                Discussions: <span className="font-medium text-slate-900 dark:text-white">{counts.discussions}</span>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Global Empty State - only for type=all */}
            {activeType === "all" && !hasAnyResults && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                    <SearchX className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">No results found</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">No matching records were found for “{query}”.</p>
                </div>
            )}

            {/* Category Tables */}
            {activeType === "all" ? (
                <>
                    {hasPositions &&
                        renderTableSection({
                            title: "Positions",
                            icon: BriefcaseBusiness,
                            data: results.positions,
                            columns: positionColumns,
                            keyField: "id",
                        })}
                    {hasAttributes &&
                        renderTableSection({
                            title: "Attributes",
                            icon: ListChecks,
                            data: results.attributes,
                            columns: attributeColumns,
                            keyField: "id",
                        })}
                    {hasProjects &&
                        renderTableSection({
                            title: "Projects",
                            icon: FolderKanban,
                            data: results.projects,
                            columns: projectColumns,
                            keyField: "id",
                        })}
                    {hasCVs &&
                        renderTableSection({
                            title: "CVs",
                            icon: FileText,
                            data: results.cvs,
                            columns: cvColumns,
                            keyField: "id",
                        })}
                    {hasDiscussions &&
                        renderTableSection({
                            title: "Discussions",
                            icon: MessageSquare,
                            data: results.discussions,
                            columns: discussionColumns,
                            keyField: "id",
                        })}
                </>
            ) : (
                <>
                    {activeType === "positions" &&
                        (hasPositions ? (
                            renderTableSection({
                                title: "Positions",
                                icon: BriefcaseBusiness,
                                data: results.positions,
                                columns: positionColumns,
                                keyField: "id",
                            })
                        ) : (
                            renderCategoryEmptyState("positions", BriefcaseBusiness)
                        ))}
                    {activeType === "attributes" &&
                        (hasAttributes ? (
                            renderTableSection({
                                title: "Attributes",
                                icon: ListChecks,
                                data: results.attributes,
                                columns: attributeColumns,
                                keyField: "id",
                            })
                        ) : (
                            renderCategoryEmptyState("attributes", ListChecks)
                        ))}
                    {activeType === "projects" &&
                        (hasProjects ? (
                            renderTableSection({
                                title: "Projects",
                                icon: FolderKanban,
                                data: results.projects,
                                columns: projectColumns,
                                keyField: "id",
                            })
                        ) : (
                            renderCategoryEmptyState("projects", FolderKanban)
                        ))}
                    {activeType === "cvs" &&
                        (hasCVs ? (
                            renderTableSection({
                                title: "CVs",
                                icon: FileText,
                                data: results.cvs,
                                columns: cvColumns,
                                keyField: "id",
                            })
                        ) : (
                            renderCategoryEmptyState("cvs", FileText)
                        ))}
                    {activeType === "discussions" &&
                        (hasDiscussions ? (
                            renderTableSection({
                                title: "Discussions",
                                icon: MessageSquare,
                                data: results.discussions,
                                columns: discussionColumns,
                                keyField: "id",
                            })
                        ) : (
                            renderCategoryEmptyState("discussions", MessageSquare)
                        ))}
                </>
            )}

            {/* Pagination - always show when page > 1 or there are results */}
            {(hasAnyResults || page > 1) && (
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        Previous
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {page}
                    </span>
                    <button
                        type="button"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!shouldShowNext}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchResults;