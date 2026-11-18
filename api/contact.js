
const saveContact = require("../routes/contact");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const data =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    if (
      !data ||
      typeof data !== "object" ||
      !data.name ||
      !data.email ||
      !data.message
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required."
      });
    }

    const result = await saveContact(data);

    return res.status(201).json(result);
  } catch (error) {
    console.error("Contact API error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to save contact message."
    });
  }
};
