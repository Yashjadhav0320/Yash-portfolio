
const supabase = require("../config/supabase");

async function saveContact(data) {
  const { name, email, subject, message } = data || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    const error = new Error("Name, email and message are required.");
    error.statusCode = 400;
    throw error;
  }

  const { data: savedData, error } = await supabase
    .from("contact_messages")
    .insert({
      name: name.trim(),
      email: email.trim(),
      subject: typeof subject === "string" ? subject.trim() : null,
      message: message.trim()
    })
    .select();

  if (error) {
    console.error("SUPABASE INSERT FAILED:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });

    throw new Error(
      `Supabase error: ${error.message} | Code: ${error.code}`
    );
  }

  return {
    success: true,
    message: "Your message has been sent successfully!",
    data: savedData
  };
}

module.exports = saveContact;
