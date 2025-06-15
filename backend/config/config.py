import os
from datetime import timedelta

class Config:

    SECRET_KEY = os.environ.get('SECRET_KEY') or 'iter-polaris-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://iter_user:12345678@localhost:5432/iter_polaris'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-string-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"] 
    JWT_COOKIE_CSRF_PROTECT = False