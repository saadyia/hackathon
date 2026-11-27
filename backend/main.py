from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import torch
import torch.nn as nn
import torch.optim as optim
from model_dl import get_trained_model, MODEL_PATH

app = FastAPI(title="CycleStudy Deep Learning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = get_trained_model()

class SymptomsInput(BaseModel):
    cycle_day: int
    phase: int # 0: Menstrual, 1: Follicular, 2: Ovulatory, 3: Luteal
    cramps_pain: int # 0-5
    fatigue_level: int # 0-5
    brain_fog: int # 0-5
    mood_score: int # 1-5
    sleep_hours: float # 0-12
    sleep_quality: int # 1-5
    stress_level: int # 0-5
    headache_nausea: int # 0 ou 1

class TaskItem(BaseModel):
    id: str
    title: str
    difficulty: str # "high", "medium", "low"
    scheduled_day_offset: int # 0 = aujourd'hui, 1 = demain, etc.
    deadline_offset: int

class SOSRequest(BaseModel):
    current_cycle_day: int
    tasks: List[TaskItem]

def normalize_input(data: SymptomsInput):
    return torch.tensor([[
        data.cycle_day / 35.0,
        data.phase / 3.0,
        data.cramps_pain / 5.0,
        data.fatigue_level / 5.0,
        data.brain_fog / 5.0,
        data.mood_score / 5.0,
        data.sleep_hours / 12.0,
        data.sleep_quality / 5.0,
        data.stress_level / 5.0,
        float(data.headache_nausea)
    ]], dtype=torch.float32)

@app.post("/api/predict")
def predict_capacity(data: SymptomsInput):
    x = normalize_input(data)
    with torch.no_grad():
        cap, task_logits = model(x)
        score = round(float(cap.item()) * 100)
        task_idx = int(torch.argmax(task_logits, dim=1).item())

    recommendations = [
        {"type": "rest", "label": "Repos & Récupération", "advice": "Ton corps demande une pause. Reporte les révisions lourdes."},
        {"type": "light_review", "label": "Tâches légères & Fiches", "advice": "Idéal pour relire des notes, classer tes cours ou faire des quiz rapides."},
        {"type": "standard_study", "label": "Révisions régulières", "advice": "Bonne capacité pour faire des exercices et consolider tes acquis."},
        {"type": "deep_work", "label": "Deep Work & Chapitres complexes", "advice": "Pic cognitif détecté ! Attaque les sujets les plus exigeants."}
    ]

    return {
        "cognitive_capacity_percent": score,
        "recommendation": recommendations[task_idx],
        "sos_recommended": score < 30
    }

@app.post("/api/sos-rebalance")
def trigger_sos_mode(req: SOSRequest):
    """
    Bouton SOS : Met la capacité d'aujourd'hui (offset 0) à 0%,
    prédit l'énergie des 7 prochains jours via le modèle DL,
    et déplace les tâches d'aujourd'hui vers les meilleurs jours avant la deadline.
    """
    future_capacities = {}
    for offset in range(1, 8):
        sim_day = ((req.current_cycle_day + offset - 1) % 28) + 1
        sim_phase = 0 if sim_day <= 5 else (1 if sim_day <= 13 else (2 if sim_day <= 16 else 3))
        sim_input = SymptomsInput(
            cycle_day=sim_day, phase=sim_phase, cramps_pain=1 if sim_phase in [0,3] else 0,
            fatigue_level=2, brain_fog=1, mood_score=4, sleep_hours=7.5,
            sleep_quality=4, stress_level=2, headache_nausea=0
        )
        res = predict_capacity(sim_input)
        future_capacities[offset] = res["cognitive_capacity_percent"]

    updated_tasks = []
    moved_count = 0

    for task in req.tasks:
        if task.scheduled_day_offset == 0:
            # Chercher les jours disponibles avant la deadline
            valid_days = [d for d in range(1, min(8, task.deadline_offset + 1))]
            if not valid_days:
                # Deadline aujourd'hui : on ne déplace jamais une tâche après son échéance.
                updated_tasks.append(task)
                continue
            moved_count += 1

            # Si tâche difficile -> jour avec le plus haut score DL ; sinon premier jour correct
            if task.difficulty == "high":
                best_day = max(valid_days, key=lambda d: future_capacities[d])
            else:
                best_day = min(valid_days, key=lambda d: abs(future_capacities[d] - 60))

            task.scheduled_day_offset = best_day
        updated_tasks.append(task)

    return {
        "status": "sos_activated",
        "message": f"Mode SOS activé. {moved_count} tâche(s) replanifiée(s) sur tes prochains pics d'énergie.",
        "future_capacities": future_capacities,
        "updated_tasks": updated_tasks
    }
