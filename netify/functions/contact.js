exports.handler = async function(event, context) {
    // On s'assure que la requête est bien un POST (envoi de formulaire)
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Méthode non autorisée" };
    }

    try {
        // Récupération des données envoyées par le site (contact.html)
        const data = JSON.parse(event.body);
        const { name, email, subject, message } = data;

        // Récupération de tes clés secrètes stockées sur Netlify
        // (À configurer dans les paramètres Netlify : Site settings > Environment variables)
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const NOTION_API_KEY = process.env.NOTION_API_KEY;
        const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

        if (!RESEND_API_KEY || !NOTION_API_KEY || !NOTION_DATABASE_ID) {
            console.error("Clés API manquantes dans l'environnement Netlify.");
            return { statusCode: 500, body: JSON.stringify({ error: "Configuration serveur manquante." }) };
        }

        // 1. ENVOI DU MAIL VIA RESEND
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "Contact Portfolio <onboarding@resend.dev>", // À changer avec ton domaine vérifié si tu en as un
                to: "bastienfestor4@gmail.com", // Ton adresse de réception
                subject: `Nouveau message de ${name} : ${subject}`,
                html: `
                    <h2>Nouveau contact depuis le portfolio</h2>
                    <p><strong>Nom :</strong> ${name}</p>
                    <p><strong>Email :</strong> ${email}</p>
                    <p><strong>Sujet :</strong> ${subject}</p>
                    <p><strong>Message :</strong><br>${message.replace(/\n/g, '<br>')}</p>
                `
            })
        });

        if (!resendResponse.ok) {
            const error = await resendResponse.json();
            console.error("Erreur Resend :", error);
            throw new Error("Erreur lors de l'envoi de l'e-mail");
        }

        // 2. AJOUT DANS LA BASE DE DONNÉES NOTION
        // Ta base Notion doit avoir ces colonnes : "Nom" (Titre), "Email" (Email), "Sujet" (Sélection/Texte), "Message" (Texte)
        const notionResponse = await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NOTION_API_KEY}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    "Nom": {
                        title: [ { text: { content: name } } ]
                    },
                    "Email": {
                        email: email
                    },
                    "Sujet": {
                        rich_text: [ { text: { content: subject } } ]
                    },
                    "Message": {
                        rich_text: [ { text: { content: message } } ]
                    }
                }
            })
        });

        if (!notionResponse.ok) {
            const error = await notionResponse.json();
            console.error("Erreur Notion :", error);
            throw new Error("Erreur lors de l'ajout dans Notion");
        }

        // Si tout s'est bien passé, on renvoie un succès au navigateur
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Message envoyé et enregistré avec succès !" })
        };

    } catch (error) {
        console.error("Erreur globale :", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Une erreur est survenue lors du traitement." })
        };
    }
};