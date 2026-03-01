"""
Stage 2: Retrieval and semantic search over player documents for the World Cup Squad Builder.
"""

import os
from typing import List, Any

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings


def _get_embeddings() -> OpenAIEmbeddings:
    """Shared embedding model so save/load use the same dimensions."""
    return OpenAIEmbeddings(model="text-embedding-ada-002")


def create_vector_store(documents: List[Document]) -> FAISS:
    """Build FAISS index from player documents using OpenAI embeddings."""
    return FAISS.from_documents(documents, _get_embeddings())


def load_vector_store(folder_path: str) -> FAISS:
    """Load a persisted FAISS index from disk. Uses same embedding model as create_vector_store."""
    return FAISS.load_local(folder_path, _get_embeddings(), allow_dangerous_deserialization=True)


def save_vector_store(vector_store: FAISS, folder_path: str) -> None:
    """Persist FAISS index to disk for faster startup next time."""
    os.makedirs(os.path.dirname(folder_path) or ".", exist_ok=True)
    vector_store.save_local(folder_path)


def get_retriever(vector_store: FAISS, k: int = 10) -> Any:
    """Return a retriever over the FAISS store with top-k results."""
    return vector_store.as_retriever(search_kwargs={"k": k})


def retrieve_players(query: str, retriever: Any) -> List[Document]:
    """Retrieve player documents matching the natural-language query."""
    return retriever.invoke(query)
