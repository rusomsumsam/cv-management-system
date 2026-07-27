import { useState, useEffect } from "react";
import { Link, createSearchParams } from "react-router-dom";
import {
    RefreshCw,
    AlertCircle,
    Clock,
    Briefcase,
    Users,
    UserCircle,
    FileText,
    Tag,
    ChevronRight,
    ArrowRight,
    LogIn,
    UserPlus,
} from "lucide-react";
import api from "../api/axios";

// --- Helpers ---

const safeNonNegativeInt = (value) => {
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
        return value;
    }
    return 0;
};

const formatDate = (dateString, language = "en") => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    try {
        const locale = language === "bn" ? "bn-BD" : "en-US";
        return date.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "N/A";
    }
};

const extractTagNames = (position) => {
    if (
        !position ||
        typeof position !== "object" ||
        !Array.isArray(position.positionTags)
    ) {
        return [];
    }

    const tags = [];
    const seen = new Set();

    for (const positionTag of position.positionTags) {
        const rawName = positionTag?.tag?.name;

        if (typeof rawName !== "string") {
            continue;
        }

        const name = rawName.trim();

        if (!name) {
            continue;
        }

        const normalizedName = name.toLowerCase();

        if (seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);
        tags.push(name);
    }

    return tags;
};

const renderTagChips = (position, language = "en") => {
    const tagNames = extractTagNames(position);

    if (tagNames.length === 0) {
        return (
            <span className="text-xs text-slate-400 dark:text-slate-500">
                {language === "bn" ? "কোনো ট্যাগ নেই" : "No Tags"}
            </span>
        );
    }

    const displayTags = tagNames.slice(0, 3);
    const remaining = tagNames.length - 3;

    return (
        <div className="flex flex-wrap gap-1.5">
            {displayTags.map((name) => (
                <span
                    key={`${position.id}-tag-${name.toLowerCase()}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                    {name}
                </span>
            ))}
            {remaining > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    +{remaining}{" "}
                    {language === "bn" ? "আরও" : "more"}
                </span>
            )}
        </div>
    );
};

const renderDescriptionPreview = (description, language = "en") => {
    if (typeof description !== "string" || !description.trim()) {
        return (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {language === "bn" ? "কোনো বিবরণ দেওয়া হয়নি।" : "No description provided."}
            </p>
        );
    }

    const trimmed = description.trim();
    const maxLength = 70;
    const preview = trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;

    return (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {preview}
        </p>
    );
};

// --- Component ---

const Home = () => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem("cvms-language");
        return saved === "bn" ? "bn" : "en";
    });

    const [homeData, setHomeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    // --- Translations ---

    const t = {
        en: {
            heroHeading: "Build tailored CVs for the right Positions",
            heroDescription:
                "Resumate connects Candidate Profiles with customizable Position templates to generate structured, relevant CVs automatically.",
            heroPrimary: "Browse Positions",
            heroSecondary: "Create Account",
            statsHeading: "Platform Statistics",
            statCvs24h: "CVs in Last 24 Hours",
            statPositions: "Public Positions",
            statCandidates: "Candidates",
            statRecruiters: "Recruiters",
            statSubmitted: "Submitted CVs",
            latestHeading: "Latest Positions",
            latestDescription: "Recently created or updated public Positions.",
            latestEmpty: "No public Positions are currently available.",
            latestViewAll: "View all Positions",
            popularHeading: "Most Popular Positions",
            popularDescription: "Top public Positions ranked by submitted CVs.",
            popularEmpty: "No popular Positions are currently available.",
            tagsHeading: "Technology Tags",
            tagsDescription: "Explore public Positions by the technologies they require.",
            tagsEmpty: "No Technology Tags are currently available.",
            ctaHeading: "Ready to create a tailored CV?",
            ctaDescription:
                "Create a Candidate account, complete your reusable Profile, and generate Position-specific CVs.",
            ctaCreate: "Create Account",
            ctaSignIn: "Sign In",
            loading: "Loading the Home page...",
            errorHeading: "Unable to load the Home page",
            errorMessage: "Failed to load the public Home page. Please try again.",
            retry: "Retry",
            position: "Position",
            company: "Company",
            location: "Location",
            technologyTags: "Technology Tags",
            updated: "Updated",
            rank: "Rank",
            submittedCvs: "Submitted CVs",
        },
        bn: {
            heroHeading: "সঠিক পজিশনের জন্য উপযোগী সিভি তৈরি করুন",
            heroDescription:
                "Resumate ক্যান্ডিডেট প্রোফাইলকে কাস্টমাইজযোগ্য পজিশন টেমপ্লেটের সঙ্গে যুক্ত করে স্বয়ংক্রিয়ভাবে কাঠামোবদ্ধ ও প্রাসঙ্গিক সিভি তৈরি করে।",
            heroPrimary: "পজিশন দেখুন",
            heroSecondary: "অ্যাকাউন্ট তৈরি করুন",
            statsHeading: "প্ল্যাটফর্ম পরিসংখ্যান",
            statCvs24h: "গত ২৪ ঘণ্টার সিভি",
            statPositions: "পাবলিক পজিশন",
            statCandidates: "ক্যান্ডিডেট",
            statRecruiters: "রিক্রুটার",
            statSubmitted: "জমা দেওয়া সিভি",
            latestHeading: "সর্বশেষ পজিশন",
            latestDescription: "সম্প্রতি তৈরি বা আপডেট করা পাবলিক পজিশন।",
            latestEmpty: "বর্তমানে কোনো পাবলিক পজিশন পাওয়া যাচ্ছে না।",
            latestViewAll: "সব পজিশন দেখুন",
            popularHeading: "সবচেয়ে জনপ্রিয় পজিশন",
            popularDescription: "জমা দেওয়া সিভির সংখ্যা অনুযায়ী শীর্ষ পাবলিক পজিশন।",
            popularEmpty: "বর্তমানে জনপ্রিয় কোনো পজিশন পাওয়া যাচ্ছে না।",
            tagsHeading: "টেকনোলজি ট্যাগ",
            tagsDescription: "প্রয়োজনীয় প্রযুক্তি অনুযায়ী পাবলিক পজিশন খুঁজুন।",
            tagsEmpty: "বর্তমানে কোনো টেকনোলজি ট্যাগ পাওয়া যাচ্ছে না।",
            ctaHeading: "উপযোগী সিভি তৈরি করতে প্রস্তুত?",
            ctaDescription:
                "একটি ক্যান্ডিডেট অ্যাকাউন্ট তৈরি করুন, পুনর্ব্যবহারযোগ্য প্রোফাইল সম্পূর্ণ করুন এবং পজিশনভিত্তিক সিভি তৈরি করুন।",
            ctaCreate: "অ্যাকাউন্ট তৈরি করুন",
            ctaSignIn: "লগইন",
            loading: "হোম পেজ লোড হচ্ছে...",
            errorHeading: "হোম পেজ লোড করা যায়নি",
            errorMessage: "পাবলিক হোম পেজ লোড করা যায়নি। আবার চেষ্টা করুন।",
            retry: "আবার চেষ্টা করুন",
            position: "পজিশন",
            company: "কোম্পানি",
            location: "অবস্থান",
            technologyTags: "টেকনোলজি ট্যাগ",
            updated: "আপডেট",
            rank: "ক্রম",
            submittedCvs: "জমা দেওয়া সিভি",
        },
    };

    const tr = t[language] || t.en;

    // --- Language synchronization ---

    useEffect(() => {
        const handleLanguageChange = (event) => {
            const detail = event.detail;
            if (detail === "en" || detail === "bn") {
                setLanguage(detail);
            }
        };

        const handleStorageChange = (event) => {
            if (event.key === "cvms-language") {
                const newValue = event.newValue;
                if (newValue === "en" || newValue === "bn") {
                    setLanguage(newValue);
                }
            }
        };

        window.addEventListener("cvms-language-change", handleLanguageChange);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("cvms-language-change", handleLanguageChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // --- Fetch home data ---

    useEffect(() => {
        let cancelled = false;

        const fetchHomeData = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/public/home");
                const responseData = response.data;

                if (!cancelled) {
                    const data = responseData?.data;

                    if (!data || typeof data !== "object") {
                        setHomeData(null);
                        setError("HOME_LOAD_FAILED");
                        setLoading(false);
                        return;
                    }

                    const normalized = {
                        latestPositions: Array.isArray(data.latestPositions) ? data.latestPositions : [],
                        popularPositions: Array.isArray(data.popularPositions) ? data.popularPositions : [],
                        technologyTags: Array.isArray(data.technologyTags) ? data.technologyTags : [],
                        statistics: {
                            cvsCreatedLast24Hours: safeNonNegativeInt(data.statistics?.cvsCreatedLast24Hours),
                            totalPositions: safeNonNegativeInt(data.statistics?.totalPositions),
                            totalCandidates: safeNonNegativeInt(data.statistics?.totalCandidates),
                            totalRecruiters: safeNonNegativeInt(data.statistics?.totalRecruiters),
                            totalSubmittedCVs: safeNonNegativeInt(data.statistics?.totalSubmittedCVs),
                        },
                    };

                    setHomeData(normalized);
                }
            } catch (requestError) {
                if (!cancelled) {
                    const apiMessage = requestError.response?.data?.message;
                    setHomeData(null);
                    setError(
                        typeof apiMessage === "string" && apiMessage.trim()
                            ? apiMessage.trim()
                            : "HOME_LOAD_FAILED"
                    );
                    console.error(
                        "Public Home load failed:",
                        requestError.message
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchHomeData();

        return () => {
            cancelled = true;
        };
    }, [retryCounter]);

    // --- Retry handler ---

    const handleRetry = () => {
        setError("");
        setLoading(true);
        setRetryCounter((prev) => prev + 1);
    };

    // --- Loading state ---

    if (loading) {
        return (
            <main className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin" aria-hidden="true" />
                    <span className="text-base font-medium">{tr.loading}</span>
                </div>
            </main>
        );
    }

    // --- Error state ---

    if (error) {
        const displayedError = error === "HOME_LOAD_FAILED" ? tr.errorMessage : error;

        return (
            <main className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4">
                <div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md text-center"
                    role="alert"
                >
                    <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                        {tr.errorHeading}
                    </h2>
                    <p className="text-red-600 dark:text-red-300 mb-6">{displayedError}</p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                    >
                        {tr.retry}
                    </button>
                </div>
            </main>
        );
    }

    // --- Empty state (no data) ---

    if (!homeData) {
        return (
            <main className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4">
                <div className="text-center max-w-md">
                    <Briefcase className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {tr.errorHeading}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{tr.errorMessage}</p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                    >
                        {tr.retry}
                    </button>
                </div>
            </main>
        );
    }

    const {
        latestPositions = [],
        popularPositions = [],
        technologyTags = [],
        statistics = {},
    } = homeData;

    // --- Tag Cloud deduplication ---

    const dedupedTags = [];
    const seenTagNames = new Set();

    for (const tag of technologyTags) {
        if (!tag || typeof tag !== "object") continue;
        const id = tag.id;
        const rawName = tag.name;
        const rawNormalizedName = tag.normalizedName;
        const positionCount = tag.positionCount;

        if (typeof id !== "string" || !id.trim()) continue;
        if (typeof rawName !== "string") continue;
        const name = rawName.trim();
        if (!name) continue;
        if (typeof rawNormalizedName !== "string") continue;
        const normalizedName = rawNormalizedName.trim().toLowerCase();
        if (!normalizedName) continue;
        const count = safeNonNegativeInt(positionCount);

        if (seenTagNames.has(normalizedName)) continue;
        seenTagNames.add(normalizedName);

        dedupedTags.push({
            id,
            name,
            normalizedName,
            positionCount: count,
        });
    }

    // --- Render ---

    return (
        <main className="bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 pt-6">
                {/* ========== Hero Section ========== */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 p-8 sm:p-12 mb-12 shadow-lg">
                    <div className="relative z-10 max-w-3xl">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                            {tr.heroHeading}
                        </h1>
                        <p className="text-lg text-blue-50 dark:text-blue-100 mb-8 max-w-2xl">
                            {tr.heroDescription}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/public/positions"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                            >
                                {tr.heroPrimary}
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                            >
                                {tr.heroSecondary}
                                <UserPlus className="w-4 h-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ========== Statistics ========== */}
                <section className="mb-12" aria-label={tr.statsHeading}>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{tr.statsHeading}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {statistics.cvsCreatedLast24Hours}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {tr.statCvs24h}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-full">
                                    <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {statistics.totalPositions}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {tr.statPositions}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {statistics.totalCandidates}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {tr.statCandidates}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-full">
                                    <UserCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {statistics.totalRecruiters}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {tr.statRecruiters}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full">
                                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {statistics.totalSubmittedCVs}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {tr.statSubmitted}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== Latest Positions ========== */}
                <section className="mb-12" aria-label={tr.latestHeading}>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tr.latestHeading}</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">{tr.latestDescription}</p>
                        </div>
                        <Link
                            to="/public/positions"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm focus:outline-none focus:underline"
                        >
                            {tr.latestViewAll}
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </div>

                    {latestPositions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                            <p className="text-slate-500 dark:text-slate-400">{tr.latestEmpty}</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.position}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.company}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.location}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.technologyTags}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.updated}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {latestPositions.slice(0, 5).map((position) => (
                                            <tr
                                                key={position.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <Link
                                                        to={`/public/positions/${position.id}`}
                                                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
                                                    >
                                                        {position.title}
                                                    </Link>
                                                    {renderDescriptionPreview(position.description, language)}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                    {position.company || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                    {position.location || "—"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {renderTagChips(position, language)}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                    {formatDate(position.updatedAt, language)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

                {/* ========== Popular Positions ========== */}
                <section className="mb-12" aria-label={tr.popularHeading}>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tr.popularHeading}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{tr.popularDescription}</p>
                    </div>

                    {popularPositions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                            <p className="text-slate-500 dark:text-slate-400">{tr.popularEmpty}</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.rank}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.position}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.company}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.submittedCvs}
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                {tr.updated}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {popularPositions.slice(0, 5).map((position, index) => {
                                            const cvsCount = safeNonNegativeInt(position.publishedCvsCount);
                                            return (
                                                <tr
                                                    key={position.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                                                        #{index + 1}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            to={`/public/positions/${position.id}`}
                                                            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
                                                        >
                                                            {position.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                        {position.company || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                        {cvsCount}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                        {formatDate(position.updatedAt, language)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

                {/* ========== Technology Tag Cloud ========== */}
                <section className="mb-12" aria-label={tr.tagsHeading}>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tr.tagsHeading}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{tr.tagsDescription}</p>
                    </div>

                    {dedupedTags.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                            <p className="text-slate-500 dark:text-slate-400">{tr.tagsEmpty}</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex flex-wrap gap-3">
                                {dedupedTags.map((tag) => {
                                    let sizeClass = "text-sm";
                                    if (tag.positionCount >= 5) {
                                        sizeClass = "text-lg";
                                    } else if (tag.positionCount >= 2) {
                                        sizeClass = "text-base";
                                    }

                                    const searchParams = createSearchParams({
                                        focus: "search",
                                        query: tag.normalizedName,
                                    });

                                    return (
                                        <Link
                                            key={tag.id}
                                            to={`/public/positions?${searchParams}`}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${sizeClass}`}
                                        >
                                            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span>{tag.name}</span>
                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">
                                                · {tag.positionCount}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* ========== Final CTA ========== */}
                <section
                    className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-8 sm:p-12 text-center"
                    aria-label={tr.ctaHeading}
                >
                    <h2 className="text-3xl font-bold text-white mb-3">{tr.ctaHeading}</h2>
                    <p className="text-slate-300 max-w-2xl mx-auto mb-8">{tr.ctaDescription}</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                            {tr.ctaCreate}
                            <UserPlus className="w-4 h-4" aria-hidden="true" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                            {tr.ctaSignIn}
                            <LogIn className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Home;