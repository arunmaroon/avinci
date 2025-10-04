"""
Embedding generation service using various providers
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer
import tiktoken

from config.settings import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.sentence_transformer = None
        self.encoding = tiktoken.get_encoding("cl100k_base")
        
        # Initialize sentence transformer as fallback
        try:
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logger.warning(f"Could not load sentence transformer: {e}")
    
    async def generate_embedding(self, text: str, model: str = None) -> List[float]:
        """Generate embedding for text using OpenAI API"""
        model = model or settings.embedding_model
        
        try:
            # Truncate text if too long
            text = self._truncate_text(text, model)
            
            response = await self.openai_client.embeddings.create(
                model=model,
                input=text,
                encoding_format="float"
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating OpenAI embedding: {e}")
            # Fallback to sentence transformer
            return await self._generate_fallback_embedding(text)
    
    async def generate_embeddings_batch(self, texts: List[str], model: str = None) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        model = model or settings.embedding_model
        
        try:
            # Truncate texts
            texts = [self._truncate_text(text, model) for text in texts]
            
            response = await self.openai_client.embeddings.create(
                model=model,
                input=texts,
                encoding_format="float"
            )
            
            return [item.embedding for item in response.data]
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            # Fallback to sentence transformer
            return await self._generate_fallback_embeddings_batch(texts)
    
    async def _generate_fallback_embedding(self, text: str) -> List[float]:
        """Generate embedding using sentence transformer as fallback"""
        if not self.sentence_transformer:
            raise Exception("No embedding service available")
        
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None, 
                self.sentence_transformer.encode, 
                text
            )
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating fallback embedding: {e}")
            # Return zero vector as last resort
            return [0.0] * 384  # all-MiniLM-L6-v2 dimension
    
    async def _generate_fallback_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts using sentence transformer"""
        if not self.sentence_transformer:
            raise Exception("No embedding service available")
        
        try:
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None,
                self.sentence_transformer.encode,
                texts
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating fallback batch embeddings: {e}")
            # Return zero vectors as last resort
            return [[0.0] * 384] * len(texts)
    
    def _truncate_text(self, text: str, model: str) -> str:
        """Truncate text to fit model's token limit"""
        if model == "text-embedding-3-large":
            max_tokens = 8191
        elif model == "text-embedding-3-small":
            max_tokens = 8191
        elif model == "text-embedding-ada-002":
            max_tokens = 8191
        else:
            max_tokens = 8191
        
        try:
            tokens = self.encoding.encode(text)
            if len(tokens) <= max_tokens:
                return text
            
            # Truncate and decode back to text
            truncated_tokens = tokens[:max_tokens]
            return self.encoding.decode(truncated_tokens)
        except Exception as e:
            logger.error(f"Error truncating text: {e}")
            # Simple character-based truncation as fallback
            return text[:max_tokens * 4]  # Rough estimate: 4 chars per token
    
    def get_embedding_dimension(self, model: str = None) -> int:
        """Get the dimension of embeddings for a given model"""
        model = model or settings.embedding_model
        
        if model == "text-embedding-3-large":
            return 3072
        elif model == "text-embedding-3-small":
            return 1536
        elif model == "text-embedding-ada-002":
            return 1536
        else:
            return 1536  # Default
    
    async def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute cosine similarity between two embeddings"""
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Compute cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error computing similarity: {e}")
            return 0.0
    
    async def find_most_similar(self, query_embedding: List[float], 
                              document_embeddings: List[List[float]], 
                              top_k: int = 5) -> List[Dict[str, Any]]:
        """Find most similar documents to query embedding"""
        try:
            similarities = []
            
            for i, doc_embedding in enumerate(document_embeddings):
                similarity = await self.compute_similarity(query_embedding, doc_embedding)
                similarities.append({
                    'index': i,
                    'similarity': similarity
                })
            
            # Sort by similarity (descending)
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Error finding similar documents: {e}")
            return []
