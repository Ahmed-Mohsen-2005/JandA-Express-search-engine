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

import re

def parse_flat_text_blob(text):
    fields = ["object","brand", "description", "final_price", "currency", "categories", "url", "image_url", "rating", "discount", "top_review"]
    
    result = {key: 'N/A' for key in fields}
    
    # Use a regex pattern to safely extract each field's value
    pattern = r'(object|brand|description|final_price|currency|categories|url|image_url|rating|discount|top_review):\s*(.*?)(?=\s+\b(?:' + '|'.join(fields) + '):|$)'
    
    matches = re.findall(pattern, text, re.IGNORECASE)
    
    for key, value in matches:
        key = key.strip().lower()
        if key in result:
            result[key] = value.strip().strip(",")
    
    return pd.Series(result)


parsed_df = df2["text"].apply(parse_flat_text_blob)
df2 = pd.concat([df2, parsed_df], axis=1)



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
    if 'title' not in results.columns:
        results['title'] = 'Unnamed Product'


    # Return the full document text instead of description
    return results[['docno', 'rank', 'score', 
                    'object', 'brand', 'description', 'final_price','currency', 'categories',
                    'url', 'image_url', 'rating', 'discount', 'top_review']]



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