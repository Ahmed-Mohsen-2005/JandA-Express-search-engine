import pyterrier as pt
from utils.preprocessing import preprocessing
import pandas as pd

df= pd.read_csv("our_corpus_preprocess.csv")
df["text"] = df["text"].apply(preprocessing)

if not pt.java.started():
    pt.java.init()

indexer = pt.DFIndexer("./myIndex", overwrite=True)
index_ref = indexer.index(df["text"], df["docno"])
index = pt.IndexFactory.of(index_ref)

def search_tfidf(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=20)
    results = retr.search(query).merge(df, on='docno')
    return results[['docno', 'description', 'score']]

def search_bm25(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "BM25"}, num_results=20)
    results = retr.search(query).merge(df, on='docno')
    return results[['docno', 'description', 'score']]

def search_unigram(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, wmodel="Hiemstra_LM")
    results = retr.search(query).merge(df, on='docno')
    return results[['docno', 'description', 'score']]