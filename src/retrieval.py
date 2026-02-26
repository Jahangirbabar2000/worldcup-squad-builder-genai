"""
Stage 2: Retrieval and semantic search over player documents for the World Cup Squad Builder.

Owner:
    Person A

Purpose:
    - Take the list of player `Document` objects produced by `src.ingestion`.
    - Embed them into a FAISS vector store using OpenAI embeddings.
    - Optionally perform text splitting (e.g., `RecursiveCharacterTextSplitter`) if needed,
      though individual player descriptions are likely short.
    - Expose a retriever wrapper that supports natural-language queries against player
      attributes, e.g., "fast defenders", "young high-potential midfielders",
      "cheap goalkeepers under 10,000 EUR wage".

Dependencies (for implementation):
    - langchain_openai.OpenAIEmbeddings
    - langchain_community.vectorstores.FAISS
    - langchain_text_splitters.RecursiveCharacterTextSplitter
    - langchain_core.documents.Document
"""

from typing import List, Any

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS


def create_vector_store(documents: List[Document]) -> FAISS:
    """
    Create a FAISS vector store from a list of player `Document` objects.

    Responsibilities:
        - Initialize an `OpenAIEmbeddings` instance, typically using the
          "text-embedding-ada-002" model (as covered in class labs).
        - Optionally use `RecursiveCharacterTextSplitter` with settings such as
          `chunk_size=1000`, `chunk_overlap=200` to split long documents if needed.
        - Build a FAISS index from the (optionally split) documents using
          `FAISS.from_documents`.
        - Return the resulting FAISS vector store.

    Parameters:
        documents:
            List of `Document` instances representing individual players, typically
            the output of `src.ingestion.load_and_clean_data()`.

    Returns:
        A `FAISS` vector store containing embeddings for each (possibly split) document.

    Notes for implementation:
        - For this project, splitting may not be necessary because each player
          description is relatively short; include it only if helpful.
        - Ensure that the same embedding configuration is used consistently across
          runs for reproducibility.
    """
    pass


def get_retriever(vector_store: FAISS, k: int = 10) -> Any:
    """
    Wrap the FAISS vector store as a LangChain retriever.

    Responsibilities:
        - Call `vector_store.as_retriever` with search kwargs such as `{"k": k}`.
        - Return the retriever object to be used in downstream reasoning and tools.

    Parameters:
        vector_store:
            The FAISS instance returned by `create_vector_store`.
        k:
            The number of top matching players to retrieve for each query.
            Defaults to 10.

    Returns:
        A retriever object compatible with LangChain's retriever interface
        (e.g., supporting `.invoke(query)` or `.get_relevant_documents(query)`).

    Notes for implementation:
        - The retriever will be consumed by:
            * Person B's reasoning module (`src.reasoning`)
            * Person C's tools module (`src.tools`) and agent orchestration.
    """
    pass


def retrieve_players(query: str, retriever: Any) -> List[Document]:
    """
    Retrieve player documents matching a natural-language query.

    Responsibilities:
        - Accept a user-friendly query string such as:
            "fast center-backs with good defending",
            "best free kick takers",
            "young high-potential midfielders under 50k wage".
        - Use the provided retriever to fetch the most relevant `Document` objects
          corresponding to players that match the described attributes.
        - Return the list of matching `Document` instances.

    Parameters:
        query:
            Natural-language text describing the desired player characteristics.
        retriever:
            A retriever object produced by `get_retriever`, typically wrapping a
            FAISS vector store.

    Returns:
        A list of `Document` objects representing candidate players for the next
        reasoning stage.

    Notes for implementation:
        - Depending on the retriever type, call either:
            * `retriever.invoke(query)` (for LangChain Runnable-style retrievers), or
            * `retriever.get_relevant_documents(query)`.
        - Keep this function thin and focused; more complex logic should live
          in the reasoning stage.
    """
    pass

