const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body);

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Champs requis manquants' })
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email invalide' })
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `B-Impact — Message de ${name}`,
      html: `
        <h2>Nouveau message</h2>
        <p><strong>${name}</strong> (${email})</p>
        <p>Sujet : ${subject || 'Non spécifié'}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    const autoReply = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Confirmation — B-Impact Studio',
      html: `<h2>Merci ${name} !</h2><p>Nous avons reçu votre message et vous répondrons dans 48h.</p>`
    };

    await transporter.sendMail(autoReply);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email envoyé !' })
    };

  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};