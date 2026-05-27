let errorMiddleware = (err, req, res, next)=>{
    let message = err.message || "Internal Server Error";
    let statusCode = err.statusCode || 500;


    return res.status(500).json({
        message,
        success: false,
    })
}

module.exports = errorMiddleware