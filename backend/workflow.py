import os, shutil

from .chatbot import Chatbot

database_file = "backend/data/history.txt"
images_folder = "backend/data/images"
context_file  = "backend/context.txt"

def reset_data():
    with open(database_file, 'w') as f:
        pass
    for file_name in os.scandir(images_folder):
        os.remove(file_name)

def begin_conversation():
    with open(database_file) as f:
        f