const createError = async(statusCode, message) => {
    const error = new Error(message && message); 
    error.status=statusCode; 
    return error; 
}

const catchAndReturnError = async(res, error) => {
    
    if(error.status) {
        if(error.status === 400) {
            console.log(error.message); 
            return res.status(400).json({errorMessage: error.message || 'Bad Request'}); 
        } 
        if(error.status === 401) {
            return res.status(401).json({errorMessage:error.message}); 
        }
    }
    console.log(error); 
    return res.status(500).json({errorMessage:'Internal server error'}); 
}

module.exports = {
    createError,
    catchAndReturnError, 
}