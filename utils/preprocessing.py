import pandas as pd
import numpy as np

import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer
import re

nltk.download('wordnet')
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('punkt_tab')

stop_words=stopwords.words('english')

stemmer = PorterStemmer()
wnl = WordNetLemmatizer()


def preprocessing(text):
    text = text.lower()
    text = re.sub("[^a-z \:]+", "", text)
    result = []
    for word in text.split():
        if word not in stop_words:
            word = wnl.lemmatize(word, "n")
            word = wnl.lemmatize(word, "v")
            word = wnl.lemmatize(word, "a")
            word = stemmer.stem(word)
            result.append(word)
    return " ".join(result)