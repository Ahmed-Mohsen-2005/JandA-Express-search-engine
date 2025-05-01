# from flask import Flask, jsonify, render_template
# import sqlite3
# import pandas as pd
# from sqlalchemy import create_engine

# def create_connection(db_file):
#     conn = None
#     try:
#         conn = sqlite3.connect(db_file)
#     except:
#         print("db not exist")
    
#     return conn


# df = pd.read_csv("our_corpus_preprocess.csv")
# # df2= pd.read_csv("our_corpus_without_preprocess.csv")
# # print(df)
# con = create_connection("corpus_processed.db")

# df.to_sql('our_corpus_preprocess', con, if_exists='replace')
# con.close();

# db_url = 'sqlite:///corpus_processed.db'
# engine = create_engine(db_url, echo= True)
# df_2 = pd.read_sql('select * from our_corpus_preprocess', engine)
# print(df_2)

# app = Flask(__name__)

# @app.route("/")
# def homepage():
#     return render_template("interface.html")

from flask import Flask, request, jsonify, render_template
from models.retrievers import search_tfidf, search_bm25, search_unigram

app = Flask(__name__)

@app.route("/")
def interface():
    return render_template("interface.html")

@app.route("/results")
def results_page():
    return render_template("results.html")

@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q")
    model = request.args.get("model", "tfidf")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    if model == "tfidf":
        results = search_tfidf(query)
    elif model == "bm25":
        results = search_bm25(query)
    elif model == "unigram":
        results = search_unigram(query)
    else:
        return jsonify({"error": "Invalid model"}), 400

    return jsonify(results.to_dict(orient="records"))

if __name__ == "__main__":
    app.run(debug=True)