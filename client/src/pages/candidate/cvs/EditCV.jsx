import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    AlertCircle,
    RefreshCw,
    Save,
    X,
    CheckCircle2,
    Clock,
    FolderKanban,
    Info,
    ListChecks
} from "lucide-react";
import api from "../../../api/axios";

const isValidEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
};

const normalizeOptionalValue = (value) => {
    if (typeof value !== "string" || value.trim() === "") {
        return null;
    }
    return value.trim();
};

const isMissingValue = (value) => {
    return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    );
};

const isAttributeMissing = (attribute) => {
    if (typeof attribute?.isMissing === "boolean") {
        return attribute.isMissing;
    }
    return isMissingValue(attribute?.value);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};

const formatStatus = (status) => {
    if (status === "PUBLISHED") return "Published";
    if (status === "DRAFT") return "Draft";
    return "Unknown";
};

const formatAttributeValueForDisplay = (attribute) => {
    if (isAttributeMissing(attribute)) {
        return (
            <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Missing information
            </span>
        );
    }

    if (attribute?.type === "BOOLEAN") {
        const isTrue = attribute.value === true || attribute.value === "true";
        return (
            <span className="text-slate-900 dark:text-white">
                {isTrue ? "Yes" : "No"}
            </span>
        );
    }

    return (
        <span className="break-words text-slate-900 dark:text-white">
            {String(attribute?.value)}
        </span>
    );
};

const EditCV = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cv, setCv] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        summary: "",
        skills: "",
        education: "",
        experience: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        api
            .get(`/cvs/${id}`)
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                if (!data) {
                    setCv(null);
                    setError("CV not found.");
                    return;
                }

                setCv(data);
                setFormData({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    summary: data.summary || "",
                    skills: data.skills || "",
                    education: data.education || "",
                    experience: data.experience || ""
                });
                setValidationErrors({});
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;
                setCv(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load CV details. Please try again."
                );
                console.error("Failed to load CV details for editing:", requestError.message);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id, retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((previous) => previous + 1);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (validationErrors[name]) {
            setValidationErrors((previous) => ({
                ...previous,
                [name]: ""
            }));
        }

        if (error) {
            setError("");
        }
    };

    const validateForm = () => {
        const errors = {};

        if (typeof formData.fullName !== "string" || !formData.fullName.trim()) {
            errors.fullName = "Full name is required.";
        }

        if (typeof formData.email !== "string" || !formData.email.trim()) {
            errors.email = "Email is required.";
        } else if (!isValidEmail(formData.email.trim())) {
            errors.email = "Enter a valid email address.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!cv) {
            setError("CV data is unavailable.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: normalizeOptionalValue(formData.phone),
                summary: normalizeOptionalValue(formData.summary),
                skills: normalizeOptionalValue(formData.skills),
                education: normalizeOptionalValue(formData.education),
                experience: normalizeOptionalValue(formData.experience)
            };

            const response = await api.patch(`/cvs/${id}`, payload);
            const updatedCV = response.data?.data;

            if (!updatedCV) {
                throw new Error("CV update returned no data.");
            }

            navigate(`/cvs/${id}`);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to update CV. Please try again."
            );
            console.error("Failed to update CV:", requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (saving) return;
        navigate(`/cvs/${id}`);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[320px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span className="text-sm font-medium">Loading CV...</span>
                </div>
            </div>
        );
    }

    // Load error state
    if (error && !cv) {
        return (
            <div className="space-y-6" role="alert">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Link
                        to="/my-cvs"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My CVs
                    </Link>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit CV</h2>
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

    // Not found state
    if (!cv) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Link
                        to="/my-cvs"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My CVs
                    </Link>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">CV not found</h2>
                    <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">
                        The CV you are looking for does not exist or you do not have permission to edit it.
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const attributes = Array.isArray(cv.attributes) ? cv.attributes : [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Link
                    to={`/cvs/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to CV Details
                </Link>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit CV</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Update the current CV compatibility fields and manage shared Profile information.
                </p>
            </div>

            {/* CV Metadata Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Position</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-white">
                        {cv.position?.title || "No position assigned"}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</div>
                    <div className="mt-1 flex items-center gap-2">
                        {cv.status === "PUBLISHED" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                        ) : (
                            <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        )}
                        <span className="font-medium text-slate-900 dark:text-white">
                            {formatStatus(cv.status)}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Created</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(cv.createdAt)}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Updated</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(cv.updatedAt)}
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                {error && cv && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium flex items-start gap-2" role="alert">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                disabled={saving}
                                aria-invalid={Boolean(validationErrors.fullName)}
                                aria-describedby={validationErrors.fullName ? "fullName-error" : undefined}
                                placeholder="e.g. John Doe"
                                className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            />
                            {validationErrors.fullName && (
                                <p id="fullName-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                                    {validationErrors.fullName}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={saving}
                                aria-invalid={Boolean(validationErrors.email)}
                                aria-describedby={validationErrors.email ? "email-error" : undefined}
                                placeholder="e.g. john@example.com"
                                className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            />
                            {validationErrors.email && (
                                <p id="email-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                        These are current compatibility fields. Candidate Profile data remains the preferred master source.
                    </div>

                    {/* Optional Fields */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Phone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="e.g. +880 1234567890"
                            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Professional Summary
                        </label>
                        <textarea
                            id="summary"
                            name="summary"
                            rows={4}
                            value={formData.summary}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Briefly describe your professional background and key strengths..."
                            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 resize-y"
                        />
                    </div>

                    <div>
                        <label htmlFor="skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Skills
                        </label>
                        <textarea
                            id="skills"
                            name="skills"
                            rows={3}
                            value={formData.skills}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="e.g. React, Node.js, PostgreSQL, Tailwind CSS"
                            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 resize-y"
                        />
                    </div>

                    <div>
                        <label htmlFor="education" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Education
                        </label>
                        <textarea
                            id="education"
                            name="education"
                            rows={3}
                            value={formData.education}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="e.g. B.Sc. in Computer Science, University of Dhaka, 2020-2024"
                            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 resize-y"
                        />
                    </div>

                    <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Work Experience
                        </label>
                        <textarea
                            id="experience"
                            name="experience"
                            rows={4}
                            value={formData.experience}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="e.g. Senior Frontend Developer, Google (2022-Present) ..."
                            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 resize-y"
                        />
                    </div>

                    {/* Status Information Panel */}
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" />
                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Status and Publishing</h4>
                                <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                                    Status updates are managed from CV Details. Publishing requires all Position Attributes to be complete.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        >
                            <Save className="h-4 w-4" aria-hidden="true" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Position Attributes Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ListChecks
                        className="h-5 w-5 text-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Position Attributes
                    </h2>
                </div>

                {attributes.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        No position-specific Attributes are required.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                        Attribute
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                        Value
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                        Profile Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {attributes.map((attribute) => (
                                    <tr key={attribute.positionAttributeId}>
                                        <td className="py-3 px-4 text-slate-900 dark:text-white">
                                            {attribute.name || "Unnamed Attribute"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {formatAttributeValueForDisplay(attribute)}
                                        </td>
                                        <td className="py-3 px-4">
                                            {attribute.userAttributeId ? (
                                                <Link
                                                    to={`/profile/attributes/edit/${attribute.userAttributeId}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:underline"
                                                >
                                                    Edit Profile Value
                                                </Link>
                                            ) : (
                                                <Link
                                                    to="/profile/attributes"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:underline"
                                                >
                                                    Open Profile Attributes
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Projects Panel */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FolderKanban className="h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Projects</h2>
                    </div>
                    <Info className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-1" aria-hidden="true" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Projects are loaded dynamically from your Profile. Edit Projects from the Projects section.
                </p>
                <Link
                    to="/projects"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mt-3 transition-colors focus:outline-none focus:underline"
                >
                    Manage Profile Projects
                </Link>
            </div>
        </div>
    );
};

export default EditCV;