import pyterrier as pt
from utils.preprocessing import preprocessing
from gensim.models import Word2Vec
import pandas as pd
import os
import random
from flair.data import Sentence # represent a sentence
from flair.embeddings import WordEmbeddings
from termcolor import colored #add color to text output
from keras.models import Sequential
from keras.layers import SimpleRNN, Dense
from sklearn.preprocessing import LabelEncoder
import numpy as np


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

def search_pl2(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "PL2"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    return enrich_results(results)

def search_unigram(query):
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, wmodel="Hiemstra_LM", num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    return enrich_results(results)

def search_word2vec_cbow(query):
    query = preprocessing(query)
    model = Word2Vec(
    sentences=df["text"].apply(lambda x: x.split()).tolist(),
    vector_size=10,
    window=1,
    min_count=1,
    sg=0,  
    epochs=100)
    words = query.split()
    vectors = [model.wv[word] for word in words if word in model.wv]
    if not vectors:
        return pd.DataFrame() 
    avg_vector = sum(vectors) / len(vectors)
    similar_words = model.wv.similar_by_vector(avg_vector, topn=10)
    similar_words = [word for word, _ in similar_words]
    new_query = " OR ".join(similar_words)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(new_query).merge(df2, on='docno')
    return enrich_results(results)

def search_word2vec_skipgram(query):
    query = preprocessing(query)
    model = Word2Vec(
    sentences=df["text"].apply(lambda x: x.split()).tolist(),
    vector_size=100,
    workers=4,
    epochs=20,
    window=2,
    min_count=1,
    sg=1)
    words = query.split()
    vectors = [model.wv[word] for word in words if word in model.wv]
    if not vectors:
        return pd.DataFrame() 
    avg_vector = sum(vectors) / len(vectors)
    similar_words = model.wv.similar_by_vector(avg_vector, topn=10)
    similar_words = [word for word, _ in similar_words]
    new_query = " OR ".join(similar_words)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(new_query).merge(df2, on='docno')
    return enrich_results(results)

def search_glove(query):
    glove_embedding = WordEmbeddings('glove')
    glove_sentence = Sentence(query)
    glove_embedding.embed(glove_sentence)
    glove_vector = glove_sentence.get_embedding().detach().numpy()
    glove_vector = glove_vector.reshape(1, -1)
    glove_vector = glove_vector.flatten()
    glove_vector = glove_vector.tolist()
    glove_vector = [str(x) for x in glove_vector]
    glove_vector = " ".join(glove_vector)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(glove_vector).merge(df2, on='docno')
    return enrich_results(results)



def search_rnn(query):
    corpus = df["text"].tolist()
    
    tokenized_corpus = [re.findall(r"\w+", doc.lower()) for doc in corpus]
    all_words = [word for doc in tokenized_corpus for word in doc]
    
    le = LabelEncoder()
    encoded_words = le.fit_transform(all_words)
    
    x = encoded_words[:-1]
    y = encoded_words[1:]
    
    x = np.array(x).reshape((len(x), 1, 1))  
    y = np.array(y)
    
    model = Sequential()
    model.add(SimpleRNN(20, activation='relu', input_shape=(1, 1)))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(x, y, epochs=500, verbose=0) 

    # 5. Convert the query to its encoded version
    query_tokens = re.findall(r"\w+", query.lower())
    query_encoded = [le.transform([token])[0] for token in query_tokens if token in le.classes_]

    if not query_encoded:
        return pd.DataFrame()  # No recognizable words

    # 6. Predict the next value from the last token in query
    test_input = np.array(query_encoded[-1]).reshape((1, 1, 1))
    predicted = model.predict(test_input, verbose=0)
    predicted_id = int(round(predicted[0][0]))

    # 7. Try decoding the predicted token
    if predicted_id >= len(le.classes_):
        return pd.DataFrame()
    
    predicted_word = le.inverse_transform([predicted_id])[0]

    # 8. Perform a search using the predicted word
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(predicted_word).merge(df2, on='docno')
    
    return enrich_results(results)