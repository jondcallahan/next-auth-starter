import nodemailer, { Transporter } from "nodemailer";

export async function getEmailTransporter() {
  try {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  } catch (error) {
    console.error("error", error);
  }
}

export async function sendEmail(
  transporter: Transporter,
  { from = "🏄@example.com", to = "🚀@example.com", subject, html }
) {
  try {
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("////////////////////////////////////");

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    console.log("////////////////////////////////////");
  } catch (error) {
    console.error("error", error);
  }
}
