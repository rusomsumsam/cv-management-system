import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    Tag,
    CalendarDays,
    Folder,
    Pencil,
    Trash2,
    AlertCircle,
    RefreshCw,
    Image as ImageIcon,
    Info,
} from "lucide-react";
import api from "../../../api/axios";

const UserAttributes = () => {
    const navigate = useNavigate();

    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUserAttributeId, setSelectedUserAttributeId] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api.get("/user-attributes")
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                setAttributes(Array.isArray(data) ? data : []);
                setSelectedUserAttributeId("");
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setAttributes([]);
                setSelectedUserAttributeId("");
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load attributes. Please try again."
                );
                console.error(
                    "Failed to load User Attributes:",
                    requestError.message
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

    const handleSelectUserAttribute = (userAttributeId) => {
        setSelectedUserAttributeId((currentId) =>
            currentId === userAttributeId ? "" : userAttributeId
        );
        setDeleteError("");
    };

    const selectedUserAttribute =
        attributes.find((item) => item.id === selectedUserAttributeId) || null;

    const handleEditSelected = () => {
        if (!selectedUserAttribute) return;
        navigate(`/profile/attributes/edit/${selectedUserAttribute.id}`);
    };

    const handleOpenDeleteDialog = () => {
        if (!selectedUserAttribute) return;
        setDeleteError("");
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSelected = async () => {
        if (!selectedUserAttribute || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(`/user-attributes/${selectedUserAttribute.id}`);

            setAttributes((currentAttributes) =>
                currentAttributes.filter(
                    (item) => item.id !== selectedUserAttribute.id
                )
            );
            setSelectedUserAttributeId("");
            setIsDeleteDialogOpen(false);
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to remove attribute. Please try again."
            );
            console.error(
                "Failed to delete User Attribute:",
                requestError.message
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

    const formatDateOnly = (value) => {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value || "N/A";
        }

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        if (
            date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day
        ) {
            return value;
        }

        return date.toLocaleDateString("en-US", {
            timeZone: "UTC",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
    };

    const getTypeBadgeClasses = (type) => {
        const baseClasses =
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

        switch (type) {
            case "STRING":
                return `${baseClasses} bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
            case "TEXT":
                return `${baseClasses} bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400`;
            case "NUMERIC":
                return `${baseClasses} bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`;
            case "BOOLEAN":
                return `${baseClasses} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
            case "DATE":
                return `${baseClasses} bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`;
            case "PERIOD":
                return `${baseClasses} bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
            case "DROPDOWN":
                return `${baseClasses} bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400`;
            case "IMAGE":
                return `${baseClasses} bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400`;
            default:
                return `${baseClasses} bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400`;
        }
    };

    const isMissingValue = (value) => {
        return (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.trim() === "")
        );
    };

    const formatAttributeValue = (type, value) => {
        if (isMissingValue(value)) {
            return {
                text: "Missing",
                missing: true,
            };
        }

        if (type === "BOOLEAN") {
            const isTrue = value === true || value === "true";
            return {
                text: isTrue ? "Yes" : "No",
                missing: false,
            };
        }

        if (type === "DATE") {
            return {
                text: formatDateOnly(String(value)),
                missing: false,
            };
        }

        if (type === "IMAGE") {
            return {
                text: "External image",
                missing: false,
            };
        }

        return {
            text: String(value),
            missing: false,
        };
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredAttributes = attributes.filter((item) => {
        if (!normalizedSearchTerm) return true;

        const searchableValue =
            item.value === null || item.value === undefined
                ? ""
                : String(item.value);

        return (
            item.attribute?.name?.toLowerCase().includes(normalizedSearchTerm) ||
            item.attribute?.category?.toLowerCase().includes(normalizedSearchTerm) ||
            item.attribute?.type?.toLowerCase().includes(normalizedSearchTerm) ||
            searchableValue.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading attributes...
                </div>
            </div>
        );
    }

    if (error && attributes.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            My Attributes
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage reusable Profile values used across your generated CVs.
                        </p>
                    </div>
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
                            <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                                Error loading attributes
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {error}
                            </p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                            >
                                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                Retry
                            </button>
                        </div>
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        My Attributes
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage reusable Profile values used across your generated CVs.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {attributes.length === 1
                            ? "1 attribute"
                            : `${attributes.length} attributes`}
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate("/profile/attributes/add")}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add Attribute
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
                        aria-label="Search profile attributes"
                        placeholder="Search by attribute name, category, type, or value..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedUserAttribute ? (
                        <span>
                            Selected:{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {selectedUserAttribute.attribute?.name || "Unnamed Attribute"}
                            </span>
                        </span>
                    ) : (
                        "Select an attribute to manage it."
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEditSelected}
                        disabled={!selectedUserAttribute}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenDeleteDialog}
                        disabled={!selectedUserAttribute}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                    </button>
                </div>
            </div>

            {/* Attributes Table */}
            {attributes.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <Info className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                        No attributes added yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Add attributes from the shared library to complete your reusable Profile.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/profile/attributes/add")}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add Attribute
                    </button>
                </div>
            ) : filteredAttributes.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        No matching attributes found
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Try a different search term.
                    </p>
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
                                        Attribute
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Category
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Type
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Value
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredAttributes.map((item) => {
                                    const isSelected = selectedUserAttributeId === item.id;
                                    const { text, missing } = formatAttributeValue(
                                        item.attribute?.type,
                                        item.value
                                    );

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected
                                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                                    : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select attribute ${item.attribute?.name || "Unnamed Attribute"}`}
                                                    checked={isSelected}
                                                    onChange={() => handleSelectUserAttribute(item.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Tag className="h-4 w-4" aria-hidden="true" />
                                                    </div>
                                                    <Link
                                                        to={`/profile/attributes/${item.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                    >
                                                        {item.attribute?.name || "Unnamed Attribute"}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {item.attribute?.category || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={getTypeBadgeClasses(item.attribute?.type)}>
                                                    {formatAttributeType(item.attribute?.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    {missing ? (
                                                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                                            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                            {text}
                                                        </span>
                                                    ) : item.attribute?.type === "IMAGE" ? (
                                                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                                            {text}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-900 dark:text-white">
                                                            {text}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {formatDate(item.updatedAt)}
                                                </div>
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
            {isDeleteDialogOpen && selectedUserAttribute && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="remove-user-attribute-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <h2
                            id="remove-user-attribute-dialog-title"
                            className="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            Remove Profile Attribute?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            This removes{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                “{selectedUserAttribute.attribute?.name || "Attribute"}”
                            </span>{" "}
                            from your Profile. CVs requiring this Attribute may show it as missing until it is added again.
                        </p>

                        {deleteError && (
                            <div
                                className="mt-3 rounded-md bg-red-50 p-3 dark:bg-red-900/20"
                                role="alert"
                            >
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    {deleteError}
                                </p>
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
                                Remove Attribute
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAttributes;