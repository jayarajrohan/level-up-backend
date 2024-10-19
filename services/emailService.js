const nodemailer = require("nodemailer");

const getEmailTemplate = (isStudent, username, password) => `
    <div style="font-size: 18px; font-family: Poppins, Arial, sans-serif">
      <div style="text-align:center">
        <div
          style="
            background-color: #006fb7;
            width: 200px;
            text-align: center;
            border-radius: 15px 0;
            font-size: 25px;
            color: #fff;
            font-weight: 500;
            padding: 10px 0;
            display:inline-block;
          "
        >
          Level-Up
        </div>
      </div>
      <div style="margin-top: 30px">
        ${
          isStudent
            ? "Welcome to Level Up! Thank you for joining our platform. We hope the academic support you receive from peers will help you enhance your skills and successfully complete your degree program."
            : "Welcome to Level Up! Thank you for joining our platform as a tutor. We value your contribution."
        }
      </div>
      <div style="margin-top: 30px">Below are your login credentials:</div>
      <div style="margin-top: 10px">Username: ${username}</div>
      <div style="margin-top: 10px">Password: ${password}</div>
      <div style="margin-top: 30px">
        Please use these to log in to the system
      </div>
    </div>`;

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.sendEmail = (isStudent, username, password, to, subject) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    html: getEmailTemplate(isStudent, username, password),
  };

  return transport.sendMail(mailOptions);
};
