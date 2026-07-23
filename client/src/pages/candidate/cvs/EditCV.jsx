import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../api/axios";

const EditCV = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        summary: "",
        skills: "",
        education: "",
        experience: "",
        projects: "",
        status: "Draft"
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCV = async () => {
            try {
                const response = await api.get(`/cvs/${id}`);
                const data = response.data.data;
                setFormData({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    summary: data.summary || "",
                    skills: data.skills || "",
                    education: data.education || "",
                    experience: data.experience || "",
                    projects: data.projects || "",
                    status: data.status || "Draft"
                });
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load CV details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCV();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.fullName.trim()) {
            setError("Full name is required.");
            return;
        }
        if (!formData.email.trim()) {
            setError("Email is required.");
            return;
        }

        setSaving(true);

        try {
            await api.patch(`/cvs/${id}`, formData);
            navigate(`/cvs/${id}`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update CV. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading CV...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(`/cvs/${id}`)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to CV Details
                </button>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Edit CV</h1>
                    <p className="text-slate-600 mt-1">Update your CV information and status.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g. John Doe"
                                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    disabled={saving}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g. john@example.com"
                                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Phone
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. +880 1234567890"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="summary" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Professional Summary
                            </label>
                            <textarea
                                id="summary"
                                name="summary"
                                rows={3}
                                value={formData.summary}
                                onChange={handleChange}
                                placeholder="Briefly describe your professional background and key strengths..."
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Skills
                            </label>
                            <textarea
                                id="skills"
                                name="skills"
                                rows={2}
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="e.g. React, Node.js, PostgreSQL, Tailwind CSS"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="education" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Education
                            </label>
                            <textarea
                                id="education"
                                name="education"
                                rows={2}
                                value={formData.education}
                                onChange={handleChange}
                                placeholder="e.g. B.Sc. in Computer Science, University of Dhaka, 2020-2024"
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Work Experience
                            </label>
                            <textarea
                                id="experience"
                                name="experience"
                                rows={3}
                                value={formData.experience}
                                onChange={handleChange}
                                placeholder="e.g. Senior Frontend Developer, Google (2022-Present) ..."
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="projects" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Projects
                            </label>
                            <textarea
                                id="projects"
                                name="projects"
                                rows={2}
                                value={formData.projects}
                                onChange={handleChange}
                                placeholder="e.g. E-commerce Platform (React, Stripe, MongoDB) ..."
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                disabled={saving}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Hidden">Hidden</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/cvs/${id}`)}
                                className="px-6 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={saving}
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

export default EditCV;