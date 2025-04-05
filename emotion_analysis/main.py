from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
import json

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.)

app = FastAPI()

class PostAnalysisRequest(BaseModel):
    content: str

class ReplyAnalysisRequest(BaseModel):
    post: str
    reply: str

class EmotionScore(BaseModel):
    emotion: str = Field(..., description="感情の名前")
    score: float = Field(..., description="確信度（0〜1）")

class EmotionAnalysisResponse(BaseModel):
    emotions: List[EmotionScore]

post_analysis_prompt = ChatPromptTemplate.from_template("""
あなたは感情分析AIです。以下の日本語の文章に含まれる感情を列挙してください。
それぞれの感情に 0〜1 のスコア（確信度）を付けてください。

感情は以下の例ように英単語の小文字で表現してください。ただし、以下は例ですので、必ずしもこの中から選ぶ必要はありません。
- joy
- sadness
- anger

文章：
"{text}"
""")

reply_analysis_prompt = ChatPromptTemplate.from_template("""
あなたは感情分析AIです。以下に与えられる投稿とその投稿への返信について、返信に含まれる感情を列挙してください。
それぞれの感情に 0〜1 のスコア（確信度）を付けてください。
                                                         
感情は以下の例ように英単語の小文字で表現してください。ただし、以下は例ですので、必ずしもこの中から選ぶ必要はありません。
- joy
- sadness
- anger

投稿：
"{post}"
返信：
"{reply}"
""")

@app.post("/analyze_post")
def analyze_emotion_of_post(data: PostAnalysisRequest):
    chain = post_analysis_prompt | llm.with_structured_output(EmotionAnalysisResponse)

    try:
        result: EmotionAnalysisResponse = chain.invoke({"text": data.content})
        print([{"emotion": item.emotion, "score": item.score} for item in result.emotions], flush=True)
        return [{"emotion": item.emotion, "score": item.score} for item in result.emotions]
    except Exception as e:
        print(f"Error: {e}", flush=True)
        return [{"emotion": "unknown", "score": 0.0, "error": str(e)}]

@app.post("/analyze_reply")
def analyze_emotion_of_reply(data: ReplyAnalysisRequest):
    chain = reply_analysis_prompt | llm.with_structured_output(EmotionAnalysisResponse)

    try:
        result: EmotionAnalysisResponse = chain.invoke({"post": data.post, "reply": data.reply})
        print([{"emotion": item.emotion, "score": item.score} for item in result.emotions], flush=True)
        return [{"emotion": item.emotion, "score": item.score} for item in result.emotions]
    except Exception as e:
        print(f"Error: {e}", flush=True)
        return [{"emotion": "unknown", "score": 0.0, "error": str(e)}]