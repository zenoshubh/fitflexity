const PUBLIC_ROUTES = ["/", "/login"]

const isPublicRoute = (path: string): boolean => {
    return PUBLIC_ROUTES.includes(path);
};

export default isPublicRoute;