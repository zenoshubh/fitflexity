class ApiError extends Error {
    public statusCode: number;
    public data: any;
    public success: boolean;
    public errors: string[];

    constructor(
        statusCode: number, // HTTP status code (e.g., 400 for Bad Request, 500 for Server Error)
        message: string = "Something went wrong", // Default error message
        errors: string[] = [], // Array to store additional error details (useful for validation errors)
        stack: string = "" // Optional stack trace for debugging
    ) {
        super(message); // Call the parent Error class constructor and set the error message

        this.statusCode = statusCode; // Store HTTP status code
        this.data = null; // Default to null, can be used if additional data is needed
        this.message = message; // Store the provided error message
        this.success = false; // Always false, indicating a failed request
        this.errors = errors; // Store an array of additional error details (useful for form validation)

        // If a stack trace is provided, use it. Otherwise, generate one.
        if (stack) {
            this.stack = stack; // Use the provided stack trace
        } else {
            Error.captureStackTrace(this, this.constructor); // Generate a proper stack trace
        }
    }
}

export { ApiError }; // Export the class for use in other files