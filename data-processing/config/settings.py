"""
Configuration settings for the data processing service
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # API Keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_environment: str = os.getenv("PINECONE_ENVIRONMENT", "us-west1-gcp")
    weaviate_url: str = os.getenv("WEAVIATE_URL", "")
    weaviate_api_key: str = os.getenv("WEAVIATE_API_KEY", "")
    
    # Database settings
    postgres_url: str = os.getenv("DATABASE_URL", "postgresql://localhost:5432/avinci")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Model settings
    embedding_model: str = "text-embedding-3-large"
    embedding_dimension: int = 3072
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Vector database settings
    vector_provider: str = os.getenv("VECTOR_PROVIDER", "pinecone")  # pinecone, weaviate, chroma
    pinecone_index_name: str = os.getenv("PINECONE_INDEX_NAME", "avinci-documents")
    weaviate_class_name: str = os.getenv("WEAVIATE_CLASS_NAME", "Document")
    
    # Processing settings
    max_concurrent_requests: int = 10
    batch_size: int = 100
    retry_attempts: int = 3
    timeout_seconds: int = 30
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_file: str = os.getenv("LOG_FILE", "logs/data_processing.log")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()
