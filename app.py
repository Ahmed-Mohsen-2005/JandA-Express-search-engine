from flask import Flask, request, jsonify, render_template
from models.retrievers import search_tfidf, search_bm25, search_unigram, search_pl2, search_word2vec_cbow, search_word2vec_skipgram, search_glove
app = Flask(__name__)

@app.route("/")
def interface():
    return render_template("interface.html")

@app.route("/results")
def results_page():
    query = request.args.get("q", "")
    return render_template("results.html", query=query)


@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q")
    model = request.args.get("model", "tfidf") 

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        if model == "tfidf":
            results = search_tfidf(query)
        elif model == "bm25":
            results = search_bm25(query)
        elif model == "pl2":
            results = search_pl2(query)
        elif model == "unigram":
            results = search_unigram(query)
        elif model == "word2vec-cbow":
            results = search_word2vec_cbow(query)
        elif model == "word2vec-skipgram":
            results = search_word2vec_skipgram(query)
        elif model == "glove":
            results = search_glove(query)
        else:
            return jsonify({"error": "Invalid model"}), 400

        return jsonify(results.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
