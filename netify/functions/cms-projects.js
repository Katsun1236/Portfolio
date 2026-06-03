exports.handler = async function(event, context) {
    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    // Crée une DEUXIÈME base de données sur Notion dédiée aux projets, et mets son ID dans cette variable Netlify
    const NOTION_CMS_DB_ID = process.env.NOTION_CMS_DB_ID; 

    if (!NOTION_API_KEY || !NOTION_CMS_DB_ID) {
        return { statusCode: 500, body: JSON.stringify({ error: "Configuration Notion CMS manquante." }) };
    }

    // --- MÉTHODE GET : RÉCUPÉRER LES PROJETS POUR AFFICHER SUR LE SITE ---
    if (event.httpMethod === "GET") {
        try {
            const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_CMS_DB_ID}/query`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${NOTION_API_KEY}`,
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                },
                // On peut trier par date de création ou ajouter des filtres ici
                body: JSON.stringify({ sorts: [{ timestamp: "created_time", direction: "descending" }] })
            });

            if (!response.ok) throw new Error("Erreur lors de la lecture sur Notion");
            
            const data = await response.json();
            
            // On nettoie la donnée brute de Notion pour envoyer un JSON simple à notre site HTML
            const projects = data.results.map(page => ({
                id: page.id,
                titre: page.properties.Titre?.title[0]?.plain_text || "Sans titre",
                description: page.properties.Description?.rich_text[0]?.plain_text || "",
                image: page.properties.Image?.url || "https://placehold.co/800x400/0a0a1a/00ffcc?text=Image",
                lien: page.properties.Lien?.url || "#",
                categorie: page.properties.Categorie?.select?.name || "Dev",
                stack: page.properties.Stack?.rich_text[0]?.plain_text || ""
            }));

            return { statusCode: 200, body: JSON.stringify(projects) };

        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
        }
    }

    // --- MÉTHODE POST : AJOUTER UN PROJET DEPUIS LA PAGE ADMIN ---
    if (event.httpMethod === "POST") {
        try {
            const { titre, description, image, lien, categorie, stack } = JSON.parse(event.body);

            const response = await fetch("https://api.notion.com/v1/pages", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${NOTION_API_KEY}`,
                    "Content-Type": "application/json",
                    "Notion-Version": "2022-06-28"
                },
                body: JSON.stringify({
                    parent: { database_id: NOTION_CMS_DB_ID },
                    properties: {
                        "Titre": { title: [{ text: { content: titre } }] },
                        "Description": { rich_text: [{ text: { content: description } }] },
                        "Image": { url: image },
                        "Lien": { url: lien || "#" },
                        "Categorie": { select: { name: categorie } },
                        "Stack": { rich_text: [{ text: { content: stack || "" } }] }
                    }
                })
            });

            if (!response.ok) throw new Error("Erreur d'écriture sur Notion");
            return { statusCode: 200, body: JSON.stringify({ message: "Projet ajouté avec succès !" }) };

        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
        }
    }

    return { statusCode: 405, body: "Méthode non autorisée" };
};