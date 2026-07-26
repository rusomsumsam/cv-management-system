import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, RefreshCw } from "lucide-react";
import api from "../../../api/axios";

// Safe date formatter that extracts YYYY-MM-DD without creating a Date
const formatDateForInput = (value) => {
    if (typeof value !== "string" || !value.trim()) {
        return "";
    }

    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
};

const EditPosition = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        company: "",
        location: "",
        department: "",
        deadline: "",
        description: "",
        isActive: true,
        maxProjects: 4,
        version: 1,
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagLoading, setTagLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [conflictError, setConflictError] = useState(false);

    const abortControllerRef = useRef(null);
    const inputRef = useRef(null);

    const loadPosition = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError("");
        setConflictError(false);

        try {
            const response = await api.get(`/positions/${id}`);
            const data = response.data?.data;

            if (!data || typeof data !== "object") {
                throw new Error("Position response is invalid.");
            }

            // Extract existing tags
            const existingTags = (data.positionTags || [])
                .map((pt) => pt.tag?.name)
                .filter(Boolean);

            setFormData({
                title: data.title || "",
                company: data.company || "",
                location: data.location || "",
                department: data.department || "",
                deadline: formatDateForInput(data.deadline),
                description: data.description || "",
                isActive: data.isActive ?? true,
                maxProjects: data.maxProjects ?? 4,
                version: data.version ?? 1,
            });

            setSelectedTags(existingTags);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load position details."
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPosition(true);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadPosition]);

    // Debounced tag search
    useEffect(() => {
        if (!tagInput.trim()) {
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            setTagLoading(true);

            try {
                const response = await api.get(`/tags?search=${encodeURIComponent(tagInput.trim())}&limit=10`, {
                    signal: controller.signal,
                });

                const data = response.data?.data;
                const suggestions = Array.isArray(data) ? data : [];

                const filteredSuggestions = suggestions.filter(
                    (tag) =>
                        tag &&
                        typeof tag.name === "string" &&
                        tag.name.trim() &&
                        !selectedTags.some(
                            (selected) => selected.toLowerCase() === tag.name.trim().toLowerCase()
                        )
                );
                setTagSuggestions(filteredSuggestions);

                const normalizedInput = tagInput.trim().replace(/\s+/g, " ");
                const hasValidInput = Boolean(normalizedInput) &&
                    normalizedInput.length <= 50 &&
                    selectedTags.length < 15 &&
                    !selectedTags.some(
                        (tag) => tag.toLowerCase() === normalizedInput.toLowerCase()
                    );

                setShowSuggestions(filteredSuggestions.length > 0 || hasValidInput);
            } catch (err) {
                const isCancelled =
                    err.code === "ERR_CANCELED" ||
                    err.name === "CanceledError" ||
                    err.name === "AbortError";

                if (isCancelled) {
                    return;
                }

                console.error("Tag search error:", err.message);

                setTagSuggestions([]);

                const normalizedInput = tagInput.trim().replace(/\s+/g, " ");
                const canAddCustomTag =
                    Boolean(normalizedInput) &&
                    normalizedInput.length <= 50 &&
                    selectedTags.length < 15 &&
                    !selectedTags.some(
                        (tag) => tag.toLowerCase() === normalizedInput.toLowerCase()
                    );

                setShowSuggestions(canAddCustomTag);
            } finally {
                if (abortControllerRef.current === controller) {
                    setTagLoading(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(delayDebounceFn);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [tagInput, selectedTags]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (name === "isActive") {
            // Convert string values from select to boolean
            setFormData((prev) => ({
                ...prev,
                [name]: value === "true",
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
            }));
        }
        setConflictError(false);
        setError("");
    };

    const addTag = (tagName) => {
        const normalizedTag = tagName.trim().replace(/\s+/g, " ");
        if (!normalizedTag) return;

        if (selectedTags.length >= 15) {
            setError("A Position can have at most 15 Technology Tags.");
            return;
        }

        if (normalizedTag.length > 50) {
            setError("Each Technology Tag can contain at most 50 characters.");
            return;
        }

        if (selectedTags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
            setError("That Technology Tag has already been added.");
            return;
        }

        setSelectedTags((prev) => [...prev, normalizedTag]);
        setTagInput("");
        setTagSuggestions([]);
        setShowSuggestions(false);
        setError("");
        inputRef.current?.focus();
    };

    const removeTag = (index) => {
        setSelectedTags((prev) => prev.filter((_, i) => i !== index));
        setError("");
        inputRef.current?.focus();
    };

    const handleTagKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (tagInput.trim()) {
                addTag(tagInput);
            }
        }

        if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
            removeTag(selectedTags.length - 1);
        }

        if (e.key === "Escape") {
            setShowSuggestions(false);
            setTagSuggestions([]);
        }
    };

    const handleTagInputChange = (event) => {
        const value = event.target.value;

        setTagInput(value);
        setError("");

        if (!value.trim()) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            setTagSuggestions([]);
            setShowSuggestions(false);
            setTagLoading(false);
        }
    };

    const handleReload = async () => {
        await loadPosition(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setConflictError(false);

        if (!formData.title.trim()) {
            setError("Position title is required.");
            return;
        }
        if (!formData.company.trim()) {
            setError("Company name is required.");
            return;
        }

        const maxProjectsValue = Number(formData.maxProjects);
        if (!Number.isSafeInteger(maxProjectsValue) || maxProjectsValue < 1 || maxProjectsValue > 10) {
            setError("Maximum Projects must be an integer between 1 and 10.");
            return;
        }

        if (!formData.version || !Number.isSafeInteger(formData.version) || formData.version < 1) {
            setError("Invalid position version. Please reload the page.");
            return;
        }

        setSaving(true);

        try {
            await api.patch(`/positions/${id}`, {
                title: formData.title,
                company: formData.company,
                location: formData.location || null,
                department: formData.department || null,
                deadline: formData.deadline || null,
                description: formData.description || null,
                isActive: formData.isActive,
                maxProjects: maxProjectsValue,
                tags: selectedTags,
                version: formData.version,
            });
            navigate(`/positions/${id}`);
        } catch (err) {
            if (err.response?.status === 409) {
                setConflictError(true);
                setError(
                    err.response?.data?.message ||
                    "This Position was modified by another user. Reload it and try again."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Failed to update position. Please try again."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // Determine if we should show the custom tag action
    const normalizedInput = tagInput.trim().replace(/\s+/g, " ");
    const showCustomTagAction =
        Boolean(normalizedInput) &&
        normalizedInput.length <= 50 &&
        selectedTags.length < 15 &&
        !selectedTags.some((tag) => tag.toLowerCase() === normalizedInput.toLowerCase());

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading position...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    type="button"
                    onClick={() => navigate(`/positions/${id}`)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Position Details
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Edit Position</h1>
                    <p className="text-slate-600 mt-1">Update existing position information.</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    {error && (
                        <div
                            className={`mb-6 p-3 rounded-lg text-sm font-medium ${conflictError
                                    ? "bg-amber-50 border border-amber-200 text-amber-700"
                                    : "bg-red-50 border border-red-200 text-red-600"
                                }`}
                            role="alert"
                        >
                            <div className="flex items-center gap-2">
                                <span>{error}</span>
                                {conflictError && (
                                    <button
                                        type="button"
                                        onClick={handleReload}
                                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md text-xs font-medium transition-colors"
                                    >
                                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                                        Reload Latest Position
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Position Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Senior Frontend Developer"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                        </div>

                        {/* Company */}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Company <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="company"
                                name="company"
                                type="text"
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="e.g. Google"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Location
                            </label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Dhaka, Bangladesh"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Department
                            </label>
                            <input
                                id="department"
                                name="department"
                                type="text"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="e.g. Engineering"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                        </div>

                        {/* Deadline */}
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Deadline
                            </label>
                            <input
                                id="deadline"
                                name="deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows="4"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the position, responsibilities, and requirements..."
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y"
                                disabled={saving}
                            />
                        </div>

                        {/* Max Projects */}
                        <div>
                            <label htmlFor="maxProjects" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Maximum Projects in Generated CV
                            </label>
                            <input
                                id="maxProjects"
                                name="maxProjects"
                                type="number"
                                min="1"
                                max="10"
                                step="1"
                                value={formData.maxProjects}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Maximum number of projects to include in CVs generated for this position (1-10)
                            </p>
                        </div>

                        {/* Technology Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Technology Tags
                            </label>
                            <div className="relative">
                                <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-md bg-white min-h-[42px] focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                    {selectedTags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="text-blue-400 hover:text-blue-600 focus:outline-none"
                                                aria-label={`Remove ${tag} Technology Tag`}
                                            >
                                                <X className="h-3 w-3" aria-hidden="true" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        ref={inputRef}
                                        id="tags"
                                        type="text"
                                        value={tagInput}
                                        onChange={handleTagInputChange}
                                        onKeyDown={handleTagKeyDown}
                                        onFocus={() => {
                                            if (tagSuggestions.length > 0 || showCustomTagAction) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => setShowSuggestions(false), 150);
                                        }}
                                        placeholder={selectedTags.length === 0 ? "Type to search or add tags..." : ""}
                                        className="flex-1 min-w-[120px] border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 p-0"
                                        disabled={saving}
                                    />
                                    {tagLoading && (
                                        <div className="flex items-center text-slate-400 text-xs ml-1">
                                            <span className="animate-pulse">Searching...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Suggestions Dropdown */}
                                {showSuggestions && (tagSuggestions.length > 0 || showCustomTagAction) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {tagSuggestions.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => addTag(tag.name)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                                            >
                                                {tag.name}
                                                <span className="text-slate-400 text-xs ml-2">
                                                    ({tag.usageCount || 0} uses)
                                                </span>
                                            </button>
                                        ))}
                                        {showCustomTagAction && (
                                            <button
                                                type="button"
                                                onClick={() => addTag(tagInput)}
                                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 border-t border-slate-100"
                                            >
                                                Add "{normalizedInput}"
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Press Enter or comma to add. Max 15 tags, 50 characters each.
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="isActive" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Status
                            </label>
                            <select
                                id="isActive"
                                name="isActive"
                                value={formData.isActive}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>

                        {/* Version (hidden, used for optimistic locking) */}
                        <input type="hidden" name="version" value={formData.version} />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/positions/${id}`)}
                                className="px-6 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPosition;