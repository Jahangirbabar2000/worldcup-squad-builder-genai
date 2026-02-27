"""
Stage 2: Retrieval and semantic search over player documents for the World Cup Squad Builder.
"""

from typing import List, Any

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings


def create_vector_store(documents: List[Document]) -> FAISS:
    """Build FAISS index from player documents using OpenAI embeddings."""
    embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
    return FAISS.from_documents(documents, embeddings)


def get_retriever(vector_store: FAISS, k: int = 10) -> Any:
    """Return a retriever over the FAISS store with top-k results."""
    return vector_store.as_retriever(search_kwargs={"k": k})


def retrieve_players(query: str, retriever: Any) -> List[Document]:
    """Retrieve player documents matching the natural-language query."""
    return retriever.invoke(query)
