function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function truncate(str, max) {
    if (typeof str !== "string") return "";
    return str.length > max ? str.slice(0, max) : str;
}

function stripNewlines(str) {
    return typeof str === "string" ? str.replace(/[\r\n]+/g, " ").trim() : "";
}

function isValidEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const rateLimitMap = new Map();
const RATE_LIMIT_MS = 60000;

function getClientIp(event) {
    return (
        event.headers["x-nf-client-connection-ip"] ||
        event.headers["client-ip"] ||
        event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        "unknown"
    );
}

function isRateLimited(ip) {
    const last = rateLimitMap.get(ip);
    if (last && Date.now() - last < RATE_LIMIT_MS) return true;
    rateLimitMap.set(ip, Date.now());
    return false;
}

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Méthode non autorisée" };
    }

    try {
        const data = JSON.parse(event.body || "{}");

        if (data.website) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Message envoyé et enregistré avec succès !" }),
            };
        }

        const clientIp = getClientIp(event);
        if (isRateLimited(clientIp)) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: "Trop de messages envoyés. Réessayez dans une minute.",
                }),
            };
        }

        const name = truncate(String(data.name || "").trim(), 200);
        const email = String(data.email || "").trim();
        const subject = truncate(String(data.subject || "").trim(), 200);
        const message = truncate(String(data.message || "").trim(), 5000);

        if (!name || name.length < 2 || !email || !message || message.length < 10) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Nom (2 car. min.), e-mail et message (10 car. min.) sont requis.",
                }),
            };
        }

        if (!isValidEmail(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Adresse e-mail invalide." }),
            };
        }

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const NOTION_API_KEY = process.env.NOTION_API_KEY;
        const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
        const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "B-Impact Studio <onboarding@resend.dev>";
        const CONTACT_TO = process.env.CONTACT_TO_EMAIL || "bastienfestor4@gmail.com";

        if (!RESEND_API_KEY || !NOTION_API_KEY || !NOTION_DATABASE_ID) {
            console.error("Clés API manquantes dans l'environnement Netlify.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configuration serveur manquante." }),
            };
        }

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: RESEND_FROM,
                to: CONTACT_TO,
                reply_to: email,
                subject: `Nouveau message de ${stripNewlines(name)} : ${stripNewlines(subject)}`,
                html: `
                    <h2>Nouveau contact depuis le site B-Impact Studio</h2>
                    <p><strong>Nom :</strong> ${safeName}</p>
                    <p><strong>Email :</strong> ${safeEmail}</p>
                    <p><strong>Sujet :</strong> ${safeSubject}</p>
                    <p><strong>Message :</strong><br>${safeMessage}</p>
                `,
            }),
        });

        if (!resendResponse.ok) {
            const error = await resendResponse.json();
            console.error("Erreur Resend :", error);
            throw new Error("Erreur lors de l'envoi de l'e-mail");
        }

        const notionResponse = await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${NOTION_API_KEY}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28",
            },
            body: JSON.stringify({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    Nom: {
                        title: [{ text: { content: name } }],
                    },
                    Email: {
                        email: email,
                    },
                    Sujet: {
                        rich_text: [{ text: { content: subject } }],
                    },
                    Message: {
                        rich_text: [{ text: { content: message } }],
                    },
                },
            }),
        });

        if (!notionResponse.ok) {
            const error = await notionResponse.json();
            console.error("Erreur Notion :", error);
            throw new Error("Erreur lors de l'ajout dans Notion");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Message envoyé et enregistré avec succès !" }),
        };
    } catch (error) {
        console.error("Erreur globale :", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Une erreur est survenue lors du traitement." }),
        };
    }
};
