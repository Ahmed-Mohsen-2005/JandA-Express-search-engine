import pyterrier as pt
from utils.preprocessing import preprocessing
from gensim.models import Word2Vec
import pandas as pd
import os
import time
import random
from flair.data import Sentence # represent a sentence
from flair.embeddings import WordEmbeddings
from termcolor import colored #add color to text output
from keras.models import Sequential
from keras.layers import SimpleRNN, Dense
from sklearn.preprocessing import LabelEncoder
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Embedding
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from utils.bert import get_embedding
from sklearn.metrics.pairwise import cosine_similarity


df = pd.read_csv("our_corpus_preprocess.csv")
df2 = pd.read_csv("our_corpus_without_preprocess.csv")

df["docno"] = df.index.astype(str)
df2["docno"] = df2["docno"].astype(str)

df2 = df2.fillna("No description available")

import re

def parse_flat_text_blob(text):
    fields = ["object","brand", "description", "final_price", "currency", "categories", "url", "image_url", "rating", "discount", "top_review"]
    
    result = {key: 'N/A' for key in fields}
    
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

if not os.path.exists(os.path.join(index_path, "data.properties")):
    indexer = pt.IterDictIndexer(index_path, fields=["text"], meta=["docno"])
    print("Indexing documents...")
    index_ref = indexer.index(df.to_dict("records"))
else:
    print("Index exists. Skipping indexing.")
    index_ref = index_path

index = pt.IndexFactory.of(index_ref)


def enrich_results(results):
    return results[['docno', 'rank', 'score', 
                    'object', 'brand', 'description', 'final_price','currency', 'categories',
                    'url', 'image_url', 'rating', 'discount', 'top_review']]



def search_tfidf(query):
    start_time = time.time()
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    retrieved_docs = results['docno'].tolist()  
    end_time = time.time()
    elapsed_time = end_time - start_time
    # metrics = calculate_metrics(retrieved_docs, query)  
    return enrich_results(results), elapsed_time

def search_bm25(query):
    start_time = time.time()
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "BM25"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    retrieved_docs = results['docno'].tolist()  
    end_time = time.time()
    elapsed_time = end_time - start_time
    # metrics = calculate_metrics(retrieved_docs, query)  
    return enrich_results(results), elapsed_time

def search_pl2(query):
    start_time = time.time()
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "PL2"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    retrieved_docs = results['docno'].tolist()
    end_time = time.time()
    elapsed_time = end_time - start_time
    # metrics = calculate_metrics(retrieved_docs, query)  
    return enrich_results(results), elapsed_time

def search_unigram(query):
    start_time = time.time()
    query = preprocessing(query)
    retr = pt.BatchRetrieve(index, controls={"wmodel": "Hiemstra_LM"}, num_results=1000)
    results = retr.search(query).merge(df2, on='docno')
    retrieved_docs = results['docno'].tolist()
    end_time = time.time()
    elapsed_time = end_time - start_time
    # metrics = calculate_metrics(retrieved_docs, query) 
    return enrich_results(results), elapsed_time

def search_word2vec_cbow(query):
    start_time = time.time()
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
    retrieved_docs = results['docno'].tolist() 
    end_time = time.time()
    elapsed_time = end_time - start_time
    # metrics = calculate_metrics(retrieved_docs, query) 
    return enrich_results(results), elapsed_time

def search_word2vec_skipgram(query):
    start_time = time.time()
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
    retrieved_docs = results['docno'].tolist() 
    end_time = time.time()
    elapsed_time = end_time - start_time
    # metrics = calculate_metrics(retrieved_docs, query) 
    return enrich_results(results), elapsed_time


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

    query_tokens = re.findall(r"\w+", query.lower())
    query_encoded = [le.transform([token])[0] for token in query_tokens if token in le.classes_]

    if not query_encoded:
        return pd.DataFrame()  

    test_input = np.array(query_encoded[-1]).reshape((1, 1, 1))
    predicted = model.predict(test_input, verbose=0)
    predicted_id = int(round(predicted[0][0]))

    if predicted_id >= len(le.classes_):
        return pd.DataFrame()
    
    predicted_word = le.inverse_transform([predicted_id])[0]

    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(predicted_word).merge(df2, on='docno')
    
    return enrich_results(results)


def search_lstm(query):
    tokenizer = Tokenizer()
    corpus = df["text"].tolist()
    tokenizer.fit_on_texts()
    total_words = len(tokenizer.word_index) + 1 
    input_sequences = []
    for line in corpus:
        token_list = tokenizer.texts_to_sequences([line])[0]
        for i in range(1, len(token_list)):
            n_gram_sequence = token_list[:i + 1]
            input_sequences.append(n_gram_sequence)

    max_sequence_length = max(len(x) for x in input_sequences)
    input_sequences = pad_sequences(input_sequences, maxlen=max_sequence_length, padding='pre')
    
    X, y = input_sequences[:, :-1], input_sequences[:, -1]
    y = np.array(y)

    model = Sequential()
    model.add(Embedding(total_words, 50, input_length=max_sequence_length - 1))  # Embedding layer
    model.add(LSTM(100))  
    model.add(Dense(total_words, activation='softmax'))  
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    model.fit(X, y, epochs=200, verbose=1)  
    
    query_tokens = re.findall(r"\w+", query.lower())
    query_encoded = tokenizer.texts_to_sequences([query])[0]
    query_sequence = pad_sequences([query_encoded], maxlen=max_sequence_length - 1, padding='pre')

    predicted = model.predict(query_sequence, verbose=0)
    predicted_word_index = np.argmax(predicted, axis=-1)[0]
    predicted_word = tokenizer.index_word[predicted_word_index]

    retr = pt.BatchRetrieve(index, controls={"wmodel": "TF_IDF"}, num_results=1000)
    results = retr.search(predicted_word).merge(df2, on='docno')

    return enrich_results(results)

def expand_query_rm3(query, model="BM25"):
    retr = pt.BatchRetrieve(index_ref, wmodel=model)
    pipeline = retr >> pt.rewrite.RM3(index_ref)
    query_df = pd.DataFrame([{"qid": "1", "query": query}])
    result_df = pipeline.transform(query_df)
    expanded_query = result_df.iloc[0]["query"]
    return expanded_query

def search_bert(query):
    start_time = time.time()
    
    query_embedding = get_embedding(query).unsqueeze(0)  

    doc_embeddings = []
    for doc in df["text"]:
        emb = get_embedding(doc)
        doc_embeddings.append(emb.numpy())

    doc_embeddings = np.stack(doc_embeddings)  

    similarities = cosine_similarity(query_embedding.numpy(), doc_embeddings)[0]

    df_with_scores = df2.copy()
    df_with_scores["score"] = similarities
    results = df_with_scores.sort_values(by="score", ascending=False).head(1000)

    end_time = time.time()
    elapsed_time = end_time - start_time
    
    return enrich_results(results), elapsed_time
# def preprocess(text):
#     return re.sub(r'\W', ' ', text.lower())

# def is_relevant(query, document, overlap_threshold=2):
#     query_keywords = set(preprocess(query).split())
#     document_text = preprocess(document)
    
#     document_keywords = set(document_text.split())
    
#     overlap = query_keywords.intersection(document_keywords)
    
#     if len(overlap) >= overlap_threshold:  
#         return True
#     return False

# def generate_ground_truth(query):
#     ground_truth = {}

#     # Iterate through each query
#     relevant_docs = []
        
#         # Iterate through each document in the dataset
#     for _, row in df.iterrows():
#         doc_id = row['docno']
            
#             # Check relevance in any of the given fields
#         for field in ['text']:
#             if field in row and is_relevant(query, row[field], 1):
#                 relevant_docs.append(doc_id)
#                 break  # Stop once we find one relevant field for the document
        
#         # Store the relevant documents for the query
#     ground_truth[query] = relevant_docs
    
#     return ground_truth

# def calculate_metrics(retrieved_docs, query):
#     # Get the relevant documents for the current query
#     relevant_docs = generate_ground_truth(query).get(query, [])
    
#     if not relevant_docs:
#         return {'precision': 0, 'recall': 0, 'f1_score': 0}  # No relevant documents available
    
#     # Calculate Precision, Recall, and F1-Score
#     retrieved_set = set(retrieved_docs)
#     relevant_set = set(relevant_docs)
    
#     true_positives = len(retrieved_set & relevant_set)
#     false_positives = len(retrieved_set - relevant_set)
#     false_negatives = len(relevant_set - retrieved_set)
    
#     precision = true_positives / (true_positives + false_positives) if true_positives + false_positives > 0 else 0
#     recall = true_positives / (true_positives + false_negatives) if true_positives + false_negatives > 0 else 0
#     f1 = 2 * (precision * recall) / (precision + recall) if precision + recall > 0 else 0
    
#     return {'precision': precision, 'recall': recall, 'f1_score': f1}
