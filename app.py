from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from models.retrievers import search_tfidf, search_bm25, search_unigram, search_pl2, search_word2vec_cbow, search_word2vec_skipgram,search_rnn,search_lstm, expand_query_rm3, search_bert
app = Flask(__name__)

@app.route("/")
def interface():
    return render_template("interface.html")

@app.route("/results")
def results_page():
    query = request.args.get("q", "")
    return render_template("results.html", query=query)

client = OpenAI(api_key="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")

@app.route("/ask", methods=["POST"])
def ask():
    user_input = request.json.get("message")

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": user_input}]
    )

    reply = completion.choices[0].message.content
    return jsonify({"reply": reply})

@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q")
    model = request.args.get("model", "tfidf") 
    use_rm3 = request.args.get("rm3", "false").lower() == "true"


    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        if use_rm3 and model in ["bm25", "pl2"]:  
            query = expand_query_rm3(query, model)
        if model == "tfidf":
            results, time = search_tfidf(query)
        elif model == "bm25":
            results, time = search_bm25(query)
        elif model == "pl2":
            results, time = search_pl2(query)
        elif model == "unigram":
            results, time = search_unigram(query)
        elif model == "word2vec-cbow":
            results, time = search_word2vec_cbow(query)
        elif model == "word2vec-skipgram":
            results, time = search_word2vec_skipgram(query)
        elif model == "rnn":
            results, time = search_rnn(query)
        elif model == "lstm":
            results, time = search_lstm(query)
        elif model == "bert":
            results, time = search_bert(query)
        else:
            return jsonify({"error": "Invalid model"}), 400

        return jsonify({"results":results.to_dict(orient="records"), 
                       "search_time":time})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)