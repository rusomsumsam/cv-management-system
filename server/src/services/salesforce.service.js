const DEFAULT_SALESFORCE_API_VERSION = "v67.0";

const getRequiredEnvironmentValue = (name) => {
    const value = process.env[name];

    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {
        throw new Error(`${name} is not configured.`);
    }

    return value.trim();
};

const getSalesforceConfiguration = () => {
    const loginUrl = getRequiredEnvironmentValue(
        "SALESFORCE_LOGIN_URL"
    ).replace(/\/+$/, "");

    const clientId = getRequiredEnvironmentValue(
        "SALESFORCE_CLIENT_ID"
    );

    const clientSecret = getRequiredEnvironmentValue(
        "SALESFORCE_CLIENT_SECRET"
    );

    const configuredApiVersion =
        typeof process.env.SALESFORCE_API_VERSION ===
            "string" &&
            process.env.SALESFORCE_API_VERSION.trim()
            ? process.env.SALESFORCE_API_VERSION.trim()
            : DEFAULT_SALESFORCE_API_VERSION;

    const apiVersion = configuredApiVersion.startsWith("v")
        ? configuredApiVersion
        : `v${configuredApiVersion}`;

    return {
        loginUrl,
        clientId,
        clientSecret,
        apiVersion,
    };
};

const parseJsonResponse = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const normalizeRequiredString = (
    value,
    fieldName
) => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error(`${fieldName} is required.`);
    }

    return value.trim();
};

const normalizeOptionalString = (
    value,
    maxLength
) => {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return null;
    }

    return normalizedValue.slice(0, maxLength);
};

const getSalesforceAccess = async () => {
    const {
        loginUrl,
        clientId,
        clientSecret,
    } = getSalesforceConfiguration();

    const requestBody = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(
        `${loginUrl}/services/oauth2/token`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
            },
            body: requestBody.toString(),
        }
    );

    const responseData =
        await parseJsonResponse(response);

    if (!response.ok) {
        const authenticationError =
            responseData?.error_description ||
            responseData?.error ||
            `Salesforce authentication failed with status ${response.status}.`;

        throw new Error(authenticationError);
    }

    if (
        !responseData ||
        typeof responseData.access_token !== "string" ||
        !responseData.access_token.trim() ||
        typeof responseData.instance_url !== "string" ||
        !responseData.instance_url.trim()
    ) {
        throw new Error(
            "Salesforce returned an invalid authentication response."
        );
    }

    return {
        accessToken:
            responseData.access_token.trim(),
        instanceUrl:
            responseData.instance_url
                .trim()
                .replace(/\/+$/, ""),
    };
};

const createSalesforceAccountWithContact =
    async ({
        accountName,
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        location,
        notes,
        sourceUserId,
        sourceUserRole,
    }) => {
        const normalizedAccountName =
            normalizeRequiredString(
                accountName,
                "Account name"
            ).slice(0, 255);

        const normalizedLastName =
            normalizeRequiredString(
                lastName,
                "Last name"
            ).slice(0, 80);

        const normalizedFirstName =
            normalizeOptionalString(
                firstName,
                40
            );

        const normalizedEmail =
            normalizeOptionalString(
                email,
                80
            );

        const normalizedPhone =
            normalizeOptionalString(
                phone,
                40
            );

        const normalizedJobTitle =
            normalizeOptionalString(
                jobTitle,
                128
            );

        const normalizedLocation =
            normalizeOptionalString(
                location,
                40
            );

        const normalizedNotes =
            normalizeOptionalString(
                notes,
                32000
            );

        const normalizedSourceUserId =
            normalizeOptionalString(
                sourceUserId,
                255
            );

        const normalizedSourceUserRole =
            normalizeOptionalString(
                sourceUserRole,
                255
            );

        const sourceDetails = [
            "Source: CV Management System",
            normalizedSourceUserId
                ? `Source User ID: ${normalizedSourceUserId}`
                : null,
            normalizedSourceUserRole
                ? `Source User Role: ${normalizedSourceUserRole}`
                : null,
            normalizedNotes
                ? `Notes: ${normalizedNotes}`
                : null,
        ]
            .filter(Boolean)
            .join("\n");

        const contactRecord = {
            attributes: {
                type: "Contact",
                referenceId: "contactRef",
            },
            LastName: normalizedLastName,
        };

        if (normalizedFirstName) {
            contactRecord.FirstName =
                normalizedFirstName;
        }

        if (normalizedEmail) {
            contactRecord.Email =
                normalizedEmail;
        }

        if (normalizedPhone) {
            contactRecord.Phone =
                normalizedPhone;
        }

        if (normalizedJobTitle) {
            contactRecord.Title =
                normalizedJobTitle;
        }

        if (normalizedLocation) {
            contactRecord.MailingCity =
                normalizedLocation;
        }

        if (sourceDetails) {
            contactRecord.Description =
                sourceDetails;
        }

        const accountRecord = {
            attributes: {
                type: "Account",
                referenceId: "accountRef",
            },
            Name: normalizedAccountName,
            Description: sourceDetails,
            Contacts: {
                records: [
                    contactRecord,
                ],
            },
        };

        if (normalizedPhone) {
            accountRecord.Phone =
                normalizedPhone;
        }

        if (normalizedLocation) {
            accountRecord.BillingCity =
                normalizedLocation;
        }

        const {
            accessToken,
            instanceUrl,
        } = await getSalesforceAccess();

        const { apiVersion } =
            getSalesforceConfiguration();

        const response = await fetch(
            `${instanceUrl}/services/data/${apiVersion}/composite/tree/Account`,
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    records: [
                        accountRecord,
                    ],
                }),
            }
        );

        const responseData =
            await parseJsonResponse(response);

        if (!response.ok) {
            const treeError =
                responseData?.results?.[0]
                    ?.errors?.[0];

            const errorMessage =
                treeError?.message ||
                responseData?.[0]?.message ||
                `Salesforce record creation failed with status ${response.status}.`;

            throw new Error(errorMessage);
        }

        if (
            !responseData ||
            responseData.hasErrors === true ||
            !Array.isArray(responseData.results)
        ) {
            const treeError =
                responseData?.results?.find(
                    (result) =>
                        Array.isArray(
                            result.errors
                        ) &&
                        result.errors.length > 0
                )?.errors?.[0];

            throw new Error(
                treeError?.message ||
                "Salesforce returned an invalid record creation response."
            );
        }

        const accountResult =
            responseData.results.find(
                (result) =>
                    result.referenceId ===
                    "accountRef"
            );

        const contactResult =
            responseData.results.find(
                (result) =>
                    result.referenceId ===
                    "contactRef"
            );

        if (
            typeof accountResult?.id !== "string" ||
            typeof contactResult?.id !== "string"
        ) {
            throw new Error(
                "Salesforce did not return the created Account and Contact IDs."
            );
        }

        return {
            account: {
                id: accountResult.id,
                name:
                    normalizedAccountName,
            },
            contact: {
                id: contactResult.id,
                firstName:
                    normalizedFirstName,
                lastName:
                    normalizedLastName,
                email:
                    normalizedEmail,
            },
            instanceUrl,
        };
    };

module.exports = {
    createSalesforceAccountWithContact,
};