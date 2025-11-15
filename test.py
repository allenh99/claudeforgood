from dotenv import load_dotenv
load_dotenv()

from backend.workflow import get_feedback

query = 'Sharks typically eat smaller fish that are regional to the area, but also crustaceans, mollusks, and sometimes seals.'
print(get_feedback(query))