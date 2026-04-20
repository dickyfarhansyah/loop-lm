from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, status_code: int, message: str):
        super().__init__(status_code=status_code, detail=message)


class BadRequestError(AppError):
    def __init__(self, message: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, message=message)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, message=message)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, message=message)
