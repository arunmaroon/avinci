"""
Avinci Data Processing Service
Main entry point for data processing, NLP, and AI operations
"""

import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from dotenv import load_dotenv

from services.text_processor import TextProcessor
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from services.nlp_analyzer import NLPAnalyzer
from api.data_api import DataAPI
from config.settings import Settings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AvinciDataProcessor:
    """Main data processing orchestrator"""
    
    def __init__(self):
        self.settings = Settings()
        self.text_processor = TextProcessor()
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()
        self.nlp_analyzer = NLPAnalyzer()
        
    async def process_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process a batch of documents"""
        logger.info(f"Processing {len(documents)} documents")
        
        processed_docs = []
        for doc in documents:
            try:
                # Extract text content
                content = await self.text_processor.extract_text(doc)
                
                # Clean and preprocess text
                cleaned_text = self.text_processor.clean_text(content)
                
                # Generate embeddings
                embedding = await self.embedding_service.generate_embedding(cleaned_text)
                
                # Perform NLP analysis
                analysis = await self.nlp_analyzer.analyze(cleaned_text)
                
                # Store in vector database
                vector_id = await self.vector_service.store_document(
                    content=cleaned_text,
                    embedding=embedding,
                    metadata={
                        **doc.get('metadata', {}),
                        'analysis': analysis,
                        'processed_at': pd.Timestamp.now().isoformat()
                    }
                )
                
                processed_doc = {
                    'id': vector_id,
                    'content': cleaned_text,
                    'embedding': embedding,
                    'analysis': analysis,
                    'metadata': doc.get('metadata', {}),
                    'processed_at': pd.Timestamp.now().isoformat()
                }
                
                processed_docs.append(processed_doc)
                logger.info(f"Processed document: {doc.get('id', 'unknown')}")
                
            except Exception as e:
                logger.error(f"Error processing document {doc.get('id', 'unknown')}: {e}")
                continue
        
        return processed_docs
    
    async def search_documents(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search documents using vector similarity"""
        logger.info(f"Searching for: {query}")
        
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_embedding(query)
        
        # Search vector database
        results = await self.vector_service.search_similar(
            query_embedding=query_embedding,
            top_k=top_k
        )
        
        return results
    
    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Perform comprehensive NLP analysis on text"""
        logger.info("Analyzing text")
        
        # Clean text
        cleaned_text = self.text_processor.clean_text(text)
        
        # Perform analysis
        analysis = await self.nlp_analyzer.analyze(cleaned_text)
        
        return analysis

async def main():
    """Main entry point"""
    processor = AvinciDataProcessor()
    
    # Example usage
    sample_documents = [
        {
            'id': 'doc1',
            'content': 'This is a sample document about artificial intelligence and machine learning.',
            'metadata': {'title': 'AI Document', 'type': 'research'}
        },
        {
            'id': 'doc2', 
            'content': 'Natural language processing is a fascinating field of study.',
            'metadata': {'title': 'NLP Document', 'type': 'tutorial'}
        }
    ]
    
    # Process documents
    processed = await processor.process_documents(sample_documents)
    logger.info(f"Processed {len(processed)} documents")
    
    # Search documents
    search_results = await processor.search_documents("artificial intelligence", top_k=5)
    logger.info(f"Found {len(search_results)} similar documents")
    
    # Analyze text
    analysis = await processor.analyze_text("This is a test sentence for analysis.")
    logger.info(f"Analysis results: {analysis}")

if __name__ == "__main__":
    asyncio.run(main())
