// client/src/pages/candidate/profile/EditUserAttribute.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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

const getSafeInternalReturnPath = (value, fallbackPath) => {
    if (
        typeof value !== "string" ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        value.includes("\\") ||
        value.includes("\r") ||
        value.includes("\n")
    ) {
        return fallbackPath;
    }

    return value;
};

const EditUserAttribute = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    const [userAttribute, setUserAttribute] = useState(null);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [validationError, setValidationError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [imagePreviewError, setImagePreviewError] = useState(false);
    const [version, setVersion] = useState(null);
    const [conflictError, setConflictError] = useState("");
    const [reloading, setReloading] = useState(false);

    // Auto-save state
    const [isDirty, setIsDirty] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("SAVED");
    const [autoSavePaused, setAutoSavePaused] = useState(false);

    const autoSaveTimerRef = useRef(null);
    const mountedRef = useRef(true);
    const saveInFlightRef = useRef(false);

    const returnTo = searchParams.get("returnTo");
    const fallbackPath = `/profile/attributes/${id}`;
    const safeReturnPath = getSafeInternalReturnPath(returnTo, fallbackPath);

    // Declare attributeType before any helper, effect, or callback that uses it
    const attributeType = userAttribute?.attribute?.type;

    const clearAutoSaveTimer = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
    }, []);

    const getNormalizedPayloadValue = useCallback(() => {
        if (attributeType === "BOOLEAN") {
            return Boolean(value);
        }

        if (typeof value === "string" && value.trim() === "") {
            return null;
        }

        if (typeof value === "string") {
            return value.trim();
        }

        return value;
    }, [attributeType, value]);

    const validateValue = useCallback(() => {
        const type = userAttribute?.attribute?.type;

        if (!type) {
            setValidationError("Attribute type is unavailable.");
            return false;
        }

        // STRING newline validation must happen before trimming
        if (
            type === "STRING" &&
            typeof value === "string" &&
            (value.includes("\n") || value.includes("\r"))
        ) {
            setValidationError("String values must use a single line.");
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
                // Already validated above
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
    }, [userAttribute, value]);

    const loadUserAttribute = async (shouldResetValue = true) => {
        try {
            setReloading(true);
            setError("");
            setValidationError("");
            // Do not clear conflictError before the request succeeds
            const response = await api.get(`/user-attributes/${id}`);
            const data = response.data?.data;

            if (!data) {
                // Preserve existing state on failure, do not set userAttribute to null
                setError("User attribute not found.");
                return;
            }

            if (!Number.isInteger(data.version) || data.version < 1) {
                // Preserve existing state on failure, do not set userAttribute to null
                setError("Invalid attribute version data. Please refresh.");
                return;
            }

            // Only after a successful GET with valid version do we update state
            setUserAttribute(data);
            setVersion(data.version);

            if (shouldResetValue) {
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
            } else {
                // Only update version, keep current value
                setVersion(data.version);
            }

            setError("");
            setConflictError("");
            setIsDirty(false);
            setSaveStatus("SAVED");
            setAutoSavePaused(false);
            clearAutoSaveTimer();
        } catch (requestError) {
            // Preserve existing state on failure, do not set userAttribute to null
            setError(
                requestError.response?.data?.message ||
                "Failed to load attribute value. Please try again."
            );
            console.error("Failed to load User Attribute:", requestError.message);
        } finally {
            setReloading(false);
        }
    };

    // Mount/unmount effect safe for Strict Mode
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            clearAutoSaveTimer();
        };
    }, [clearAutoSaveTimer]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const response = await api.get(`/user-attributes/${id}`);
                if (cancelled) return;

                const data = response.data?.data;

                if (!data) {
                    setUserAttribute(null);
                    setError("User attribute not found.");
                    return;
                }

                if (!Number.isInteger(data.version) || data.version < 1) {
                    setUserAttribute(null);
                    setError("Invalid attribute version data. Please refresh.");
                    return;
                }

                setUserAttribute(data);
                setVersion(data.version);

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
                setConflictError("");
                setIsDirty(false);
                setSaveStatus("SAVED");
                setAutoSavePaused(false);
            } catch (requestError) {
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
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [id, retryCounter]);

    const saveAttributeValue = useCallback(async (mode = "manual") => {
        const navigateAfterSave = mode === "manual";

        if (!userAttribute || !attributeType) {
            setError("Attribute type is unavailable.");
            setSaveStatus("ERROR");
            setAutoSavePaused(true);
            return;
        }

        if (!Number.isInteger(version) || version < 1) {
            setError("Invalid attribute version. Please reload the page.");
            setSaveStatus("ERROR");
            setAutoSavePaused(true);
            return;
        }

        if (conflictError !== "") {
            if (navigateAfterSave) {
                setError("Cannot save while a conflict exists. Reload the latest value first.");
            } else {
                setSaveStatus("CONFLICT");
                setAutoSavePaused(true);
            }
            return;
        }

        if (!validateValue()) {
            setSaveStatus("ERROR");
            setAutoSavePaused(true);
            return;
        }

        // Synchronous duplicate-request guard
        if (saveInFlightRef.current) {
            return;
        }

        clearAutoSaveTimer();

        if (navigateAfterSave) {
            setSubmitting(true);
        } else {
            setAutoSaving(true);
            setSaveStatus("SAVING");
        }

        saveInFlightRef.current = true;
        setError("");
        setConflictError("");

        try {
            const normalizedPayloadValue = getNormalizedPayloadValue();

            const response = await api.patch(`/user-attributes/${id}`, {
                value: normalizedPayloadValue,
                expectedVersion: version,
            });

            const returnedData = response.data?.data;

            if (!returnedData || !Number.isInteger(returnedData.version) || returnedData.version < 1) {
                throw new Error("Server returned invalid version data.");
            }

            // Update local state with returned data
            setUserAttribute(returnedData);
            setVersion(returnedData.version);
            if (returnedData.attribute?.type === "BOOLEAN") {
                setValue(returnedData.value === true || returnedData.value === "true");
            } else {
                setValue(
                    returnedData.value === null || returnedData.value === undefined
                        ? ""
                        : String(returnedData.value)
                );
            }
            setIsDirty(false);
            setSaveStatus("SAVED");
            setAutoSavePaused(false);
            setConflictError("");
            setError("");

            if (navigateAfterSave) {
                navigate(safeReturnPath);
            }
        } catch (requestError) {
            if (requestError.response?.status === 409) {
                clearAutoSaveTimer();
                setConflictError(
                    requestError.response?.data?.message ||
                    "This attribute value was changed in another session. Reload the latest value and try again."
                );
                setSaveStatus("CONFLICT");
                setAutoSavePaused(true);
                // Keep the form open with the typed value, do not clear isDirty
            } else {
                setError(
                    requestError.response?.data?.message ||
                    "Failed to update attribute value. Please try again."
                );
                setSaveStatus("ERROR");
                setAutoSavePaused(true);
                clearAutoSaveTimer();
                console.error(
                    "Failed to update user attribute:",
                    requestError.message
                );
                // Keep isDirty true on failure
            }
        } finally {
            if (navigateAfterSave) {
                setSubmitting(false);
            } else {
                setAutoSaving(false);
            }
            saveInFlightRef.current = false;
        }
    }, [
        userAttribute,
        attributeType,
        version,
        conflictError,
        validateValue,
        getNormalizedPayloadValue,
        clearAutoSaveTimer,
        id,
        safeReturnPath,
        navigate,
    ]);

    // Auto-save effect (placed after saveAttributeValue declaration)
    useEffect(() => {
        if (
            !isDirty ||
            !userAttribute ||
            !attributeType ||
            !Number.isInteger(version) ||
            version < 1 ||
            conflictError !== "" ||
            submitting ||
            autoSaving ||
            loading ||
            reloading ||
            autoSavePaused
        ) {
            clearAutoSaveTimer();
            return;
        }

        clearAutoSaveTimer();

        autoSaveTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
                saveAttributeValue("auto");
            }
        }, 8000);

        return () => {
            clearAutoSaveTimer();
        };
    }, [
        isDirty,
        userAttribute,
        attributeType,
        version,
        conflictError,
        submitting,
        autoSaving,
        loading,
        reloading,
        autoSavePaused,
        saveAttributeValue,
        clearAutoSaveTimer,
    ]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setConflictError("");
        clearAutoSaveTimer();
        setRetryCounter((previous) => previous + 1);
    };

    const handleReloadLatest = async () => {
        if (reloading) return;
        clearAutoSaveTimer();
        await loadUserAttribute(true);
    };

    const handleValueChange = (event) => {
        const { type, checked, value: inputValue } = event.target;

        setValue(type === "checkbox" ? checked : inputValue);
        setValidationError("");
        setError("");
        // Do not clear conflictError silently - user should reload if they want latest

        if (attributeType === "IMAGE") {
            setImagePreviewError(false);
        }

        // Only clear pause if no unresolved conflict exists
        if (conflictError === "") {
            setAutoSavePaused(false);
        }

        if (!isDirty) {
            setIsDirty(true);
            setSaveStatus("UNSAVED");
        } else {
            setSaveStatus("UNSAVED");
        }
    };

    const handleCancel = () => {
        if (submitting || autoSaving || saveInFlightRef.current) {
            return;
        }

        clearAutoSaveTimer();
        navigate(safeReturnPath);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (conflictError) {
            setError("Cannot save while a conflict exists. Reload the latest value first.");
            return;
        }

        if (submitting || autoSaving || saveInFlightRef.current) {
            return;
        }

        clearAutoSaveTimer();
        await saveAttributeValue("manual");
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

    if (reloading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Reloading latest attribute value...
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
                    to={safeReturnPath}
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
                    <span className="text-slate-500 dark:text-slate-400">
                        Version: {version}
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

                {/* Conflict Error */}
                {conflictError && (
                    <div
                        className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                {conflictError}
                            </p>
                            <button
                                type="button"
                                onClick={handleReloadLatest}
                                disabled={reloading}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                Reload Latest Value
                            </button>
                        </div>
                    </div>
                )}

                {/* Auto-save status indicator */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                    {saveStatus === "SAVED" && (
                        <span className="text-slate-500 dark:text-slate-400" role="status">
                            All changes saved
                        </span>
                    )}
                    {saveStatus === "UNSAVED" && (
                        <span className="text-amber-600 dark:text-amber-400" role="status">
                            Unsaved changes — auto-save in 8 seconds
                        </span>
                    )}
                    {saveStatus === "SAVING" && (
                        <span className="text-blue-600 dark:text-blue-400" role="status">
                            Saving changes...
                        </span>
                    )}
                    {saveStatus === "ERROR" && (
                        <span className="text-red-600 dark:text-red-400" role="alert">
                            Changes not saved
                        </span>
                    )}
                    {saveStatus === "CONFLICT" && (
                        <span className="text-amber-600 dark:text-amber-400" role="alert">
                            Auto-save paused because a newer value exists
                        </span>
                    )}
                </div>

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
                                        disabled={submitting || autoSaving}
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
                                    disabled={submitting || autoSaving}
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
                                    disabled={submitting || autoSaving}
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
                                    disabled={submitting || autoSaving}
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
                                            disabled={submitting || autoSaving}
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
                                    disabled={submitting || autoSaving}
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
                                    disabled={submitting || autoSaving}
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
                                    disabled={submitting || autoSaving}
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
                            onClick={handleCancel}
                            disabled={submitting || autoSaving}
                            className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                autoSaving ||
                                !attributeType ||
                                conflictError !== "" ||
                                !isDirty
                            }
                            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting || autoSaving ? (
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