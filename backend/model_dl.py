import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os

MODEL_PATH = "cycle_study_dl.pth"

class CycleStudyNet(nn.Module):
    def __init__(self):
        super().__init__()
        # Réseau profond à 3 couches cachées avec BatchNorm et Dropout pour la cohérence
        self.shared = nn.Sequential(
            nn.Linear(10, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 16),
            nn.ReLU()
        )
        # Tête 1 : Prédiction du score d'énergie/concentration (0 à 1)
        self.capacity_head = nn.Sequential(
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
        # Tête 2 : Classification du type de tâche (4 classes)
        self.task_head = nn.Linear(16, 4)

    def forward(self, x):
        features = self.shared(x)
        capacity = self.capacity_head(features)
        task_logits = self.task_head(features)
        return capacity, task_logits

def generate_coherent_dataset(n_samples=2500):
    X, y_cap, y_task = [], [], []
    for _ in range(n_samples):
        cycle_day = np.random.randint(1, 32)
        if cycle_day <= 5:
            phase = 0  # Menstruelle
            base_energy = 0.45
        elif cycle_day <= 13:
            phase = 1  # Folliculaire
            base_energy = 0.85
        elif cycle_day <= 16:
            phase = 2  # Ovulatoire
            base_energy = 0.92
        else:
            phase = 3  # Lutéale
            base_energy = 0.60 if cycle_day < 24 else 0.40

        cramps = np.random.randint(0, 6) if phase in [0, 3] else np.random.randint(0, 3)
        fatigue = np.random.randint(0, 6)
        brain_fog = np.random.randint(0, 6)
        mood = np.random.randint(1, 6)
        sleep_hours = np.random.uniform(4.0, 10.0)
        sleep_quality = np.random.randint(1, 6)
        stress = np.random.randint(0, 6)
        headache = np.random.choice([0, 1], p=[0.8, 0.2])

        # Calcul physiologique réaliste (non-linéaire)
        score = base_energy
        score -= (cramps * 0.08)
        score -= (fatigue * 0.06)
        score -= (brain_fog * 0.07)
        score += ((sleep_hours - 6.5) * 0.04)
        score += ((sleep_quality - 3) * 0.03)
        score += ((mood - 3) * 0.02)
        score -= (stress * 0.02)
        score -= (headache * 0.15)

        # Cas critiques : douleur intense ou brouillard mental extrême = effondrement
        if cramps >= 4 or brain_fog >= 4:
            score = min(score, 0.25)

        score = float(np.clip(score, 0.05, 0.98))

        if score < 0.30:
            task_class = 0  # Repos / SOS
        elif score < 0.55:
            task_class = 1  # Tâches légères / Fiches
        elif score < 0.78:
            task_class = 2  # Révisions standards
        else:
            task_class = 3  # Deep Work / Chapitres difficiles

        # Normalisation des 10 entrées entre 0 et 1
        row = [
            cycle_day / 35.0, phase / 3.0, cramps / 5.0, fatigue / 5.0,
            brain_fog / 5.0, mood / 5.0, sleep_hours / 12.0,
            sleep_quality / 5.0, stress / 5.0, float(headache)
        ]
        X.append(row)
        y_cap.append([score])
        y_task.append(task_class)

    return torch.tensor(X, dtype=torch.float32), torch.tensor(y_cap, dtype=torch.float32), torch.tensor(y_task, dtype=torch.long)

def get_trained_model():
    model = CycleStudyNet()
    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH))
        model.eval()
        return model

    X, y_cap, y_task = generate_coherent_dataset()
    optimizer = optim.Adam(model.parameters(), lr=0.005)
    mse_loss = nn.MSELoss()
    ce_loss = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(80):
        optimizer.zero_grad()
        pred_cap, pred_task = model(X)
        loss = mse_loss(pred_cap, y_cap) + 0.5 * ce_loss(pred_task, y_task)
        loss.backward()
        optimizer.step()

    torch.save(model.state_dict(), MODEL_PATH)
    model.eval()
    return model
