import { useEffect, useState } from "react";
import {
    Building2,
    CheckCircle2,
    LoaderCircle,
    X,
} from "lucide-react";
import api from "../../api/axios";

const createInitialFormData = (profile) => {
    const fullName = [
        profile?.firstName,
        profile?.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {
        accountName: fullName
            ? `${fullName} Career Account`
            : "CVMS Career Account",
        phone: "",
        jobTitle: "",
        notes: "",
    };
};

const SalesforceProfileModal = ({
    isOpen,
    profile,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState(() =>
        createInitialFormData(profile)
    );

    const [validationErrors, setValidationErrors] =
        useState({});

    const [requestError, setRequestError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    // ✅ Fix: Use useMemo or handle reset in a cleaner way
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        // Instead of setting state directly in effect,
        // we use a cleanup function pattern
        let isMounted = true;

        const resetForm = () => {
            if (isMounted) {
                setFormData(createInitialFormData(profile));
                setValidationErrors({});
                setRequestError("");
                setSubmitting(false);
            }
        };

        // Use setTimeout to defer state updates
        // This prevents cascading renders
        const timeoutId = setTimeout(resetForm, 0);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [isOpen, profile]);

    // ✅ Fix: Separate effect for keyboard events
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                !submitting
            ) {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [isOpen, onClose, submitting]);

    if (!isOpen) {
        return null;
    }

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

        if (requestError) {
            setRequestError("");
        }
    };

    const validateForm = () => {
        const errors = {};

        const accountName =
            formData.accountName.trim();

        const phone =
            formData.phone.trim();

        const jobTitle =
            formData.jobTitle.trim();

        const notes =
            formData.notes.trim();

        if (!accountName) {
            errors.accountName =
                "Account name is required.";
        } else if (
            accountName.length > 255
        ) {
            errors.accountName =
                "Account name must not exceed 255 characters.";
        }

        if (!phone) {
            errors.phone =
                "Phone number is required.";
        } else if (
            phone.length > 40
        ) {
            errors.phone =
                "Phone number must not exceed 40 characters.";
        }

        if (!jobTitle) {
            errors.jobTitle =
                "Job title is required.";
        } else if (
            jobTitle.length > 128
        ) {
            errors.jobTitle =
                "Job title must not exceed 128 characters.";
        }

        if (notes.length > 2000) {
            errors.notes =
                "Notes must not exceed 2000 characters.";
        }

        setValidationErrors(errors);

        return (
            Object.keys(errors).length === 0
        );
    };

    const handleClose = () => {
        if (submitting) {
            return;
        }

        onClose();
    };

    const handleBackdropClick = (event) => {
        if (
            event.target ===
            event.currentTarget
        ) {
            handleClose();
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            setRequestError("");

            const payload = {
                accountName:
                    formData.accountName.trim(),
                phone:
                    formData.phone.trim(),
                jobTitle:
                    formData.jobTitle.trim(),
                notes:
                    formData.notes.trim() ||
                    null,
            };

            const response = await api.post(
                "/profile/salesforce",
                payload
            );

            const responseData =
                response.data?.data;

            if (
                !responseData?.account?.id ||
                !responseData?.contact?.id
            ) {
                throw new Error(
                    "Salesforce returned an invalid response."
                );
            }

            if (typeof onSuccess === "function") {
                onSuccess({
                    message:
                        response.data?.message ||
                        "Profile added to Salesforce successfully.",
                    data: responseData,
                });
            }

            onClose();
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to add the Profile to Salesforce.";

            setRequestError(message);

            console.error(
                "Salesforce Profile request failed:",
                error.message
            );
        } finally {
            setSubmitting(false);
        }
    };

    const profileName = [
        profile?.firstName,
        profile?.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Current User";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={handleBackdropClick}
            role="presentation"
        >
            <section
                className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                role="dialog"
                aria-modal="true"
                aria-labelledby="salesforce-modal-title"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Building2
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </div>

                        <div>
                            <h2
                                id="salesforce-modal-title"
                                className="text-lg font-semibold text-slate-900 dark:text-white"
                            >
                                Add Profile to Salesforce
                            </h2>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Create a Salesforce Account
                                with a linked Contact for{" "}
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {profileName}
                                </span>
                                .
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close Salesforce form"
                    >
                        <X
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                            The Contact name, email,
                            location, user role and
                            internal user ID will be
                            taken securely from the
                            authenticated Profile.
                        </div>

                        {requestError && (
                            <div
                                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                                role="alert"
                            >
                                {requestError}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="salesforce-account-name"
                                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Account Name{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="salesforce-account-name"
                                name="accountName"
                                type="text"
                                value={
                                    formData.accountName
                                }
                                onChange={handleChange}
                                disabled={submitting}
                                maxLength={255}
                                aria-invalid={Boolean(
                                    validationErrors.accountName
                                )}
                                aria-describedby={
                                    validationErrors.accountName
                                        ? "salesforce-account-name-error"
                                        : undefined
                                }
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white ${validationErrors.accountName
                                    ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/20"
                                    : "border-slate-300 bg-white dark:border-slate-700"
                                    }`}
                                placeholder="Example: Sumaiya Career Account"
                            />

                            {validationErrors.accountName && (
                                <p
                                    id="salesforce-account-name-error"
                                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                                >
                                    {
                                        validationErrors.accountName
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="salesforce-phone"
                                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Phone Number{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="salesforce-phone"
                                    name="phone"
                                    type="tel"
                                    value={
                                        formData.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        submitting
                                    }
                                    maxLength={40}
                                    aria-invalid={Boolean(
                                        validationErrors.phone
                                    )}
                                    aria-describedby={
                                        validationErrors.phone
                                            ? "salesforce-phone-error"
                                            : undefined
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white ${validationErrors.phone
                                        ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/20"
                                        : "border-slate-300 bg-white dark:border-slate-700"
                                        }`}
                                    placeholder="01700000000"
                                />

                                {validationErrors.phone && (
                                    <p
                                        id="salesforce-phone-error"
                                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                                    >
                                        {
                                            validationErrors.phone
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="salesforce-job-title"
                                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Job Title{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="salesforce-job-title"
                                    name="jobTitle"
                                    type="text"
                                    value={
                                        formData.jobTitle
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        submitting
                                    }
                                    maxLength={128}
                                    aria-invalid={Boolean(
                                        validationErrors.jobTitle
                                    )}
                                    aria-describedby={
                                        validationErrors.jobTitle
                                            ? "salesforce-job-title-error"
                                            : undefined
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white ${validationErrors.jobTitle
                                        ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/20"
                                        : "border-slate-300 bg-white dark:border-slate-700"
                                        }`}
                                    placeholder="Student Developer"
                                />

                                {validationErrors.jobTitle && (
                                    <p
                                        id="salesforce-job-title-error"
                                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                                    >
                                        {
                                            validationErrors.jobTitle
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between gap-4">
                                <label
                                    htmlFor="salesforce-notes"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Additional Notes
                                </label>

                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formData.notes.length}
                                    /2000
                                </span>
                            </div>

                            <textarea
                                id="salesforce-notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                disabled={submitting}
                                maxLength={2000}
                                rows={5}
                                aria-invalid={Boolean(
                                    validationErrors.notes
                                )}
                                aria-describedby={
                                    validationErrors.notes
                                        ? "salesforce-notes-error"
                                        : undefined
                                }
                                className={`w-full resize-y rounded-lg border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white ${validationErrors.notes
                                    ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/20"
                                    : "border-slate-300 bg-white dark:border-slate-700"
                                    }`}
                                placeholder="Optional CRM notes about services, interests or follow-up requirements"
                            />

                            {validationErrors.notes && (
                                <p
                                    id="salesforce-notes-error"
                                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                                >
                                    {
                                        validationErrors.notes
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-900">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                        >
                            {submitting ? (
                                <>
                                    <LoaderCircle
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Add to Salesforce
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default SalesforceProfileModal;