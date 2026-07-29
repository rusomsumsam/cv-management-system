import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    LifeBuoy,
    LoaderCircle,
    X,
} from "lucide-react";
import api from "../../api/axios";

const PRIORITY_OPTIONS = ["High", "Average", "Low"];

const SupportTicketModal = ({
    isOpen,
    onClose,
    currentPageUrl,
}) => {
    const [summary, setSummary] = useState("");
    const [priority, setPriority] = useState("Average");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleClose = useCallback(() => {
        if (submitting) {
            return;
        }

        setSummary("");
        setPriority("Average");
        setError("");
        setSuccessMessage("");
        onClose();
    }, [onClose, submitting]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, handleClose]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setError("");
        setSuccessMessage("");

        const normalizedSummary = summary
            .trim()
            .replace(/\s+/g, " ");

        if (!normalizedSummary) {
            setError("Support ticket summary is required.");
            return;
        }

        if (normalizedSummary.length < 5) {
            setError(
                "Support ticket summary must contain at least 5 characters."
            );
            return;
        }

        if (normalizedSummary.length > 500) {
            setError(
                "Support ticket summary cannot exceed 500 characters."
            );
            return;
        }

        if (!PRIORITY_OPTIONS.includes(priority)) {
            setError("Please select a valid priority.");
            return;
        }

        if (
            typeof currentPageUrl !== "string" ||
            !currentPageUrl.trim()
        ) {
            setError("The current page link is unavailable.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post("/support-tickets", {
                summary: normalizedSummary,
                priority,
                link: currentPageUrl.trim(),
            });

            setSuccessMessage(
                response.data?.message ||
                "Support ticket created successfully."
            );

            setSummary("");
            setPriority("Average");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to create support ticket. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={handleBackdropClick}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="support-ticket-title"
                aria-describedby="support-ticket-description"
                aria-busy={submitting}
                className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <LifeBuoy
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </div>

                        <div>
                            <h2
                                id="support-ticket-title"
                                className="text-lg font-semibold text-slate-900 dark:text-white"
                            >
                                Create Support Ticket
                            </h2>

                            <p
                                id="support-ticket-description"
                                className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Describe the problem and select its priority.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label="Close support ticket form"
                        title="Close"
                    >
                        <X
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-5"
                    aria-describedby={
                        error
                            ? "support-ticket-error"
                            : successMessage
                                ? "support-ticket-success"
                                : undefined
                    }
                >
                    {error && (
                        <div
                            id="support-ticket-error"
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                        >
                            <AlertCircle
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />

                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div
                            id="support-ticket-success"
                            role="status"
                            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                            <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />

                            <span>{successMessage}</span>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="support-summary"
                            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Summary
                        </label>

                        <textarea
                            id="support-summary"
                            value={summary}
                            onChange={(event) => {
                                setSummary(event.target.value);

                                if (error) {
                                    setError("");
                                }

                                if (successMessage) {
                                    setSuccessMessage("");
                                }
                            }}
                            rows={5}
                            maxLength={500}
                            placeholder="Describe the problem you encountered..."
                            disabled={submitting}
                            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                            required
                        />

                        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>Minimum 5 characters</span>
                            <span>{summary.length}/500</span>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="support-priority"
                            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Priority
                        </label>

                        <select
                            id="support-priority"
                            value={priority}
                            onChange={(event) => {
                                setPriority(event.target.value);

                                if (error) {
                                    setError("");
                                }

                                if (successMessage) {
                                    setSuccessMessage("");
                                }
                            }}
                            disabled={submitting}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            {PRIORITY_OPTIONS.map((option) => (
                                <option
                                    key={option}
                                    value={option}
                                >
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                            Reported page
                        </p>

                        <p className="break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                            {currentPageUrl ||
                                "Current page URL is unavailable."}
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
                        >
                            {submitting && (
                                <LoaderCircle
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}

                            {submitting
                                ? "Creating Ticket..."
                                : "Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupportTicketModal;