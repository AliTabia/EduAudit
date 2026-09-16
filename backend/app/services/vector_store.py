"""
Vector Store Service — ChromaDB-based semantic search.
Stores document embeddings and enables similarity search across the corpus.
Used for duplicate detection and content similarity analysis.

Uses ChromaDB's built-in hash-based embedding function (no model download needed).
"""

import os
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

CHROMA_DIR = Path(__file__).resolve().parents[2] / "data" / "chroma_db"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# Lazy singletons
_client = None
_collection = None


def _hash_embedding_function(texts: List[str]) -> List[List[float]]:
    """
    Lightweight deterministic embedding using character n-gram hashing.
    Produces a 128-dim float vector — no model download, no internet needed.
    Good enough for rough similarity detection in a POC setting.
    """
    embeddings = []
    dim = 128
    for text in texts:
        vec = [0.0] * dim
        text_lower = text.lower()
        # Slide a window of 3-char n-grams and accumulate hashes
        for i in range(max(1, len(text_lower) - 2)):
            ngram = text_lower[i:i + 3]
            h = int(hashlib.md5(ngram.encode()).hexdigest(), 16)
            idx = h % dim
            vec[idx] += 1.0
        # L2-normalise
        norm = sum(x * x for x in vec) ** 0.5 or 1.0
        vec = [x / norm for x in vec]
        embeddings.append(vec)
    return embeddings


def _get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection
    try:
        import chromadb

        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))

        # Use our own embedding function — avoids the ONNX/all-MiniLM download
        from chromadb import EmbeddingFunction, Documents, Embeddings

        class HashEmbeddingFn(EmbeddingFunction):
            def __call__(self, input: Documents) -> Embeddings:
                return _hash_embedding_function(list(input))

        _collection = _client.get_or_create_collection(
            name="pedagogical_documents",
            embedding_function=HashEmbeddingFn(),
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("ChromaDB collection loaded (hash embedding, no download needed).")
        return _collection
    except ImportError:
        logger.warning("chromadb not installed — vector store features disabled.")
        return None
    except Exception as e:
        logger.error(f"ChromaDB init error: {e}")
        return None


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks for embedding."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
    return chunks


def index_document(doc_id: str, text: str, metadata: Dict[str, Any]) -> bool:
    """
    Index a document into ChromaDB for semantic search.
    Returns True if successful, False if vector store unavailable.
    """
    collection = _get_collection()
    if collection is None:
        return False

    try:
        chunks = _chunk_text(text)
        ids = [f"{doc_id}__chunk_{i}" for i in range(len(chunks))]
        metas = [
            {
                "doc_id": doc_id,
                "filename": metadata.get("filename", ""),
                "chunk_index": i,
                "format": metadata.get("format", ""),
            }
            for i in range(len(chunks))
        ]
        collection.add(documents=chunks, ids=ids, metadatas=metas)
        logger.info(f"Indexed {len(chunks)} chunks for doc {doc_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to index document {doc_id}: {e}")
        return False


def find_similar_documents(
    query_text: str,
    doc_id: Optional[str] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Find documents similar to the given text.
    Optionally exclude a specific doc_id (to avoid self-match).

    Returns list of {doc_id, filename, similarity_score, excerpt}
    """
    collection = _get_collection()
    if collection is None:
        return []

    try:
        # Query a sample chunk from the query text
        sample = " ".join(query_text.split()[:300])
        results = collection.query(
            query_texts=[sample],
            n_results=min(top_k + 10, max(collection.count(), 1)),
        )

        seen_docs = set()
        similar = []

        if not results["documents"] or not results["documents"][0]:
            return []

        for doc_text, meta, distance in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            d_id = meta.get("doc_id", "")
            if d_id == doc_id or d_id in seen_docs:
                continue
            seen_docs.add(d_id)
            similarity = round(1 - distance, 4)  # cosine distance → similarity
            similar.append({
                "doc_id": d_id,
                "filename": meta.get("filename", ""),
                "similarity_score": similarity,
                "excerpt": doc_text[:200] + "...",
            })
            if len(similar) >= top_k:
                break

        return similar

    except Exception as e:
        logger.error(f"Similarity search failed: {e}")
        return []


def delete_document(doc_id: str) -> bool:
    """Remove all chunks belonging to a document from the vector store."""
    collection = _get_collection()
    if collection is None:
        return False
    try:
        collection.delete(where={"doc_id": doc_id})
        logger.info(f"Deleted vectors for doc {doc_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete vectors for {doc_id}: {e}")
        return False
