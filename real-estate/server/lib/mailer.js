"use strict";
/*
 * Sending av e-post via SMTP (Nodemailer). Innstillingene leses fra miljøvariabler / .env,
 * slik at passordet til e-postkontoen aldri lagres i datafilene eller vises i panelet.
 *
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE (1 = SSL på port 465), SMTP_USER, SMTP_PASS, MAIL_FROM
 *   MAIL_LOG=1  skriver e-postene til konsollen i stedet for å sende dem (for testing)
 */
const nodemailer = require("nodemailer");

function createMailer(env) {
  env = env || process.env;

  if (env.MAIL_LOG === "1") {
    return {
      configured: true,
      server: "console",
      from: env.MAIL_FROM || "site@localhost",
      send(msg) {
        console.log("\n[بريد] إلى: " + [].concat(msg.to).join(", ") + "\n[بريد] الموضوع: " + msg.subject + "\n" + msg.text + "\n");
        return Promise.resolve({ logged: true });
      }
    };
  }

  if (!env.SMTP_HOST) {
    return {
      configured: false,
      server: "",
      from: "",
      send() { return Promise.reject(new Error("لم تُضبط إعدادات خادم البريد (SMTP) على الخادم")); }
    };
  }

  const port = Number(env.SMTP_PORT) || 587;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE === "1" || port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS || "" } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  });
  const from = env.MAIL_FROM || env.SMTP_USER;
  return {
    configured: true,
    server: env.SMTP_HOST,
    from,
    send(msg) { return transport.sendMail(Object.assign({ from }, msg)); }
  };
}

module.exports = { createMailer };
