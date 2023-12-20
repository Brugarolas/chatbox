from flask import Flask, jsonify, request
from flask import request
from flask_cors import CORS
import pymongo 
from flask_pymongo import PyMongo
import json
from pydash import _
import numpy as np
import pandas as pd
import os
import requests
# from server.routes import index

STATIC_FOLDER = 'server/static'
# STATIC_FOLDER = '../client/dist'
TEMPLATE_FOLDER = '../client/dist'

app = Flask(__name__, static_url_path='', static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER)
# app.config.from_object('config')
CORS(app)


def make_qwen_request(api_key, model, messages):
    url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    payload = {
        'model': model,
        'input': {
            'messages': messages,
        },
        'parameters': {},
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f'Error: {response.status_code} - {response.text}')


@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        # api_host = data.get('api_host')
        # max_context_size = data.get('max_context_size')
        # max_tokens = data.get('max_tokens')
        model = data.get('model')
        # temperature = data.get('temperature')
        messages = data.get('messages')
        print("Generating:", api_key, model, messages)

        # 在这里调用 llm.chat 或者其他逻辑处理 OpenAI 请求
        response = make_qwen_request(api_key, model, messages)
        print("Generating:", response)
        # response = {'success': True, 'message': 'Generation successful'}
        return jsonify(response), 200
    except Exception as e:
        response = {'success': False, 'message': str(e)}
        return jsonify(response), 500


if __name__ == '__main__':
    app.run(port=5000)
