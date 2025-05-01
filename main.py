from flask import Flask, jsonify, render_template
import sqlite3
import pandas as pd
from sqlalchemy import create_engine

def create_connection(db_file):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except:
        print("db not exist")
    
    return conn


df = pd.read_csv("our_corpus_preprocess.csv")
# df2= pd.read_csv("our_corpus_without_preprocess.csv")
# print(df)
con = create_connection("corpus_processed.db")

df.to_sql('our_corpus_preprocess', con, if_exists='replace')
con.close();

db_url = 'sqlite:///corpus_processed.db'
engine = create_engine(db_url, echo= True)
df_2 = pd.read_sql('select * from our_corpus_preprocess', engine)
print(df_2)

app = Flask(__name__)

@app.route("/")
def homepage():
    return render_template("interface.html")


