import { useState, useEffect } from 'react';
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

    // Load positions for dropdown
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                setPositionsLoading(true);
                const response = await api.get("/positions");
                setPositions(response.data.data || []);
                setPositionsError("");
            } catch (err) {
                setPositionsError(
                    err.response?.data?.message ||
                    "Failed to load positions. Please try again."
                );
                console.error("Error fetching positions:", err);
            } finally {
                setPositionsLoading(false);
            }
        };

        fetchPositions();
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

        if (!formData.positionId) {
            errors.positionId = "Please select a position";
        }

        if (!formData.content || formData.content.trim() === "") {
            errors.content = "Discussion content is required";
        } else if (formData.content.trim().length < 5) {
            errors.content = "Discussion content must be at least 5 characters";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess(false);

            await api.post("/discussions", {
                positionId: formData.positionId,
                content: formData.content.trim()
            });

            setSuccess(true);

            // Navigate after short delay to show success message
            setTimeout(() => {
                navigate("/discussions");
            }, 1500);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to create discussion. Please try again."
            );
            console.error("Error creating discussion:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/discussions");
    };

    // Get selected position title for display
    const selectedPosition = positions.find(
        p => p.id === formData.positionId
    );

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Create Discussion</h1>
                            <p className="text-slate-600 mt-1">Start a discussion related to a position.</p>
                        </div>
                    </div>
                </div>

                {/* Create Discussion Form */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Position Selection */}
                        <div>
                            <label htmlFor="positionId" className="block text-sm font-medium text-slate-700 mb-1">
                                Position <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    id="positionId"
                                    name="positionId"
                                    value={formData.positionId}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.positionId
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200'
                                        }`}
                                    disabled={positionsLoading}
                                >
                                    <option value="">Select a position...</option>
                                    {positions.map((position) => (
                                        <option key={position.id} value={position.id}>
                                            {position.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {positionsLoading && (
                                <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading positions...
                                </p>
                            )}
                            {positionsError && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {positionsError}
                                </p>
                            )}
                            {validationErrors.positionId && (
                                <p className="mt-1 text-sm text-red-600">
                                    {validationErrors.positionId}
                                </p>
                            )}
                            {selectedPosition && !validationErrors.positionId && (
                                <p className="mt-1 text-sm text-slate-500">
                                    Selected: <span className="font-medium">{selectedPosition.title}</span>
                                </p>
                            )}
                        </div>

                        {/* Discussion Content */}
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                                Discussion Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Write your question or discussion topic..."
                                rows={5}
                                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y min-h-[140px] ${validationErrors.content
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-slate-200'
                                    }`}
                            />
                            <div className="flex justify-between mt-1">
                                {validationErrors.content ? (
                                    <p className="text-sm text-red-600">
                                        {validationErrors.content}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        {formData.content.length} characters (minimum 5)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Example Discussions:</h4>
                            <ul className="space-y-1 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    "Is React experience mandatory for this position?"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    "What is the interview process like?"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    "Is remote work available for this role?"
                                </li>
                            </ul>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                                <div className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5">✓</div>
                                <p className="text-sm text-emerald-700">
                                    Discussion created successfully! Redirecting...
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-5 h-5" />
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