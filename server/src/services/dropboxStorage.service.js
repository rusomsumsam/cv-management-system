const DROPBOX_UPLOAD_URL =
    "https://content.dropboxapi.com/2/files/upload";

const getDropboxAccessToken = () => {
    const token = process.env.DROPBOX_ACCESS_TOKEN;

    if (
        typeof token !== "string" ||
        token.trim() === ""
    ) {
        throw new Error(
            "DROPBOX_ACCESS_TOKEN is not configured."
        );
    }

    return token.trim();
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

    const accessToken = getDropboxAccessToken();
    const fileName = createSafeFileName(ticket);
    const dropboxPath = `/${fileName}`;

    const fileContent = JSON.stringify(
        ticket,
        null,
        2
    );

    const response = await fetch(
        DROPBOX_UPLOAD_URL,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
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

    let responseData = null;

    try {
        responseData = await response.json();
    } catch {
        responseData = null;
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
