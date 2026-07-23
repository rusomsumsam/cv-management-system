import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../api/axios";

const AddUserAttribute = () => {
    const navigate = useNavigate();

    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        attributeId: "",
        value: "",
    });

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const response = await api.get("/attributes");
                setAttributes(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load attributes. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAttributes();
    }, []);

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

        if (!formData.attributeId) {
            setError("Please select an attribute.");
            return;
        }
        if (!formData.value.trim()) {
            setError("Value is required.");
            return;
        }

        setSubmitting(true);

        try {
            await api.post("/user-attributes", formData);
            navigate("/profile/attributes");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to add attribute. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading attributes...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate("/profile/attributes")}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Attributes
                </button>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Add Profile Attribute</h1>
                    <p className="text-slate-600 mt-1">
                        Add an attribute from the library and assign a value to your profile.
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Attribute Select */}
                        <div>
                            <label htmlFor="attributeId" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Attribute <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="attributeId"
                                name="attributeId"
                                value={formData.attributeId}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={submitting}
                            >
                                <option value="">Select an attribute</option>
                                {attributes.map((attr) => (
                                    <option key={attr.id} value={attr.id}>
                                        {attr.name} ({attr.category})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Value Input */}
                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Value <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="value"
                                name="value"
                                type="text"
                                value={formData.value}
                                onChange={handleChange}
                                placeholder="e.g. Advanced, 7.5, Yes"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={submitting}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Adding..." : "Add Attribute"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/profile/attributes")}
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

export default AddUserAttribute;