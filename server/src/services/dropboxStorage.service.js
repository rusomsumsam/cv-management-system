const DROPBOX_TOKEN_URL =
    "https://api.dropbox.com/oauth2/token";

const DROPBOX_UPLOAD_URL =
    "https://content.dropboxapi.com/2/files/upload";

const ACCESS_TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;

let cachedAccessToken = "";
let cachedAccessTokenExpiresAt = 0;

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

const getDropboxOAuthConfiguration = () => ({
    appKey: getRequiredEnvironmentValue(
        "DROPBOX_APP_KEY"
    ),
    appSecret: getRequiredEnvironmentValue(
        "DROPBOX_APP_SECRET"
    ),
    refreshToken: getRequiredEnvironmentValue(
        "DROPBOX_REFRESH_TOKEN"
    ),
});

const hasValidCachedAccessToken = () => {
    if (!cachedAccessToken) {
        return false;
    }

    return (
        Date.now() <
        cachedAccessTokenExpiresAt -
        ACCESS_TOKEN_EXPIRY_MARGIN_MS
    );
};

const getFreshDropboxAccessToken = async () => {
    if (hasValidCachedAccessToken()) {
        return cachedAccessToken;
    }

    const {
        appKey,
        appSecret,
        refreshToken,
    } = getDropboxOAuthConfiguration();

    const requestBody = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: appKey,
        client_secret: appSecret,
    });

    const response = await fetch(
        DROPBOX_TOKEN_URL,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
            },
            body: requestBody.toString(),
        }
    );

    let responseData = null;

    try {
        responseData = await response.json();
    } catch {
        responseData = null;
    }

    if (!response.ok) {
        const tokenError =
            responseData?.error_description ||
            responseData?.error ||
            `Dropbox token refresh failed with status ${response.status}.`;

        throw new Error(tokenError);
    }

    if (
        !responseData ||
        typeof responseData.access_token !== "string" ||
        !responseData.access_token.trim()
    ) {
        throw new Error(
            "Dropbox returned an invalid access token response."
        );
    }

    const expiresInSeconds =
        Number(responseData.expires_in);

    const safeExpiresInSeconds =
        Number.isFinite(expiresInSeconds) &&
            expiresInSeconds > 0
            ? expiresInSeconds
            : 14400;

    cachedAccessToken =
        responseData.access_token.trim();

    cachedAccessTokenExpiresAt =
        Date.now() + safeExpiresInSeconds * 1000;

    return cachedAccessToken;
};

const clearCachedDropboxAccessToken = () => {
    cachedAccessToken = "";
    cachedAccessTokenExpiresAt = 0;
};

const createSafeFileName = (ticket) => {
    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const reporterId =
        typeof ticket?.reportedBy?.id === "string"
            ? ticket.reportedBy.id.trim()
            : "";

    const safeReporterId = reporterId
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 40);

    const reporterSuffix =
        safeReporterId || "unknown-user";

    return `support-ticket-${timestamp}-${reporterSuffix}.json`;
};

const parseDropboxResponse = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const sendDropboxUploadRequest = async ({
    accessToken,
    dropboxPath,
    fileContent,
}) => {
    return fetch(
        DROPBOX_UPLOAD_URL,
        {
            method: "POST",
            headers: {
                Authorization:
                    `Bearer ${accessToken}`,
                "Dropbox-API-Arg": JSON.stringify({
                    path: dropboxPath,
                    mode: "add",
                    autorename: true,
                    mute: false,
                    strict_conflict: false,
                }),
                "Content-Type":
                    "application/octet-stream",
            },
            body: fileContent,
        }
    );
};

const uploadSupportTicketToDropbox = async (ticket) => {
    if (
        !ticket ||
        typeof ticket !== "object" ||
        Array.isArray(ticket)
    ) {
        throw new Error(
            "A valid support ticket object is required."
        );
    }

    const fileName = createSafeFileName(ticket);
    const dropboxPath = `/${fileName}`;

    const fileContent = JSON.stringify(
        ticket,
        null,
        2
    );

    let accessToken =
        await getFreshDropboxAccessToken();

    let response =
        await sendDropboxUploadRequest({
            accessToken,
            dropboxPath,
            fileContent,
        });

    let responseData =
        await parseDropboxResponse(response);

    const errorTag =
        responseData?.error?.[".tag"] || "";

    const authenticationFailed =
        response.status === 401 ||
        errorTag === "expired_access_token" ||
        errorTag === "invalid_access_token";

    if (authenticationFailed) {
        clearCachedDropboxAccessToken();

        accessToken =
            await getFreshDropboxAccessToken();

        response =
            await sendDropboxUploadRequest({
                accessToken,
                dropboxPath,
                fileContent,
            });

        responseData =
            await parseDropboxResponse(response);
    }

    if (!response.ok) {
        const dropboxError =
            responseData?.error_summary ||
            responseData?.error?.[".tag"] ||
            `Dropbox upload failed with status ${response.status}.`;

        throw new Error(dropboxError);
    }

    if (
        !responseData ||
        typeof responseData.id !== "string" ||
        typeof responseData.path_display !== "string"
    ) {
        throw new Error(
            "Dropbox returned an invalid upload response."
        );
    }

    return {
        id: responseData.id,
        name: responseData.name,
        path: responseData.path_display,
        revision: responseData.rev,
        size: responseData.size,
    };
};

module.exports = {
    uploadSupportTicketToDropbox,
};
