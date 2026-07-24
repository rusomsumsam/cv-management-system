import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    X,
    AlertCircle,
    RefreshCw,
    Image as ImageIcon,
    Info,
} from "lucide-react";
import api from "../../../api/axios";

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
};

const formatAttributeType = (type) => {
    if (!type) return "N/A";
    return type
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const EditUserAttribute = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [userAttribute, setUserAttribute] = useState(null);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [validationError, setValidationError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [imagePreviewError, setImagePreviewError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api.get(`/user-attributes/${id}`)
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;

                if (!data) {
                    setUserAttribute(null);
                    setError("User attribute not found.");
                    return;
                }

                setUserAttribute(data);

                if (data.attribute?.type === "BOOLEAN") {
                    setValue(data.value === true || data.value === "true");
                } else {
                    setValue(
                        data.value === null || data.value === undefined
                            ? ""
                            : String(data.value)
                    );
                }

                setImagePreviewError(false);
                setValidationError("");
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setUserAttribute(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load attribute value. Please try again."
                );
                console.error(
                    "Failed to load User Attribute:",
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
    }, [id, retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((previous) => previous + 1);
    };

    const attributeType = userAttribute?.attribute?.type;

    const handleValueChange = (event) => {
        const { type, checked, value: inputValue } = event.target;

        setValue(type === "checkbox" ? checked : inputValue);
        setValidationError("");
        setError("");

        if (attributeType === "IMAGE") {
            setImagePreviewError(false);
        }
    };

    const validateValue = () => {
        const type = userAttribute?.attribute?.type;

        if (!type) {
            setValidationError("Attribute type is unavailable.");
            return false;
        }

        const stringValue =
            typeof value === "string" ? value.trim() : String(value);

        if (type !== "BOOLEAN" && stringValue === "") {
            setValidationError("");
            return true;
        }

        switch (type) {
            case "STRING":
                if (stringValue.includes("\n") || stringValue.includes("\r")) {
                    setValidationError("String values must use a single line.");
                    return false;
                }
                break;

            case "NUMERIC": {
                const numericValue = Number(stringValue);
                if (!Number.isFinite(numericValue)) {
                    setValidationError("Enter a valid numeric value.");
                    return false;
                }
                break;
            }

            case "IMAGE":
                if (!isValidHttpUrl(stringValue)) {
                    setValidationError("Enter a valid http or https image URL.");
                    return false;
                }
                break;

            default:
                break;
        }

        setValidationError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateValue()) {
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            let normalizedPayloadValue;

            if (attributeType === "BOOLEAN") {
                normalizedPayloadValue = Boolean(value);
            } else if (typeof value === "string" && value.trim() === "") {
                normalizedPayloadValue = null;
            } else if (typeof value === "string") {
                normalizedPayloadValue = value.trim();
            } else {
                normalizedPayloadValue = value;
            }

            await api.patch(`/user-attributes/${id}`, {
                value: normalizedPayloadValue,
            });

            navigate(`/profile/attributes/${id}`);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to update attribute value. Please try again."
            );
            console.error(
                "Failed to update user attribute:",
                requestError.message
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading attribute value...
                </div>
            </div>
        );
    }

    if (error && !userAttribute) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile/attributes"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Attributes
                    </Link>
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
                                Error loading attribute
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

    if (!userAttribute) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile/attributes"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Attributes
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <Info className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        User attribute not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        We couldn't find this attribute value.
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const formattedType = formatAttributeType(attributeType);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Link
                    to={`/profile/attributes/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Attribute Details
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Edit Attribute Value
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Update the reusable Profile value used by every CV requiring this Attribute.
                    </p>
                </div>
            </div>

            {/* Attribute Metadata Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-900 dark:text-white">
                            {userAttribute.attribute?.name || "N/A"}
                        </span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                        Category: {userAttribute.attribute?.category || "N/A"}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                        Type: {formattedType}
                    </span>
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
                    {/* Value Control */}
                    <div>
                        <label
                            htmlFor="value"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Value
                        </label>

                        {attributeType === "BOOLEAN" ? (
                            <div className="flex items-center gap-3 pt-1">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        id="value"
                                        type="checkbox"
                                        checked={Boolean(value)}
                                        onChange={handleValueChange}
                                        disabled={submitting}
                                        aria-invalid={Boolean(validationError)}
                                        aria-describedby={
                                            validationError ? "value-error" : undefined
                                        }
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        Enabled / Yes
                                    </span>
                                </label>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    Checked means true. Unchecked means false.
                                </span>
                            </div>
                        ) : attributeType === "TEXT" ? (
                            <>
                                <textarea
                                    id="value"
                                    rows={5}
                                    value={value}
                                    onChange={handleValueChange}
                                    disabled={submitting}
                                    placeholder="Enter Markdown-formatted text"
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby={
                                        validationError ? "value-error" : undefined
                                    }
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                                />
                            </>
                        ) : attributeType === "DATE" ? (
                            <>
                                <input
                                    id="value"
                                    type="date"
                                    value={value}
                                    onChange={handleValueChange}
                                    disabled={submitting}
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby={
                                        validationError ? "value-error" : undefined
                                    }
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </>
                        ) : attributeType === "NUMERIC" ? (
                            <>
                                <input
                                    id="value"
                                    type="number"
                                    step="any"
                                    value={value}
                                    onChange={handleValueChange}
                                    disabled={submitting}
                                    placeholder="Enter a numeric value"
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby={
                                        validationError ? "value-error" : undefined
                                    }
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </>
                        ) : attributeType === "IMAGE" ? (
                            <>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <input
                                            id="value"
                                            type="url"
                                            value={value}
                                            onChange={handleValueChange}
                                            disabled={submitting}
                                            placeholder="https://example.com/image.jpg"
                                            aria-invalid={Boolean(validationError)}
                                            aria-describedby={
                                                validationError ? "value-error" : undefined
                                            }
                                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            Use an externally hosted HTTP or HTTPS image URL.
                                        </p>
                                    </div>
                                    {value && (
                                        <div className="shrink-0 flex items-start">
                                            {!imagePreviewError ? (
                                                <img
                                                    src={value}
                                                    alt="Attribute value preview"
                                                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                    onError={() => setImagePreviewError(true)}
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                                    <ImageIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : attributeType === "STRING" ? (
                            <>
                                <input
                                    id="value"
                                    type="text"
                                    value={value}
                                    onChange={handleValueChange}
                                    disabled={submitting}
                                    placeholder="Enter a single-line value"
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby={
                                        validationError ? "value-error" : undefined
                                    }
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </>
                        ) : attributeType === "PERIOD" ? (
                            <>
                                <input
                                    id="value"
                                    type="text"
                                    value={value}
                                    onChange={handleValueChange}
                                    disabled={submitting}
                                    placeholder="Example: 2024-01-01 to 2025-01-01"
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby={
                                        validationError ? "value-error" : undefined
                                    }
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Structured date-range controls will be added after the Period schema migration.
                                    </p>
                                </div>
                            </>
                        ) : attributeType === "DROPDOWN" ? (
                            <>
                                <input
                                    id="value"
                                    type="text"
                                    value={value}
                                    onChange={handleValueChange}
                                    disabled={submitting}
                                    placeholder="Enter a value"
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby={
                                        validationError ? "value-error" : undefined
                                    }
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Dropdown options have not been configured for this Attribute yet.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Attribute type is unavailable.
                                </p>
                            </>
                        )}

                        {validationError && (
                            <p
                                id="value-error"
                                className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                            >
                                {validationError}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => navigate(`/profile/attributes/${id}`)}
                            disabled={submitting}
                            className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !attributeType}
                            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserAttribute;