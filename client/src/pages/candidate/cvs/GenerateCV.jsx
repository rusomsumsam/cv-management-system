// client/src/pages/candidate/cvs/GenerateCV.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    FilePlus2,
    X,
    AlertCircle,
    RefreshCw,
    Info,
    BriefcaseBusiness,
    MapPin,
    Building2,
    UserRound,
} from "lucide-react";
import api from "../../../api/axios";

const isValidEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
};

const normalizeOptionalValue = (value) => {
    if (typeof value !== "string" || value.trim() === "") {
        return null;
    }
    return value.trim();
};

const GenerateCV = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [position, setPosition] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        summary: "",
        skills: "",
        education: "",
        experience: "",
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get("/profile"),
            api.get(`/positions/${id}`),
        ])
            .then(([profileResponse, positionResponse]) => {
                if (cancelled) return;

                const profileData = profileResponse.data?.data;
                const positionData = positionResponse.data?.data;

                if (!profileData) {
                    setProfile(null);
                    setPosition(null);
                    setError("Candidate profile not found.");
                    return;
                }

                if (!positionData) {
                    setProfile(null);
                    setPosition(null);
                    setError("Position not found.");
                    return;
                }

                setProfile(profileData);
                setPosition(positionData);

                const fullName = [profileData.firstName, profileData.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                setFormData({
                    fullName,
                    email: profileData.email || "",
                    phone: "",
                    summary: "",
                    skills: "",
                    education: "",
                    experience: "",
                });

                setValidationErrors({});
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setProfile(null);
                setPosition(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load CV generation data. Please try again."
                );
                console.error(
                    "Failed to load CV generation data:",
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

        if (error) {
            setError("");
        }
    };

    const validateForm = () => {
        const errors = {};

        if (typeof formData.fullName !== "string" || !formData.fullName.trim()) {
            errors.fullName = "Full name is required.";
        }

        if (typeof formData.email !== "string" || !formData.email.trim()) {
            errors.email = "Email is required.";
        } else if (!isValidEmail(formData.email.trim())) {
            errors.email = "Enter a valid email address.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!position || !profile) {
            setError("CV generation data is missing.");
            return;
        }

        if (!position.isActive) {
            setError("This Position is not currently available for CV creation.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const payload = {
                positionId: position.id,
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: normalizeOptionalValue(formData.phone),
                summary: normalizeOptionalValue(formData.summary),
                skills: normalizeOptionalValue(formData.skills),
                education: normalizeOptionalValue(formData.education),
                experience: normalizeOptionalValue(formData.experience),
                projects: null,
            };

            const response = await api.post("/cvs", payload);
            const createdCV = response.data?.data;

            if (!createdCV) {
                throw new Error("CV creation returned no data.");
            }

            navigate(`/cvs/${createdCV.id}`);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to generate CV. Please try again."
            );
            console.error(
                "Failed to generate CV:",
                requestError.message
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (submitting) return;
        navigate(`/candidate/positions/${id}`);
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading CV generation data...
                </div>
            </div>
        );
    }

    if (error && (!profile || !position)) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/candidate/positions/${id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Position
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Generate CV
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Create a Draft CV for this Position using your reusable Profile information.
                        </p>
                    </div>
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
                                Error loading data
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {error}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                    Retry
                                </button>
                                <Link
                                    to="/candidate/positions"
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                >
                                    Back to Positions
                                </Link>
                                <Link
                                    to="/my-cvs"
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                >
                                    My CVs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile || !position) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/candidate/positions/${id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Position
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Generate CV
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Create a Draft CV for this Position using your reusable Profile information.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <UserRound className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        CV generation data not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        We couldn't load your profile or the selected position.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Retry
                        </button>
                        <Link
                            to="/candidate/positions"
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        >
                            Back to Positions
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isPositionActive = position.isActive === true;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Link
                    to={`/candidate/positions/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Position
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Generate CV
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Create a Draft CV for this Position using your reusable Profile information.
                    </p>
                </div>
            </div>

            {/* Position Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <BriefcaseBusiness className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        <span className="font-medium">{position.title || "Untitled Position"}</span>
                    </span>
                    {position.company && (
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            {position.company}
                        </span>
                    )}
                    {position.location && (
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            {position.location}
                        </span>
                    )}
                    {position.department && (
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            Department: {position.department}
                        </span>
                    )}
                </div>
            </div>

            {/* Draft Information Panel */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Draft CV
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        The CV will begin as a Draft. Missing Position Attributes will be added to your Profile automatically. Complete all required Attribute values before publishing.
                    </p>
                </div>
            </div>

            {/* Inactive Position Warning */}
            {!isPositionActive && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            Position not available
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                            This Position is not currently available for CV creation.
                        </p>
                    </div>
                </div>
            )}

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name - read-only from Profile */}
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                            >
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                readOnly
                                disabled={submitting || !isPositionActive}
                                placeholder="e.g. John Doe"
                                aria-invalid={Boolean(validationErrors.fullName)}
                                aria-describedby={
                                    validationErrors.fullName
                                        ? "fullName-error"
                                        : undefined
                                }
                                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-slate-50 dark:read-only:bg-slate-900/60 read-only:cursor-not-allowed"
                            />
                            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                                Uses your current Profile name and cannot be changed for an individual CV.
                            </p>
                            {validationErrors.fullName && (
                                <p
                                    id="fullName-error"
                                    className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                                >
                                    {validationErrors.fullName}
                                </p>
                            )}
                        </div>

                        {/* Email - read-only from Profile */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                            >
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                readOnly
                                disabled={submitting || !isPositionActive}
                                placeholder="e.g. john@example.com"
                                aria-invalid={Boolean(validationErrors.email)}
                                aria-describedby={
                                    validationErrors.email
                                        ? "email-error"
                                        : undefined
                                }
                                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-slate-50 dark:read-only:bg-slate-900/60 read-only:cursor-not-allowed"
                            />
                            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                                Uses your current account email and cannot be changed for an individual CV.
                            </p>
                            {validationErrors.email && (
                                <p
                                    id="email-error"
                                    className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                                >
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div>
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Phone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={submitting || !isPositionActive}
                            placeholder="e.g. +880 1234567890"
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="summary"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Professional Summary
                        </label>
                        <textarea
                            id="summary"
                            name="summary"
                            rows={4}
                            value={formData.summary}
                            onChange={handleChange}
                            disabled={submitting || !isPositionActive}
                            placeholder="Briefly describe your professional background and key strengths..."
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="skills"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Skills
                        </label>
                        <textarea
                            id="skills"
                            name="skills"
                            rows={3}
                            value={formData.skills}
                            onChange={handleChange}
                            disabled={submitting || !isPositionActive}
                            placeholder="e.g. React, Node.js, PostgreSQL, Tailwind CSS"
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="education"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Education
                        </label>
                        <textarea
                            id="education"
                            name="education"
                            rows={3}
                            value={formData.education}
                            onChange={handleChange}
                            disabled={submitting || !isPositionActive}
                            placeholder="e.g. B.Sc. in Computer Science, University of Dhaka, 2020-2024"
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="experience"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Work Experience
                        </label>
                        <textarea
                            id="experience"
                            name="experience"
                            rows={4}
                            value={formData.experience}
                            onChange={handleChange}
                            disabled={submitting || !isPositionActive}
                            placeholder="e.g. Senior Frontend Developer, Google (2022-Present) ..."
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                        />
                    </div>

                    {/* Info Note about Projects */}
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Projects
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Matching Profile Projects are selected automatically using the Position's Technology Tags and configured Project limit.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={submitting}
                            className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !isPositionActive}
                            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FilePlus2 className="h-5 w-5" aria-hidden="true" />
                                    Generate Draft CV
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateCV;