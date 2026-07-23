import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../api/axios";

const EditAttribute = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        type: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const categoryOptions = [
        "Certification",
        "Domain Knowledge",
        "Personal Information",
        "Soft Skills",
        "Technical Skills",
        "Language Skills",
    ];

    const typeOptions = [
        "STRING",
        "TEXT",
        "IMAGE",
        "NUMERIC",
        "DATE",
        "PERIOD",
        "BOOLEAN",
        "DROPDOWN",
    ];

    useEffect(() => {
        const fetchAttribute = async () => {
            try {
                const response = await api.get(`/attributes/${id}`);
                const data = response.data.data;
                setFormData({
                    name: data.name || "",
                    category: data.category || "",
                    type: data.type || "",
                });
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load attribute details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAttribute();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim()) {
            setError("Attribute name is required.");
            return;
        }
        if (!formData.category) {
            setError("Category is required.");
            return;
        }
        if (!formData.type) {
            setError("Attribute type is required.");
            return;
        }

        setSubmitting(true);

        try {
            await api.patch(`/attributes/${id}`, formData);
            navigate(`/attributes/${id}`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update attribute. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading attribute...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(`/attributes/${id}`)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Attribute Details
                </button>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Edit Attribute</h1>
                    <p className="text-slate-600 mt-1">Modify reusable attribute information.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Attribute Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Attribute Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. English Level"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={submitting}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={submitting}
                            >
                                <option value="">Select a category</option>
                                {categoryOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Attribute Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Attribute Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={submitting}
                            >
                                <option value="">Select a type</option>
                                {typeOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/attributes/${id}`)}
                                className="px-6 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={submitting}
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

export default EditAttribute;