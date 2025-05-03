export const errorHandler = (err, req, res, next) => {
    console.error("Global error handler caught an error:", err)
  
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message })
    }
  
    if (err.status === 404) {
      return res.status(404).json({ message: "Resource not found" })
    }
  
    res.status(500).json({ message: "Something went wrong", error: err.message })
  }
  