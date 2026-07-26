// client/src/pages/candidate/projects/CreateProject.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    X,
    AlertCircle,
    Info,
    CalendarDays,
    Tags,
    Search,
    Check,
} from "lucide-react";
import api from "../../../api/axios";

// --- Helpers ---

const MAX_TAGS = 15;
const MAX_TAG_LENGTH = 50;

const normalizeTagName = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim().replace(/\s+/g, " ");
};

const getNormalizedTagKey = (value) => {
    return normalizeTagName(value).toLowerCase();
};

const isValidDateOnly = (value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const CreateProject = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        isOngoing: false,
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [tagSearch, setTagSearch] = useState("");
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [tagLoading, setTagLoading] = useState(false);
    const [tagError, setTagError] = useState("");
    const [tagInputFocused, setTagInputFocused] = useState(false);
    const tagInputRef = useRef(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    // --- Tag Search Change Handler ---

    const handleTagSearchChange = (event) => {
        const nextValue = event.target.value;
        const normalizedValue = normalizeTagName(nextValue);

        setTagSearch(nextValue);
        setTagSuggestions([]);
        setTagLoading(false);

        if (normalizedValue.length > MAX_TAG_LENGTH) {
            setTagError("Tag search cannot exceed 50 characters.");
            return;
        }

        setTagError("");
    };

    // --- Tag Autocomplete ---

    useEffect(() => {
        const normalizedSearch = normalizeTagName(tagSearch);

        if (!normalizedSearch || normalizedSearch.length > MAX_TAG_LENGTH) {
            return undefined;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                setTagLoading(true);
                setTagError("");

                const response = await api.get("/tags", {
                    params: {
                        search: normalizedSearch,
                        limit: 10,
                    },
                    signal: controller.signal,
                });

                const data = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                const selectedKeys = new Set(selectedTags.map(getNormalizedTagKey));

                setTagSuggestions(
                    data.filter((tag) => !selectedKeys.has(tag.normalizedName))
                );
            } catch (requestError) {
                if (
                    requestError.name === "CanceledError" ||
                    requestError.code === "ERR_CANCELED"
                ) {
                    return;
                }
                setTagSuggestions([]);
                setTagError(
                    requestError.response?.data?.message ||
                    "Failed to load Tag suggestions."
                );
                console.error("Failed to load Project Tag suggestions:", requestError.message);
            } finally {
                if (!controller.signal.aborted) {
                    setTagLoading(false);
                }
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [tagSearch, selectedTags]);

    // --- Tag Handlers ---

    const addTag = (value) => {
        const normalizedTag = normalizeTagName(value);

        if (!normalizedTag) {
            setTagError("Technology Tag cannot be empty.");
            return;
        }

        if (normalizedTag.length > MAX_TAG_LENGTH) {
            setTagError("Technology Tags cannot exceed 50 characters.");
            return;
        }

        const normalizedKey = getNormalizedTagKey(normalizedTag);
        const duplicate = selectedTags.some(
            (tag) => getNormalizedTagKey(tag) === normalizedKey
        );

        if (duplicate) {
            setTagError("This Technology Tag is already selected.");
            return;
        }

        if (selectedTags.length >= MAX_TAGS) {
            setTagError("A Project cannot contain more than 15 tags.");
            return;
        }

        setSelectedTags((previous) => [...previous, normalizedTag]);
        setTagSearch("");
        setTagSuggestions([]);
        setTagError("");

        window.requestAnimationFrame(() => {
            tagInputRef.current?.focus();
        });
    };

    const removeTag = (tagToRemove) => {
        const keyToRemove = getNormalizedTagKey(tagToRemove);
        setSelectedTags((previous) =>
            previous.filter((tag) => getNormalizedTagKey(tag) !== keyToRemove)
        );
        setTagError("");
    };

    const handleTagKeyDown = (event) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            if (tagSearch.trim()) {
                addTag(tagSearch);
            }
            return;
        }

        if (event.key === "Backspace" && !tagSearch && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }

        if (event.key === "Escape") {
            setTagSuggestions([]);
            setTagInputFocused(false);
        }
    };

    // --- Form Handlers ---

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (validationErrors[name]) {
            setValidationErrors((previous) => ({
                ...previous,
                [name]: "",
            }));
        }

        if (error) {
            setError("");
        }
    };

    const handleOngoingChange = (event) => {
        const checked = event.target.checked;

        setFormData((previous) => ({
            ...previous,
            isOngoing: checked,
            endDate: checked ? "" : previous.endDate,
        }));

        setValidationErrors((previous) => ({
            ...previous,
            endDate: "",
            isOngoing: "",
        }));

        setError("");
    };

    const validateForm = () => {
        const errors = {};

        if (typeof formData.title !== "string" || !formData.title.trim()) {
            errors.title = "Project title is required.";
        }

        if (formData.startDate && !isValidDateOnly(formData.startDate)) {
            errors.startDate = "Enter a valid Project start date.";
        }

        if (formData.endDate && !isValidDateOnly(formData.endDate)) {
            errors.endDate = "Enter a valid Project end date.";
        }

        if (
            !formData.isOngoing &&
            formData.startDate &&
            formData.endDate &&
            new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()
        ) {
            errors.endDate = "Project end date cannot be earlier than the start date.";
        }

        const normalizedTags = selectedTags.map(normalizeTagName);
        if (normalizedTags.length > MAX_TAGS) {
            errors.tags = "A Project cannot contain more than 15 tags.";
        } else if (normalizedTags.some((tag) => !tag)) {
            errors.tags = "Review the selected Technology Tags.";
        } else if (normalizedTags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
            errors.tags = "Technology Tags cannot exceed 50 characters.";
        } else {
            const normalizedTagKeys = normalizedTags.map(getNormalizedTagKey);
            if (new Set(normalizedTagKeys).size !== normalizedTagKeys.length) {
                errors.tags = "Review the selected Technology Tags.";
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                startDate: formData.startDate || null,
                endDate: formData.isOngoing ? null : formData.endDate || null,
                isOngoing: formData.isOngoing,
                tags: selectedTags,
            };

            await api.post("/projects", payload);
            navigate("/projects");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to create project. Please try again."
            );
            console.error("Failed to create Project:", requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (submitting) return;
        navigate("/projects");
    };

    // --- Derived values for tag dropdown ---

    const normalizedTagSearch = normalizeTagName(tagSearch);
    const tagSearchKey = getNormalizedTagKey(normalizedTagSearch);
    const tagSearchAlreadySelected = selectedTags.some(
        (tag) => getNormalizedTagKey(tag) === tagSearchKey
    );
    const exactSuggestionExists = tagSuggestions.some(
        (tag) => tag.normalizedName === tagSearchKey
    );
    const canAddCustomTag =
        Boolean(normalizedTagSearch) &&
        normalizedTagSearch.length <= MAX_TAG_LENGTH &&
        !tagSearchAlreadySelected &&
        !exactSuggestionExists &&
        selectedTags.length < MAX_TAGS;

    const showTagDropdown =
        tagInputFocused &&
        Boolean(
            normalizedTagSearch || tagLoading || tagSuggestions.length > 0 || tagError
        );

    // --- Render ---

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/projects"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Projects
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Create Project
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Add a Project to your reusable Profile for generated CVs.
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                {/* API Error */}
                {error && (
                    <div
                        className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            disabled={submitting}
                            placeholder="Example: E-Commerce Platform"
                            aria-invalid={Boolean(validationErrors.title)}
                            aria-describedby={validationErrors.title ? "title-error" : undefined}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {validationErrors.title && (
                            <p id="title-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                                {validationErrors.title}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Description{" "}
                            <span className="text-slate-400 dark:text-slate-500 text-xs font-normal ml-1">
                                (Optional)
                            </span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={7}
                            value={formData.description}
                            onChange={handleChange}
                            disabled={submitting}
                            placeholder="Describe the Project, your role, and the technologies used..."
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                        />
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            Markdown source text is supported. Rich rendering will be added in the Project details phase.
                        </p>
                    </div>

                    {/* Project Period */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                                Project Period
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="startDate"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                                >
                                    Start Date{" "}
                                    <span className="text-slate-400 dark:text-slate-500 text-xs font-normal ml-1">
                                        (Optional)
                                    </span>
                                </label>
                                <input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    aria-invalid={Boolean(validationErrors.startDate)}
                                    aria-describedby={validationErrors.startDate ? "startDate-error" : undefined}
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {validationErrors.startDate && (
                                    <p id="startDate-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.startDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="endDate"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                                >
                                    End Date{" "}
                                    <span className="text-slate-400 dark:text-slate-500 text-xs font-normal ml-1">
                                        (Optional)
                                    </span>
                                </label>
                                <input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    disabled={submitting || formData.isOngoing}
                                    aria-invalid={Boolean(validationErrors.endDate)}
                                    aria-describedby={validationErrors.endDate ? "endDate-error" : undefined}
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {formData.isOngoing && (
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        End Date is not required for an ongoing Project.
                                    </p>
                                )}
                                {validationErrors.endDate && (
                                    <p id="endDate-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.endDate}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="isOngoing"
                                name="isOngoing"
                                type="checkbox"
                                checked={formData.isOngoing}
                                onChange={handleOngoingChange}
                                disabled={submitting}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label
                                htmlFor="isOngoing"
                                className="text-sm text-slate-700 dark:text-slate-300 select-none"
                            >
                                Ongoing Project
                            </label>
                        </div>
                    </div>

                    {/* Technology Tags */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                                Technology Tags
                            </h3>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                                (Max {MAX_TAGS})
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedTags.map((tag, index) => (
                                <div
                                    key={`${tag}-${index}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-100 dark:border-blue-800/50"
                                >
                                    <span>{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        disabled={submitting}
                                        aria-label={`Remove ${tag}`}
                                        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <input
                                    ref={tagInputRef}
                                    type="text"
                                    value={tagSearch}
                                    onChange={handleTagSearchChange}
                                    onFocus={() => setTagInputFocused(true)}
                                    onBlur={() => {
                                        setTimeout(() => setTagInputFocused(false), 200);
                                    }}
                                    onKeyDown={handleTagKeyDown}
                                    disabled={submitting || selectedTags.length >= MAX_TAGS}
                                    placeholder={
                                        selectedTags.length >= MAX_TAGS
                                            ? "Maximum tags reached"
                                            : "Search or add a Technology Tag..."
                                    }
                                    aria-label="Technology Tags"
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {selectedTags.length >= MAX_TAGS && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Check className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                    </div>
                                )}
                            </div>

                            {tagError && (
                                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                                    {tagError}
                                </p>
                            )}

                            {validationErrors.tags && (
                                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                                    {validationErrors.tags}
                                </p>
                            )}

                            {showTagDropdown && (
                                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
                                    {tagLoading && (
                                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-r-transparent" />
                                            Searching Tags...
                                        </div>
                                    )}

                                    {!tagLoading && tagError && (
                                        <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                            {tagError}
                                        </div>
                                    )}

                                    {!tagLoading && !tagError && tagSuggestions.length > 0 && (
                                        <ul className="py-1" role="listbox">
                                            {tagSuggestions.map((tag) => (
                                                <li key={tag.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => addTag(tag.name)}
                                                        disabled={submitting}
                                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-900 dark:text-slate-200 font-medium">
                                                                {tag.name}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                Used by {tag.usageCount} Project{tag.usageCount !== 1 ? "s" : ""}
                                                            </span>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {!tagLoading && !tagError && canAddCustomTag && (
                                        <button
                                            type="button"
                                            onClick={() => addTag(tagSearch)}
                                            disabled={submitting}
                                            className="w-full text-left px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add "{normalizedTagSearch}"
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Add up to {MAX_TAGS} reusable Technology Tags. Press Enter or comma to add a Tag.
                        </p>
                    </div>

                    {/* Info Panel */}
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Reusable Project Profile
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Project periods and Technology Tags help match relevant Projects to generated CVs.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={submitting}
                            className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5" aria-hidden="true" />
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProject;