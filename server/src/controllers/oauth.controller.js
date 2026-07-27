// server/src/controllers/oauth.controller.js
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { PrismaClient, Prisma } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getEnvVar = (name) => {
    const value = process.env[name];
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${name} is not configured.`);
    }
    return value.trim();
};

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (typeof secret !== "string" || !secret.trim()) {
        throw new Error("JWT_SECRET is not configured.");
    }
    return secret;
};

const createToken = (user) => {
    const secret = getJwtSecret();
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        secret,
        {
            expiresIn: "7d",
        }
    );
};

const getCookieOptions = (maxAge = null, path = "/") => {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path,
    };
    if (maxAge !== null) {
        options.maxAge = maxAge;
    }
    return options;
};

const getStateCookieOptions = (path = "/api/auth") => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path,
    };
};

const getStateCookieClearOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
});

const parseBaseUrl = (name) => {
    const value = getEnvVar(name);
    let parsedUrl;
    try {
        parsedUrl = new URL(value);
    } catch {
        throw new Error(`${name} is invalid.`);
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error(`${name} must use HTTP or HTTPS.`);
    }
    parsedUrl.hash = "";
    parsedUrl.search = "";
    return parsedUrl.toString().replace(/\/+$/, "");
};

const getServerUrl = () => parseBaseUrl("SERVER_URL");
const getClientUrl = () => parseBaseUrl("CLIENT_URL");

const generateState = () => {
    return crypto.randomBytes(32).toString("hex");
};

const safeRedirect = (res, errorCode = null) => {
    const clientUrl = getClientUrl();
    let redirectUrl;
    if (errorCode) {
        const allowedCodes = [
            "oauth_cancelled",
            "oauth_state_invalid",
            "oauth_configuration",
            "oauth_provider_error",
            "oauth_email_unavailable",
            "oauth_email_unverified",
            "oauth_account_conflict",
            "oauth_login_failed",
            "oauth_account_blocked",
        ];
        const safeCode = allowedCodes.includes(errorCode) ? errorCode : "oauth_login_failed";
        const url = new URL("/login", `${clientUrl}/`);
        url.searchParams.set("oauthError", safeCode);
        redirectUrl = url.toString();
    } else {
        redirectUrl = new URL("/dashboard", `${clientUrl}/`).toString();
    }
    return res.redirect(redirectUrl);
};

const validateState = (queryState, cookieState) => {
    if (typeof queryState !== "string" || typeof cookieState !== "string") {
        return false;
    }
    if (queryState.length === 0 || cookieState.length === 0) {
        return false;
    }
    const stateBuffer = Buffer.from(queryState, "utf8");
    const cookieBuffer = Buffer.from(cookieState, "utf8");
    if (stateBuffer.length !== cookieBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(stateBuffer, cookieBuffer);
};

const normalizeName = (name, fallback) => {
    if (typeof name !== "string") {
        return fallback;
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return fallback;
    }
    const cleaned = trimmed.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ");
    if (cleaned.length === 0) {
        return fallback;
    }
    return cleaned.slice(0, MAX_NAME_LENGTH);
};

const normalizeEmail = (email) => {
    if (typeof email !== "string") {
        throw new Error("Email is required.");
    }
    const trimmed = email.trim();
    if (trimmed.length === 0) {
        throw new Error("Email is required.");
    }
    const lowercased = trimmed.toLowerCase();
    if (lowercased.length > MAX_EMAIL_LENGTH) {
        throw new Error("Email exceeds maximum length.");
    }
    if (!EMAIL_PATTERN.test(lowercased)) {
        throw new Error("Invalid email format.");
    }
    return lowercased;
};

const normalizeProfilePhoto = (url) => {
    if (typeof url !== "string") {
        return null;
    }
    const trimmed = url.trim();
    if (trimmed.length === 0 || trimmed.length > 2048) {
        return null;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return null;
    }
    return trimmed;
};

const getOAuthFirstLastName = (provider, profile) => {
    let firstName = "OAuth";
    let lastName = "User";

    if (provider === "GOOGLE") {
        const givenName = normalizeName(profile.given_name, null);
        const familyName = normalizeName(profile.family_name, null);
        const fullName = normalizeName(profile.name, null);
        const emailLocal = profile.email ? profile.email.split("@")[0] : null;

        firstName = givenName || fullName?.split(" ")[0] || emailLocal || "OAuth";
        lastName = familyName || (fullName && fullName.split(" ").slice(1).join(" ")) || "User";
    } else if (provider === "GITHUB") {
        const fullName = normalizeName(profile.name, null);
        if (fullName && fullName.includes(" ")) {
            const parts = fullName.split(" ");
            firstName = parts[0];
            lastName = parts.slice(1).join(" ");
        } else if (fullName) {
            firstName = fullName;
            lastName = "User";
        } else {
            const loginName = normalizeName(profile.login, null);
            if (loginName) {
                firstName = loginName;
                lastName = "User";
            } else {
                firstName = "GitHub";
                lastName = "User";
            }
        }
    }

    firstName = normalizeName(firstName, "OAuth");
    lastName = normalizeName(lastName, "User");

    if (!firstName || firstName.length < MIN_NAME_LENGTH) firstName = "OAuth";
    if (!lastName || lastName.length < MIN_NAME_LENGTH) lastName = "User";

    return { firstName, lastName };
};

const createOAuthTokenCookie = (res, user) => {
    const token = createToken(user);
    res.cookie("token", token, getCookieOptions(COOKIE_MAX_AGE, "/"));
};

const findOrCreateOAuthUser = async ({ provider, providerAccountId, email, firstName, lastName, profilePhoto }) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = normalizeName(firstName, "OAuth");
    const normalizedLastName = normalizeName(lastName, "User");
    const normalizedPhoto = normalizeProfilePhoto(profilePhoto);

    try {
        return await prisma.$transaction(async (tx) => {
            // Check if OAuthAccount already exists
            const existingAccount = await tx.oAuthAccount.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider,
                        providerAccountId,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            profilePhoto: true,
                            isBlocked: true,
                        },
                    },
                },
            });

            if (existingAccount) {
                const user = existingAccount.user;
                if (user.isBlocked === true) {
                    throw new Error("oauth_account_blocked");
                }
                // Return existing user without updating first/last name
                // Update profilePhoto only if null and we have a valid one
                if (!user.profilePhoto && normalizedPhoto) {
                    await tx.user.update({
                        where: { id: user.id },
                        data: { profilePhoto: normalizedPhoto },
                    });
                    user.profilePhoto = normalizedPhoto;
                }
                return {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    profilePhoto: user.profilePhoto,
                };
            }

            // Look for existing user by email
            const existingUser = await tx.user.findUnique({
                where: { email: normalizedEmail },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    profilePhoto: true,
                    isBlocked: true,
                    oauthAccounts: {
                        select: {
                            provider: true,
                            providerAccountId: true,
                        },
                    },
                },
            });

            if (existingUser) {
                if (existingUser.isBlocked === true) {
                    throw new Error("oauth_account_blocked");
                }
                // Check if this user already has this provider linked to a different account
                const existingProviderAccount = existingUser.oauthAccounts.find(
                    (acc) => acc.provider === provider
                );
                if (existingProviderAccount) {
                    throw new Error("oauth_account_conflict");
                }

                // Link provider to existing user
                await tx.oAuthAccount.create({
                    data: {
                        provider,
                        providerAccountId,
                        userId: existingUser.id,
                    },
                });

                // Update profilePhoto only if null
                if (!existingUser.profilePhoto && normalizedPhoto) {
                    await tx.user.update({
                        where: { id: existingUser.id },
                        data: { profilePhoto: normalizedPhoto },
                    });
                    existingUser.profilePhoto = normalizedPhoto;
                }

                return {
                    id: existingUser.id,
                    firstName: existingUser.firstName,
                    lastName: existingUser.lastName,
                    email: existingUser.email,
                    role: existingUser.role,
                    profilePhoto: existingUser.profilePhoto,
                };
            }

            // Create new user
            const newUser = await tx.user.create({
                data: {
                    firstName: normalizedFirstName,
                    lastName: normalizedLastName,
                    email: normalizedEmail,
                    password: null,
                    role: "CANDIDATE",
                    isBlocked: false,
                    profilePhoto: normalizedPhoto,
                    oauthAccounts: {
                        create: {
                            provider,
                            providerAccountId,
                        },
                    },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    profilePhoto: true,
                    isBlocked: true,
                },
            });

            return newUser;
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            // Unique constraint violation - retry once by fetching the account
            let retryAccount;
            try {
                retryAccount = await prisma.oAuthAccount.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider,
                            providerAccountId,
                        },
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                profilePhoto: true,
                                isBlocked: true,
                            },
                        },
                    },
                });
            } catch {
                throw new Error("oauth_account_conflict");
            }

            if (!retryAccount) {
                throw new Error("oauth_account_conflict");
            }

            const user = retryAccount.user;
            if (user.isBlocked === true) {
                throw new Error("oauth_account_blocked");
            }

            if (!user.profilePhoto && normalizedPhoto) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { profilePhoto: normalizedPhoto },
                });
                user.profilePhoto = normalizedPhoto;
            }

            return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto,
            };
        }
        throw error;
    }
};

const startGoogleOAuth = (req, res) => {
    try {
        const clientId = getEnvVar("GOOGLE_CLIENT_ID");
        const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
        const serverUrl = getServerUrl();

        const callbackUrl = `${serverUrl}/api/auth/google/callback`;

        const oauth2Client = new OAuth2Client(clientId, clientSecret, callbackUrl);

        const state = generateState();
        res.cookie("cvms_google_oauth_state", state, getStateCookieOptions("/api/auth"));

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "online",
            scope: ["openid", "email", "profile"],
            include_granted_scopes: true,
            prompt: "select_account",
            state,
        });

        return res.redirect(authUrl);
    } catch (error) {
        console.error("Google OAuth start error:", error.message);
        return safeRedirect(res, "oauth_configuration");
    }
};

const handleGoogleCallback = async (req, res) => {
    try {
        // Check for cancellation
        if (req.query.error) {
            res.clearCookie("cvms_google_oauth_state", getStateCookieClearOptions());
            return safeRedirect(res, "oauth_cancelled");
        }

        const clientId = getEnvVar("GOOGLE_CLIENT_ID");
        const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
        const serverUrl = getServerUrl();

        const callbackUrl = `${serverUrl}/api/auth/google/callback`;
        const oauth2Client = new OAuth2Client(clientId, clientSecret, callbackUrl);

        const stateParam = req.query.state;
        const stateCookie = req.cookies?.cvms_google_oauth_state;

        // Clear state cookie early
        res.clearCookie("cvms_google_oauth_state", getStateCookieClearOptions());

        if (!validateState(stateParam, stateCookie)) {
            return safeRedirect(res, "oauth_state_invalid");
        }

        const code = req.query.code;
        if (typeof code !== "string" || !code.trim()) {
            return safeRedirect(res, "oauth_provider_error");
        }

        let tokenResponse;
        try {
            tokenResponse = await oauth2Client.getToken(code);
        } catch (error) {
            console.error("Google OAuth getToken error:", error.message);
            return safeRedirect(res, "oauth_provider_error");
        }

        const idToken = tokenResponse.tokens?.id_token;
        if (typeof idToken !== "string" || !idToken.trim()) {
            return safeRedirect(res, "oauth_provider_error");
        }

        let ticket;
        try {
            ticket = await oauth2Client.verifyIdToken({
                idToken,
                audience: clientId,
            });
        } catch (error) {
            console.error("Google OAuth verifyIdToken error:", error.message);
            return safeRedirect(res, "oauth_provider_error");
        }

        const payload = ticket.getPayload();
        if (!payload || typeof payload !== "object") {
            return safeRedirect(res, "oauth_provider_error");
        }

        const sub = payload.sub;
        const email = payload.email;
        const emailVerified = payload.email_verified;

        if (typeof sub !== "string" || !sub.trim()) {
            return safeRedirect(res, "oauth_provider_error");
        }
        if (typeof email !== "string" || !email.trim()) {
            return safeRedirect(res, "oauth_email_unavailable");
        }
        if (emailVerified !== true) {
            return safeRedirect(res, "oauth_email_unverified");
        }

        const normalizedEmail = normalizeEmail(email);
        const profilePhoto = normalizeProfilePhoto(payload.picture);
        const { firstName, lastName } = getOAuthFirstLastName("GOOGLE", payload);

        let user;
        try {
            user = await findOrCreateOAuthUser({
                provider: "GOOGLE",
                providerAccountId: sub.trim(),
                email: normalizedEmail,
                firstName,
                lastName,
                profilePhoto,
            });
        } catch (error) {
            if (error.message === "oauth_account_conflict") {
                return safeRedirect(res, "oauth_account_conflict");
            }
            if (error.message === "oauth_account_blocked") {
                return safeRedirect(res, "oauth_account_blocked");
            }
            throw error;
        }

        createOAuthTokenCookie(res, user);
        return safeRedirect(res, null);
    } catch (error) {
        console.error("Google OAuth callback error:", error.message);
        return safeRedirect(res, "oauth_login_failed");
    }
};

const startGitHubOAuth = (req, res) => {
    try {
        const clientId = getEnvVar("GITHUB_CLIENT_ID");
        const serverUrl = getServerUrl();
        const callbackUrl = `${serverUrl}/api/auth/github/callback`;

        const state = generateState();
        res.cookie("cvms_github_oauth_state", state, getStateCookieOptions("/api/auth"));

        const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
        authorizationUrl.searchParams.set("client_id", clientId);
        authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
        authorizationUrl.searchParams.set("scope", "read:user user:email");
        authorizationUrl.searchParams.set("state", state);

        return res.redirect(authorizationUrl.toString());
    } catch (error) {
        console.error("GitHub OAuth start error:", error.message);
        return safeRedirect(res, "oauth_configuration");
    }
};

const handleGitHubCallback = async (req, res) => {
    try {
        if (req.query.error) {
            res.clearCookie("cvms_github_oauth_state", getStateCookieClearOptions());
            return safeRedirect(res, "oauth_cancelled");
        }

        const clientId = getEnvVar("GITHUB_CLIENT_ID");
        const clientSecret = getEnvVar("GITHUB_CLIENT_SECRET");
        const serverUrl = getServerUrl();
        const callbackUrl = `${serverUrl}/api/auth/github/callback`;

        const stateParam = req.query.state;
        const stateCookie = req.cookies?.cvms_github_oauth_state;

        res.clearCookie("cvms_github_oauth_state", getStateCookieClearOptions());

        if (!validateState(stateParam, stateCookie)) {
            return safeRedirect(res, "oauth_state_invalid");
        }

        const code = req.query.code;
        if (typeof code !== "string" || !code.trim()) {
            return safeRedirect(res, "oauth_provider_error");
        }

        // Exchange code for access token
        let tokenData;
        try {
            const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "CVMS-OAuth",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    redirect_uri: callbackUrl,
                }),
            });

            if (!tokenResponse.ok) {
                return safeRedirect(res, "oauth_provider_error");
            }

            tokenData = await tokenResponse.json();
        } catch (error) {
            console.error("GitHub OAuth token exchange error:", error.message);
            return safeRedirect(res, "oauth_provider_error");
        }

        const accessToken = tokenData.access_token;
        if (typeof accessToken !== "string" || !accessToken.trim()) {
            return safeRedirect(res, "oauth_provider_error");
        }

        // Fetch user profile
        let profile;
        try {
            const profileResponse = await fetch("https://api.github.com/user", {
                headers: {
                    "Accept": "application/vnd.github+json",
                    "Authorization": `Bearer ${accessToken}`,
                    "User-Agent": "CVMS-OAuth",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });

            if (!profileResponse.ok) {
                return safeRedirect(res, "oauth_provider_error");
            }

            profile = await profileResponse.json();
        } catch (error) {
            console.error("GitHub OAuth user profile error:", error.message);
            return safeRedirect(res, "oauth_provider_error");
        }

        if (typeof profile.id !== "number" && typeof profile.id !== "string") {
            return safeRedirect(res, "oauth_provider_error");
        }
        if (typeof profile.login !== "string" || !profile.login.trim()) {
            return safeRedirect(res, "oauth_provider_error");
        }
        const providerAccountId = String(profile.id);

        // Fetch user emails
        let emails = [];
        try {
            const emailsResponse = await fetch("https://api.github.com/user/emails", {
                headers: {
                    "Accept": "application/vnd.github+json",
                    "Authorization": `Bearer ${accessToken}`,
                    "User-Agent": "CVMS-OAuth",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });

            if (!emailsResponse.ok) {
                return safeRedirect(res, "oauth_email_unavailable");
            }

            emails = await emailsResponse.json();
        } catch (error) {
            console.error("GitHub OAuth emails fetch error:", error.message);
            return safeRedirect(res, "oauth_email_unavailable");
        }

        // Find verified email
        let verifiedEmail = null;
        if (Array.isArray(emails) && emails.length > 0) {
            // Priority: primary + verified, then any verified
            const primaryVerified = emails.find((e) => e.primary === true && e.verified === true);
            if (primaryVerified) {
                verifiedEmail = primaryVerified.email;
            } else {
                const anyVerified = emails.find((e) => e.verified === true);
                if (anyVerified) {
                    verifiedEmail = anyVerified.email;
                }
            }
        }

        if (!verifiedEmail || typeof verifiedEmail !== "string" || !verifiedEmail.trim()) {
            return safeRedirect(res, "oauth_email_unavailable");
        }

        const normalizedEmail = normalizeEmail(verifiedEmail);
        const profilePhoto = normalizeProfilePhoto(profile.avatar_url);
        const { firstName, lastName } = getOAuthFirstLastName("GITHUB", profile);

        let user;
        try {
            user = await findOrCreateOAuthUser({
                provider: "GITHUB",
                providerAccountId,
                email: normalizedEmail,
                firstName,
                lastName,
                profilePhoto,
            });
        } catch (error) {
            if (error.message === "oauth_account_conflict") {
                return safeRedirect(res, "oauth_account_conflict");
            }
            if (error.message === "oauth_account_blocked") {
                return safeRedirect(res, "oauth_account_blocked");
            }
            throw error;
        }

        createOAuthTokenCookie(res, user);
        return safeRedirect(res, null);
    } catch (error) {
        console.error("GitHub OAuth callback error:", error.message);
        return safeRedirect(res, "oauth_login_failed");
    }
};

module.exports = {
    startGoogleOAuth,
    handleGoogleCallback,
    startGitHubOAuth,
    handleGitHubCallback,
};