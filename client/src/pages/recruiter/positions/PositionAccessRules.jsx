import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../api/axios";
import {
    ArrowLeft,
    AlertCircle,
    RefreshCw,
    Save,
    Plus,
    Pencil,
    Trash2,
    ShieldCheck,
    Globe2,
    LockKeyhole,
    CheckCircle2,
    X,
    ListChecks,
} from "lucide-react";

const OPERATORS_BY_TYPE = {
    STRING: [
        { value: "EQUALS", label: "Equals" },
        { value: "NOT_EQUALS", label: "Does not equal" },
        { value: "CONTAINS", label: "Contains" },
        { value: "NOT_CONTAINS", label: "Does not contain" },
    ],
    TEXT: [
        { value: "EQUALS", label: "Equals" },
        { value: "NOT_EQUALS", label: "Does not equal" },
        { value: "CONTAINS", label: "Contains" },
        { value: "NOT_CONTAINS", label: "Does not contain" },
    ],
    DROPDOWN: [
        { value: "EQUALS", label: "Equals" },
        { value: "NOT_EQUALS", label: "Does not equal" },
    ],
    NUMERIC: [
        { value: "EQUALS", label: "Equals" },
        { value: "NOT_EQUALS", label: "Does not equal" },
        { value: "GREATER_THAN", label: "Greater than" },
        { value: "GREATER_THAN_OR_EQUAL", label: "Greater than or equal" },
        { value: "LESS_THAN", label: "Less than" },
        { value: "LESS_THAN_OR_EQUAL", label: "Less than or equal" },
    ],
    DATE: [
        { value: "EQUALS", label: "On" },
        { value: "NOT_EQUALS", label: "Not on" },
        { value: "BEFORE", label: "Before" },
        { value: "ON_OR_BEFORE", label: "On or before" },
        { value: "AFTER", label: "After" },
        { value: "ON_OR_AFTER", label: "On or after" },
    ],
    BOOLEAN: [
        { value: "IS_TRUE", label: "Is true" },
        { value: "IS_FALSE", label: "Is false" },
    ],
};

const SUPPORTED_ATTRIBUTE_TYPES = [
    "STRING",
    "TEXT",
    "DROPDOWN",
    "NUMERIC",
    "DATE",
    "BOOLEAN",
];

const formatOperator = (value) => {
    if (!value) return "N/A";
    return value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatAttributeType = (value) => {
    if (!value) return "N/A";
    return value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const PositionAccessRules = () => {
    const { id } = useParams();

    const [position, setPosition] = useState(null);
    const [positionAttributes, setPositionAttributes] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    const [accessType, setAccessType] = useState("PUBLIC");
    const [accessRuleLogic, setAccessRuleLogic] = useState("ALL");
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsMessage, setSettingsMessage] = useState("");

    const [selectedRuleId, setSelectedRuleId] = useState("");
    const [ruleFormOpen, setRuleFormOpen] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState("");
    const [attributeId, setAttributeId] = useState("");
    const [operator, setOperator] = useState("");
    const [ruleValue, setRuleValue] = useState("");
    const [ruleSaving, setRuleSaving] = useState(false);
    const [ruleError, setRuleError] = useState("");
    const [ruleMessage, setRuleMessage] = useState("");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRule, setDeletingRule] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    const selectedRule = rules.find((rule) => rule.id === selectedRuleId) || null;

    const usablePositionAttributes = positionAttributes.filter((item) =>
        SUPPORTED_ATTRIBUTE_TYPES.includes(item.attribute?.type)
    );

    const selectedPositionAttribute =
        usablePositionAttributes.find(
            (item) =>
                item.attributeId === attributeId ||
                item.attribute?.id === attributeId
        ) || null;

    const selectedAttributeType = selectedPositionAttribute?.attribute?.type || "";
    const availableOperators = OPERATORS_BY_TYPE[selectedAttributeType] || [];

    const isNoValueOperator = ["IS_TRUE", "IS_FALSE"].includes(operator);

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredRules = rules.filter((rule) => {
        if (!normalizedSearchTerm) return true;
        return (
            rule.attribute?.name?.toLowerCase().includes(normalizedSearchTerm) ||
            rule.attribute?.category?.toLowerCase().includes(normalizedSearchTerm) ||
            rule.attribute?.type?.toLowerCase().includes(normalizedSearchTerm) ||
            rule.operator?.toLowerCase().includes(normalizedSearchTerm) ||
            rule.value?.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get(`/positions/${id}/access-rules`),
            api.get("/position-attributes"),
        ])
            .then(([rulesResponse, attributesResponse]) => {
                if (cancelled) return;

                const rulesData = rulesResponse.data?.data;
                const positionData = rulesData?.position;

                if (!positionData) {
                    setPosition(null);
                    setRules([]);
                    setError("Position not found.");
                    return;
                }

                const loadedRules = Array.isArray(rulesData?.rules) ? rulesData.rules : [];
                const allPositionAttributes = attributesResponse.data?.data;
                const currentPositionAttributes = Array.isArray(allPositionAttributes)
                    ? allPositionAttributes.filter((item) => item.positionId === id)
                    : [];

                setPosition(positionData);
                setRules(loadedRules);
                setPositionAttributes(currentPositionAttributes);

                setAccessType(
                    positionData.accessType === "RESTRICTED" ? "RESTRICTED" : "PUBLIC"
                );
                setAccessRuleLogic(
                    positionData.accessRuleLogic === "ANY" ? "ANY" : "ALL"
                );

                setSelectedRuleId("");
                setRuleFormOpen(false);
                setEditingRuleId("");
                setAttributeId("");
                setOperator("");
                setRuleValue("");
                setSearchTerm("");

                setError("");
                setSettingsError("");
                setSettingsMessage("");
                setRuleError("");
                setRuleMessage("");
                setDeleteError("");
            })
            .catch((requestError) => {
                if (cancelled) return;
                setPosition(null);
                setRules([]);
                setPositionAttributes([]);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load Position Access Rules. Please try again."
                );
                console.error("Failed to load Position Access Rules:", requestError.message);
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
        setRetryCounter((prev) => prev + 1);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setSelectedRuleId("");
        setRuleError("");
        setRuleMessage("");
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setSelectedRuleId("");
        setRuleError("");
        setRuleMessage("");
    };

    const handleSaveSettings = async () => {
        if (settingsSaving || !position) return;

        try {
            setSettingsSaving(true);
            setSettingsError("");
            setSettingsMessage("");

            const response = await api.patch(`/positions/${id}/access-settings`, {
                accessType,
                accessRuleLogic,
            });

            const data = response.data?.data;
            if (!data) throw new Error("Access settings update returned invalid data.");

            setPosition((current) =>
                current
                    ? {
                        ...current,
                        accessType: data.accessType,
                        accessRuleLogic: data.accessRuleLogic,
                    }
                    : current
            );
            setAccessType(data.accessType);
            setAccessRuleLogic(data.accessRuleLogic);
            setSettingsMessage(
                response.data?.message || "Position Access settings updated successfully."
            );
        } catch (requestError) {
            setSettingsError(
                requestError.response?.data?.message ||
                "Failed to update Position Access settings. Please try again."
            );
            console.error("Failed to update Position Access settings:", requestError.message);
        } finally {
            setSettingsSaving(false);
        }
    };

    const resetRuleForm = () => {
        setRuleFormOpen(false);
        setEditingRuleId("");
        setAttributeId("");
        setOperator("");
        setRuleValue("");
        setRuleError("");
    };

    const handleOpenCreate = () => {
        if (usablePositionAttributes.length === 0) {
            setRuleError("No supported Position Attributes are available for Access Rules.");
            return;
        }
        setSelectedRuleId("");
        setEditingRuleId("");
        setAttributeId("");
        setOperator("");
        setRuleValue("");
        setRuleError("");
        setRuleMessage("");
        setRuleFormOpen(true);
    };

    const handleOpenEdit = () => {
        if (!selectedRule) return;
        setEditingRuleId(selectedRule.id);
        setAttributeId(selectedRule.attributeId);
        setOperator(selectedRule.operator);
        setRuleValue(selectedRule.value || "");
        setRuleError("");
        setRuleMessage("");
        setRuleFormOpen(true);
    };

    const handleAttributeChange = (event) => {
        const nextAttributeId = event.target.value;
        const nextPositionAttribute = usablePositionAttributes.find(
            (item) =>
                item.attributeId === nextAttributeId || item.attribute?.id === nextAttributeId
        );
        const nextType = nextPositionAttribute?.attribute?.type || "";
        const nextOperators = OPERATORS_BY_TYPE[nextType] || [];

        setAttributeId(nextAttributeId);
        setOperator(nextOperators[0]?.value || "");
        setRuleValue("");
        setRuleError("");
    };

    const validateRuleForm = () => {
        if (!attributeId) return "Please select an Attribute.";
        if (!operator) return "Please select an Operator.";
        if (!availableOperators.some((op) => op.value === operator)) {
            return "The selected operator is not supported for this Attribute type.";
        }
        if (isNoValueOperator) return "";
        if (!ruleValue || ruleValue.trim() === "") {
            return "Please enter a comparison value.";
        }

        const trimmed = ruleValue.trim();

        if (selectedAttributeType === "NUMERIC") {
            const num = Number(trimmed);
            if (!Number.isFinite(num)) {
                return "Please enter a valid numeric comparison value.";
            }
        }

        if (selectedAttributeType === "DATE") {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                return "Please enter a valid date in YYYY-MM-DD format.";
            }
            const [year, month, day] = trimmed.split("-").map(Number);
            const date = new Date(Date.UTC(year, month - 1, day));
            if (
                date.getUTCFullYear() !== year ||
                date.getUTCMonth() !== month - 1 ||
                date.getUTCDate() !== day
            ) {
                return "Please enter a valid calendar date.";
            }
        }

        return "";
    };

    const handleSaveRule = async (event) => {
        event.preventDefault();

        if (ruleSaving) return;

        const validationError = validateRuleForm();
        if (validationError) {
            setRuleError(validationError);
            return;
        }

        try {
            setRuleSaving(true);
            setRuleError("");
            setRuleMessage("");

            const payload = {
                attributeId,
                operator,
                value: isNoValueOperator ? null : ruleValue.trim(),
            };

            const response = editingRuleId
                ? await api.patch(
                    `/positions/${id}/access-rules/${editingRuleId}`,
                    payload
                )
                : await api.post(`/positions/${id}/access-rules`, payload);

            const data = response.data?.data;
            if (!data) throw new Error("Access Rule update returned invalid data.");

            setRules((currentRules) =>
                editingRuleId
                    ? currentRules.map((rule) => (rule.id === data.id ? data : rule))
                    : [...currentRules, data]
            );

            setSelectedRuleId(data.id);
            setRuleMessage(
                response.data?.message ||
                (editingRuleId
                    ? "Position Access Rule updated successfully."
                    : "Position Access Rule created successfully.")
            );

            setRuleFormOpen(false);
            setEditingRuleId("");
            setAttributeId("");
            setOperator("");
            setRuleValue("");
        } catch (requestError) {
            setRuleError(
                requestError.response?.data?.message ||
                "Failed to save Position Access Rule. Please try again."
            );
            console.error("Failed to save Position Access Rule:", requestError.message);
        } finally {
            setRuleSaving(false);
        }
    };

    const handleSelectRule = (ruleId) => {
        setSelectedRuleId((currentId) => (currentId === ruleId ? "" : ruleId));
        setRuleError("");
        setRuleMessage("");
    };

    const handleOpenDelete = () => {
        if (!selectedRule) return;
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const handleCloseDelete = () => {
        if (deletingRule) return;
        setDeleteDialogOpen(false);
        setDeleteError("");
    };

    const handleDeleteRule = async () => {
        if (!selectedRule || deletingRule) return;

        try {
            setDeletingRule(true);
            setDeleteError("");

            await api.delete(`/positions/${id}/access-rules/${selectedRule.id}`);

            setRules((currentRules) =>
                currentRules.filter((rule) => rule.id !== selectedRule.id)
            );
            setSelectedRuleId("");
            setDeleteDialogOpen(false);
            setRuleMessage("Position Access Rule deleted successfully.");
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to delete Position Access Rule. Please try again."
            );
            console.error("Failed to delete Position Access Rule:", requestError.message);
        } finally {
            setDeletingRule(false);
        }
    };

    const usedAttributeIds = new Set(
        rules
            .filter((rule) => rule.id !== editingRuleId)
            .map((rule) => rule.attributeId)
    );

    if (loading) {
        return (
            <div className="min-h-[320px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" aria-hidden="true" />
                <span>Loading Position Access Rules...</span>
            </div>
        );
    }

    if (error && !position) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/positions/${id}`}
                            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                            Back to Position
                        </Link>
                    </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Position Access Rules</h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-200 dark:bg-red-800/50 dark:hover:bg-red-800/70 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/positions/${id}`}
                        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                        Back to Position
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Position Access Rules</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage Candidate eligibility for {position?.title || "Position"}.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to={`/positions/${id}/attributes`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ListChecks className="w-4 h-4 mr-2" aria-hidden="true" />
                        Manage Attributes
                    </Link>
                </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Access Settings</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position?.isActive
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                            >
                                {position?.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-5">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Access Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setAccessType("PUBLIC")}
                                aria-pressed={accessType === "PUBLIC"}
                                className={`relative flex items-start p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${accessType === "PUBLIC"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${accessType === "PUBLIC"
                                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                                                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                            }`}
                                    >
                                        <Globe2 className="w-5 h-5" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">Public</span>
                                            {accessType === "PUBLIC" && (
                                                <CheckCircle2 className="w-4 h-4 text-blue-500" aria-hidden="true" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            All Candidates can access this active Position.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAccessType("RESTRICTED")}
                                aria-pressed={accessType === "RESTRICTED"}
                                className={`relative flex items-start p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${accessType === "RESTRICTED"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${accessType === "RESTRICTED"
                                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                                                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                            }`}
                                    >
                                        <LockKeyhole className="w-5 h-5" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">Restricted</span>
                                            {accessType === "RESTRICTED" && (
                                                <CheckCircle2 className="w-4 h-4 text-blue-500" aria-hidden="true" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Only Candidates who satisfy the configured Access Rules can access this Position.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {accessType === "RESTRICTED" && (
                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rule Logic</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAccessRuleLogic("ALL")}
                                    aria-pressed={accessRuleLogic === "ALL"}
                                    className={`relative flex items-start p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${accessRuleLogic === "ALL"
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">All</span>
                                                {accessRuleLogic === "ALL" && (
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500" aria-hidden="true" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Every Access Rule must pass.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAccessRuleLogic("ANY")}
                                    aria-pressed={accessRuleLogic === "ANY"}
                                    className={`relative flex items-start p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${accessRuleLogic === "ANY"
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Any</span>
                                                {accessRuleLogic === "ANY" && (
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500" aria-hidden="true" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                At least one Access Rule must pass.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {accessType === "RESTRICTED" && rules.length === 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" role="status">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        This Restricted Position currently has no Access Rules. Candidates will not be able to access it until at least one rule is added.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {accessType === "PUBLIC" && rules.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" role="status">
                            <div className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Stored Access Rules are currently ignored because this Position is Public.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Feedback */}
                    {settingsError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3" role="alert">
                            <div className="flex items-start">
                                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                                <p className="text-sm text-red-700 dark:text-red-300">{settingsError}</p>
                            </div>
                        </div>
                    )}

                    {settingsMessage && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3" role="status">
                            <div className="flex items-start">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">{settingsMessage}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleSaveSettings}
                            disabled={settingsSaving}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {settingsSaving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                                    Save Access Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Rules Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <ListChecks className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Access Rules</h2>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {rules.length} Rule{rules.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Rules compare Position requirements with Candidate Profile Attributes.
                        </p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Page-level Rule Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {selectedRule ? (
                                    <>
                                        <span className="font-medium">Selected:</span> {selectedRule.attribute?.name || "Attribute"}
                                    </>
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400">Select a rule to edit or delete it.</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                disabled={usablePositionAttributes.length === 0}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                                Add Rule
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenEdit}
                                disabled={!selectedRule || ruleSaving}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Pencil className="w-4 h-4 mr-1.5" aria-hidden="true" />
                                Edit Rule
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenDelete}
                                disabled={!selectedRule || deletingRule}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-400 dark:bg-gray-800 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                                Delete Rule
                            </button>
                        </div>
                    </div>

                    {/* Rule Feedback */}
                    {ruleMessage && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3" role="status">
                            <div className="flex items-start">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">{ruleMessage}</p>
                            </div>
                        </div>
                    )}

                    {ruleError && !ruleFormOpen && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3" role="alert">
                            <div className="flex items-start">
                                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                                <p className="text-sm text-red-700 dark:text-red-300">{ruleError}</p>
                            </div>
                        </div>
                    )}

                    {/* Rule Form */}
                    {ruleFormOpen && (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <form onSubmit={handleSaveRule} className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {editingRuleId ? "Edit Access Rule" : "Add Access Rule"}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="attribute-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Attribute
                                        </label>
                                        <select
                                            id="attribute-select"
                                            value={attributeId}
                                            onChange={handleAttributeChange}
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        >
                                            <option value="">Select an Attribute</option>
                                            {usablePositionAttributes.map((item) => {
                                                const attr = item.attribute;
                                                const isUsed = usedAttributeIds.has(attr.id);
                                                return (
                                                    <option
                                                        key={attr.id}
                                                        value={attr.id}
                                                        disabled={isUsed}
                                                    >
                                                        {attr.name} ({attr.category} • {formatAttributeType(attr.type)})
                                                        {isUsed ? " (Already used)" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="operator-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Operator
                                        </label>
                                        <select
                                            id="operator-select"
                                            value={operator}
                                            onChange={(e) => {
                                                const nextOp = e.target.value;
                                                setOperator(nextOp);
                                                setRuleError("");
                                                if (["IS_TRUE", "IS_FALSE"].includes(nextOp)) {
                                                    setRuleValue("");
                                                }
                                            }}
                                            required
                                            disabled={!attributeId}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        >
                                            <option value="">Select an Operator</option>
                                            {availableOperators.map((op) => (
                                                <option key={op.value} value={op.value}>
                                                    {op.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {!isNoValueOperator && operator && (
                                    <div className="max-w-xs">
                                        <label htmlFor="rule-value-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Comparison Value
                                        </label>
                                        <input
                                            id="rule-value-input"
                                            type={selectedAttributeType === "NUMERIC" ? "number" : selectedAttributeType === "DATE" ? "date" : "text"}
                                            value={ruleValue}
                                            onChange={(e) => {
                                                setRuleValue(e.target.value);
                                                setRuleError("");
                                            }}
                                            step={selectedAttributeType === "NUMERIC" ? "any" : undefined}
                                            placeholder={
                                                selectedAttributeType === "DATE"
                                                    ? "YYYY-MM-DD"
                                                    : selectedAttributeType === "NUMERIC"
                                                        ? "Enter a number"
                                                        : "Enter a value"
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        />
                                    </div>
                                )}

                                {ruleError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3" role="alert">
                                        <div className="flex items-start">
                                            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                                            <p className="text-sm text-red-700 dark:text-red-300">{ruleError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetRuleForm}
                                        disabled={ruleSaving}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={ruleSaving}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {ruleSaving ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                                Saving...
                                            </>
                                        ) : editingRuleId ? (
                                            "Update Rule"
                                        ) : (
                                            "Save Rule"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Search */}
                    {rules.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-xs">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search rules..."
                                    aria-label="Search Access Rules"
                                    className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                <ListChecks className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label="Clear search"
                                    >
                                        <X className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Rule Table */}
                    {rules.length === 0 ? (
                        <div className="text-center py-10">
                            <ListChecks className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true" />
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">No Access Rules configured</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Add a rule to define which Candidates may access this Restricted Position.
                            </p>
                        </div>
                    ) : filteredRules.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No matching Access Rules found.</p>
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 w-10">
                                            <span className="sr-only">Select</span>
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-medium">Attribute</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Category</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Type</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Operator</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Comparison Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredRules.map((rule) => (
                                        <tr
                                            key={rule.id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedRuleId === rule.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRuleId === rule.id}
                                                    onChange={() => handleSelectRule(rule.id)}
                                                    aria-label={`Select Access Rule for ${rule.attribute?.name || "Attribute"}`}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {rule.attribute?.name || "Unknown"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {rule.attribute?.category || "N/A"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {formatAttributeType(rule.attribute?.type)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {formatOperator(rule.operator)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {["IS_TRUE", "IS_FALSE"].includes(rule.operator)
                                                    ? rule.operator === "IS_TRUE"
                                                        ? "True"
                                                        : "False"
                                                    : rule.value || "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-gray-900/70 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-access-rule-title"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        <button
                            type="button"
                            onClick={handleCloseDelete}
                            disabled={deletingRule}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" aria-hidden="true" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <h3 id="delete-access-rule-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                                Delete Access Rule
                            </h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Are you sure you want to delete the Access Rule for{" "}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {selectedRule?.attribute?.name || "this Attribute"}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3" role="alert">
                                <div className="flex items-start">
                                    <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                                    <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleCloseDelete}
                                disabled={deletingRule}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteRule}
                                disabled={deletingRule}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {deletingRule ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" aria-hidden="true" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Rule"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PositionAccessRules;