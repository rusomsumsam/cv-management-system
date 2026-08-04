import { useState } from "react";
import {
    Check,
    Copy,
    KeyRound,
    ShieldAlert,
    X,
} from "lucide-react";

const PositionApiTokenModal = ({
    token,
    positionTitle,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");

    const normalizedToken =
        typeof token === "string"
            ? token.trim()
            : "";

    const normalizedPositionTitle =
        typeof positionTitle === "string" &&
            positionTitle.trim()
            ? positionTitle.trim()
            : "Selected Position";

    const handleCopy = async () => {
        if (!normalizedToken) {
            setCopyError(
                "The generated API Token is unavailable."
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(
                normalizedToken
            );

            setCopied(true);
            setCopyError("");
        } catch {
            setCopied(false);
            setCopyError(
                "The Token could not be copied automatically. Select and copy it manually."
            );
        }
    };

    const handleClose = () => {
        if (typeof onClose === "function") {
            onClose();
        }
    };

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    };

    if (!normalizedToken) {
        return null;
    }

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
                aria-labelledby="position-api-token-title"
                aria-describedby="position-api-token-description"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <KeyRound
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </div>

                        <div>
                            <h2
                                id="position-api-token-title"
                                className="text-lg font-semibold text-slate-900 dark:text-white"
                            >
                                Position API Token
                            </h2>

                            <p
                                id="position-api-token-description"
                                className="mt-1 text-sm text-slate-600 dark:text-slate-400"
                            >
                                A new API Token has been
                                generated for{" "}
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {normalizedPositionTitle}
                                </span>
                                .
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close API Token dialog"
                    >
                        <X
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                        <ShieldAlert
                            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                            aria-hidden="true"
                        />

                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                Copy this Token now
                            </p>

                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                This Token will not be shown
                                again after closing this
                                dialog. Generating another
                                Token for this Position will
                                invalidate this Token.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="position-api-token"
                            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Generated API Token
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <textarea
                                id="position-api-token"
                                value={normalizedToken}
                                readOnly
                                rows={3}
                                spellCheck={false}
                                className="min-h-24 flex-1 resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                aria-label="Generated Position API Token"
                            />

                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center justify-center gap-2 self-stretch rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                            >
                                {copied ? (
                                    <>
                                        <Check
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Copy Token
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {copyError && (
                        <div
                            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                            role="alert"
                        >
                            {copyError}
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                            External API usage
                        </p>

                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Send this Token in the
                            Authorization header:
                        </p>

                        <code className="mt-2 block overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-sm text-slate-100">
                            Authorization: Bearer
                            {" <Position API Token>"}
                        </code>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-900"
                    >
                        I Have Saved the Token
                    </button>
                </div>
            </section>
        </div>
    );
};

export default PositionApiTokenModal;