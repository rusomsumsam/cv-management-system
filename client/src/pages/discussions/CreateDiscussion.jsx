import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import {
    MessageSquare,
    Briefcase,
    ArrowLeft,
    AlertCircle,
    Loader2
} from 'lucide-react';

const CreateDiscussion = () => {
    const navigate = useNavigate();
    const [positions, setPositions] = useState([]);
    const [positionsLoading, setPositionsLoading] = useState(true);
    const [positionsError, setPositionsError] = useState("");

    const [formData, setFormData] = useState({
        positionId: "",
        content: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const redirectTimerRef = useRef(null);

    // Compute valid positions from loaded data using safe normalized mapping
    const validPositions = positions
        .map((position) => {
            const id =
                typeof position?.id === "string"
                    ? position.id.trim()
                    : "";

            const title =
                typeof position?.title === "string"
                    ? position.title.trim()
                    : "";

            if (!id || !title) {
                return null;
            }

            return {
                ...position,
                id,
                title,
            };
        })
        .filter(Boolean);

    // Load positions for dropdown
    useEffect(() => {
        let cancelled = false;

        const fetchPositions = async () => {
            try {
                setPositionsLoading(true);
                const response = await api.get("/positions");
                if (cancelled) return;
                const data = response.data?.data;
                setPositions(Array.isArray(data) ? data : []);
                setPositionsError("");
            } catch (err) {
                if (cancelled) return;
                setPositionsError(
                    err.response?.data?.message ||
                    "Failed to load positions. Please try again."
                );
                console.error("Error fetching positions:", err.message);
            } finally {
                if (!cancelled) {
                    setPositionsLoading(false);
                }
            }
        };

        fetchPositions();

        return () => {
            cancelled = true;
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
            }
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }

        // Clear general error
        if (error) setError("");
        if (success) setSuccess(false);
    };

    const validateForm = () => {
        const errors = {};

        // Position must be a valid ID from the validPositions array
        const trimmedPositionId = formData.positionId.trim();
        const isValidPositionId = validPositions.some(
            (position) => position.id === trimmedPositionId
        );
        if (!trimmedPositionId || !isValidPositionId) {
            errors.positionId = "Please select a valid position";
        }

        const trimmedContent = formData.content.trim();
        if (!formData.content || trimmedContent === "") {
            errors.content = "Discussion content is required";
        } else if (trimmedContent.length < 5) {
            errors.content = "Discussion content must be at least 5 characters";
        } else if (trimmedContent.length > 2000) {
            errors.content = "Discussion content must not exceed 2000 characters";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading || success) return;

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess(false);

            await api.post("/discussions", {
                positionId: formData.positionId.trim(),
                content: formData.content.trim()
            });

            setSuccess(true);

            // Clear any existing timer before scheduling a new one
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
            }

            redirectTimerRef.current = setTimeout(() => {
                navigate("/discussions");
            }, 1500);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to create discussion. Please try again."
            );
            console.error("Error creating discussion:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
        }
        navigate("/discussions");
    };

    // Get selected position title for display using validPositions
    const selectedPosition = validPositions.find(
        (position) => position.id === formData.positionId.trim()
    );

    const hasValidPositions = validPositions.length > 0;
    const isPositionDisabled = loading || success || positionsLoading || Boolean(positionsError);
    const isCreateDisabled = loading || success || positionsLoading || Boolean(positionsError) || !hasValidPositions;

    const positionErrorId = "position-error";
    const contentErrorId = "content-error";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page Header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Discussion</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">Start a discussion related to a position.</p>
                        </div>
                    </div>
                </div>

                {/* Create Discussion Form */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Position Selection */}
                        <div>
                            <label htmlFor="positionId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Position <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <select
                                    id="positionId"
                                    name="positionId"
                                    value={formData.positionId}
                                    onChange={handleChange}
                                    disabled={isPositionDisabled}
                                    aria-invalid={Boolean(validationErrors.positionId)}
                                    aria-describedby={validationErrors.positionId ? positionErrorId : undefined}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.positionId
                                        ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                        } text-slate-900 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <option value="">Select a position...</option>
                                    {validPositions.map((position) => (
                                        <option key={position.id} value={position.id}>
                                            {position.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {positionsLoading && (
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                    Loading positions...
                                </p>
                            )}
                            {positionsError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                                    {positionsError}
                                </p>
                            )}
                            {validationErrors.positionId && (
                                <p id={positionErrorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {validationErrors.positionId}
                                </p>
                            )}
                            {selectedPosition && !validationErrors.positionId && (
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Selected: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedPosition.title}</span>
                                </p>
                            )}
                        </div>

                        {/* Discussion Content */}
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Discussion Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Write your question or discussion topic..."
                                rows={5}
                                maxLength={2000}
                                disabled={loading || success}
                                aria-invalid={Boolean(validationErrors.content)}
                                aria-describedby={validationErrors.content ? contentErrorId : undefined}
                                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y min-h-[140px] ${validationErrors.content
                                    ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                    } text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                            />
                            <div className="flex justify-between mt-1">
                                {validationErrors.content ? (
                                    <p id={contentErrorId} className="text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.content}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {formData.content.length} / 2000 characters (minimum 5)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Example Discussions:</h4>
                            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">•</span>
                                    "Is React experience mandatory for this position?"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">•</span>
                                    "What is the interview process like?"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">•</span>
                                    "Is remote work available for this role?"
                                </li>
                            </ul>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3" role="alert">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3" role="status">
                                <div className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">✓</div>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Discussion created successfully! Redirecting...
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading || success}
                                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreateDisabled}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-5 h-5" aria-hidden="true" />
                                        Create Discussion
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateDiscussion;