from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
import json

# モデル初期化（gpt-4o-mini）
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.)

# FastAPI アプリ
app = FastAPI()

# リクエストスキーマ
class TextIn(BaseModel):
    content: str

class EmotionScore(BaseModel):
    emotion: str = Field(..., description="感情の名前")
    score: float = Field(..., description="確信度（0〜1）")

class EmotionAnalysisResponse(BaseModel):
    emotions: List[EmotionScore]

# プロンプトテンプレート
prompt = ChatPromptTemplate.from_template("""
あなたは感情分析AIです。以下の日本語の文章に含まれる感情を列挙してください。
それぞれの感情に 0〜1 のスコア（確信度）を付けてください。

感情は以下の例ように英単語の小文字で表現してください。ただし、以下は例ですので、必ずしもこの中から選ぶ必要はありません。
- joy
- sadness
- anger

文章：
"{text}"
""")

@app.post("/analyze")
def analyze_emotion(data: TextIn):
    chain = prompt | llm.with_structured_output(EmotionAnalysisResponse)

    try:
        result: EmotionAnalysisResponse = chain.invoke({"text": data.content})
        print([{"emotion": item.emotion, "score": item.score} for item in result.emotions], flush=True)
        return [{"emotion": item.emotion, "score": item.score} for item in result.emotions]
    except Exception as e:
        print(f"Error: {e}", flush=True)
        return [{"emotion": "unknown", "score": 0.0, "error": str(e)}]
