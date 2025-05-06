import pyterrier as pt
from utils.preprocessing import preprocessing
import pandas as pd
import os
import random

# Load both corpora
df = pd.read_csv("our_corpus_preprocess.csv")
df2 = pd.read_csv("our_corpus_without_preprocess.csv")

# Ensure 'docno' is string in both
df["docno"] = df.index.astype(str)
df2["docno"] = df2["docno"].astype(str)

# Fill missing data to avoid merge crashes
df2 = df2.fillna("No description available")

# Add fake categories if missing
if "category" not in df2.columns:
    categories = ['electronics', 'fashion', 'home', 'sports', 'images']
    df2["category"] = [random.choice(categories) for _ in range(len(df2))]

# Initialize Terrier
if not pt.started():
    pt.init()

index_path = os.path.abspath("corpus_index")
os.makedirs(index_path, exist_ok=True)

# Only index if it doesn't exist
if not os.path.exists(os.path.join(index_path, "data.properties")):
    indexer = pt.IterDictIndexer(index_path, fields=["text"], meta=["docno"])
    print("Indexing documents...")
    index_ref = indexer.index(df.to_dict("records"))
else:
    print("Index exists. Skipping indexing.")
    index_ref = index_path

# Load the index
index = pt.IndexFactory.of(index_ref)

# --- Retrieval functions ---

def enrich_results(results):
    if 'text' not in results.columns:
        results['text'] = 'No text available'
    if 'category' not in results.columns:
        results['category'] = 'Uncategorized'
    if 'product_name' not in results.columns:
        results['product_name'] = 'Unnamed Product'

    # Return the full document text instead of description
    return results[['docno', 'text', 'rank', 'score', 'category', 'product_name']]



def search_tfidf(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    return enrich_results(results)

def search_bm25(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "BM25"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    return enrich_results(results)

def search_unigram(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, wmodel="Hiemstra_LM", num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    return enrich_results(results)