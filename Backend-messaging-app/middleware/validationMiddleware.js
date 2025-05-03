export const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    console.log("Validating request fields:", requiredFields)
    console.log("Request body:", req.body)

    const missingFields = []

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        fields: missingFields,
      })
    }

    next()
  }
}
